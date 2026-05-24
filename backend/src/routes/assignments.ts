import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { getGenerationQueue } from '../queues/generationQueue';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.jpg', '.jpeg', '.png'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const assignmentValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('className').trim().notEmpty().withMessage('Class is required'),
  body('dueDate').notEmpty().withMessage('Due date is required'),
];

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).select('-__v').lean();
    if (!assignment) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: assignment });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch assignment' });
  }
});

router.get('/:id/result', async (req: Request, res: Response) => {
  try {
    const result = await Result.findOne({ assignmentId: req.params.id })
      .select('-rawPrompt -__v')
      .lean();
    if (!result) return res.status(404).json({ success: false, error: 'Result not found' });
    res.json({ success: true, data: result });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch result' });
  }
});

router.post(
  '/',
  upload.single('file'),
  assignmentValidation,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { title, subject, className, dueDate, questionTypes, additionalInstructions } =
        req.body;

      const parsedTypes =
        typeof questionTypes === 'string' ? JSON.parse(questionTypes) : questionTypes;

      if (!Array.isArray(parsedTypes) || parsedTypes.length === 0) {
        return res.status(400).json({ success: false, errors: [{ msg: 'At least one question type is required' }] });
      }

      for (const qt of parsedTypes) {
        if (!qt.count || qt.count < 1) {
          return res.status(400).json({ success: false, errors: [{ msg: 'Question count must be at least 1' }] });
        }
        if (!qt.marks || qt.marks < 1) {
          return res.status(400).json({ success: false, errors: [{ msg: 'Marks must be at least 1' }] });
        }
      }

      const assignment = await Assignment.create({
        title,
        subject,
        className,
        dueDate: new Date(dueDate),
        questionTypes: parsedTypes,
        additionalInstructions: additionalInstructions || '',
        filePath: req.file?.path,
        fileName: req.file?.originalname,
        status: 'pending',
      });

      const queue = getGenerationQueue();
      const job = await queue.add('generate', { assignmentId: assignment._id.toString() });
      await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id });

      res.status(201).json({
        success: true,
        data: { ...assignment.toObject(), jobId: job.id },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Failed to create assignment' });
    }
  }
);

router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, error: 'Not found' });

    if (assignment.status === 'processing') {
      return res.status(409).json({ success: false, error: 'Generation already in progress' });
    }

    // Delete old result and reset status
    await Result.deleteOne({ assignmentId: req.params.id });
    await Assignment.findByIdAndUpdate(req.params.id, {
      status: 'pending',
      jobId: null,
      errorMessage: null,
    });

    const queue = getGenerationQueue();
    const job = await queue.add('generate', { assignmentId: req.params.id });
    await Assignment.findByIdAndUpdate(req.params.id, { jobId: job.id });

    res.json({ success: true, data: { jobId: job.id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to regenerate' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, error: 'Not found' });
    await Result.deleteOne({ assignmentId: req.params.id });
    res.json({ success: true, message: 'Assignment deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete assignment' });
  }
});

export default router;
