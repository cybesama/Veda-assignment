import fs from 'fs';
import path from 'path';

export interface ExtractedFile {
  type: 'text' | 'image';
  content: string;
  mimeType?: string;
}

export async function extractFileContent(filePath: string): Promise<ExtractedFile | null> {
  // Resolve to absolute path — works regardless of CWD
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absPath)) {
    console.warn(`[FileService] File not found: ${absPath} (original: ${filePath})`);
    return null;
  }

  const ext = path.extname(absPath).toLowerCase();
  console.log(`[FileService] Extracting ${ext} file: ${absPath}`);

  try {
    if (ext === '.pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
      const buffer = fs.readFileSync(absPath);
      const data = await pdfParse(buffer);
      const text = data.text.trim();
      console.log(`[FileService] PDF extracted: ${data.numpages} pages, ${text.length} chars`);
      if (!text) {
        console.warn('[FileService] PDF extracted but text is empty — may be scanned/image PDF');
        return null;
      }
      return { type: 'text', content: text.slice(0, 15000) };
    }

    if (ext === '.txt') {
      const text = fs.readFileSync(absPath, 'utf-8').trim();
      console.log(`[FileService] TXT extracted: ${text.length} chars`);
      if (!text) return null;
      return { type: 'text', content: text.slice(0, 15000) };
    }

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      const buffer = fs.readFileSync(absPath);
      const base64 = buffer.toString('base64');
      console.log(`[FileService] Image extracted: ${ext}, ${buffer.length} bytes`);
      return { type: 'image', content: base64, mimeType };
    }

    console.warn(`[FileService] Unsupported file type: ${ext}`);
    return null;
  } catch (err) {
    console.error(`[FileService] Extraction failed for ${absPath}:`, err);
    return null;
  }
}
