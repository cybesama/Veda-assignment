import OpenAI from 'openai';
import { IAssignment } from '../models/Assignment';
import { IGeneratedPaper } from '../models/Result';
import { extractFileContent } from './fileService';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const QUESTION_TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'Multiple Choice Questions',
  'short-answer': 'Short Answer Questions',
  'long-answer': 'Long Answer Questions',
  'diagram-graph': 'Diagram/Graph-Based Questions',
  numerical: 'Numerical Problems',
  'true-false': 'True/False Questions',
  'fill-blank': 'Fill in the Blanks',
};

function buildSectionsSpec(assignment: IAssignment): string {
  return assignment.questionTypes
    .map((qt, i) => {
      const letter = String.fromCharCode(65 + i);
      return `Section ${letter}: ${qt.label || QUESTION_TYPE_LABELS[qt.type] || qt.type} — ${qt.count} questions × ${qt.marks} mark(s) each`;
    })
    .join('\n');
}

function totalMarks(assignment: IAssignment): number {
  return assignment.questionTypes.reduce((s, qt) => s + qt.count * qt.marks, 0);
}

function totalQuestions(assignment: IAssignment): number {
  return assignment.questionTypes.reduce((s, qt) => s + qt.count, 0);
}

// ─── Prompt when NO reference file is uploaded ────────────────────────────────
function buildNoFilePrompt(assignment: IAssignment): string {
  return `Generate a complete examination question paper in valid JSON format.

Subject: ${assignment.subject}
Class: ${assignment.className}
Total Questions: ${totalQuestions(assignment)}
Total Marks: ${totalMarks(assignment)}

Required Sections:
${buildSectionsSpec(assignment)}

${assignment.additionalInstructions ? `Teacher's Notes: ${assignment.additionalInstructions}\n` : ''}
Generate curriculum-appropriate questions for ${assignment.subject}, Class ${assignment.className}.
Mix difficulties: ~30% easy, ~50% moderate, ~20% hard.

${buildJsonSchema(assignment)}`;
}

// ─── Prompt when a reference file IS uploaded ─────────────────────────────────
function buildFilePrompt(assignment: IAssignment, referenceContent: string): string {
  return `Below is a REFERENCE DOCUMENT. You must read it carefully.

═══════════════════════════════════════════
REFERENCE DOCUMENT (this is your ONLY source of question content):
═══════════════════════════════════════════
${referenceContent}
═══════════════════════════════════════════

TASK: Generate a question paper with ${totalQuestions(assignment)} questions (${totalMarks(assignment)} marks total) using ONLY the content in the reference document above.

STRICT RULES — you MUST follow these:
1. Every single question must be about a concept, fact, term, or idea that appears in the reference document above.
2. Do NOT use your general knowledge. Do NOT generate questions about anything not in the reference document.
3. The paper header fields (school, subject, class) are just labels — they do NOT define what to ask about.
4. If a section type (e.g. "numerical") has no suitable content in the reference, still create questions using numerical or quantitative aspects found IN the reference.

Required Sections:
${buildSectionsSpec(assignment)}

Paper header fields to use (labels only):
- school: "Delhi Public School"
- subject: "${assignment.subject}"
- className: "${assignment.className}"
- timeAllowed: appropriate for ${totalMarks(assignment)} marks
- maxMarks: ${totalMarks(assignment)}

${assignment.additionalInstructions ? `Teacher's additional notes: ${assignment.additionalInstructions}\n` : ''}
${buildJsonSchema(assignment)}`;
}

function buildJsonSchema(assignment: IAssignment): string {
  return `Return ONLY this JSON structure (no markdown, no extra text):
{
  "school": "Delhi Public School",
  "subject": "${assignment.subject}",
  "className": "${assignment.className}",
  "timeAllowed": "X minutes",
  "maxMarks": ${totalMarks(assignment)},
  "generalInstructions": [
    "All questions are compulsory unless stated otherwise.",
    "Write your name, roll number, and section clearly.",
    "Read all questions carefully before answering."
  ],
  "sections": [
    {
      "id": "A",
      "title": "Section A",
      "type": "Question type name",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questions": [
        {
          "number": 1,
          "text": "Full question text",
          "difficulty": "easy|moderate|hard",
          "marks": 1,
          "options": ["A", "B", "C", "D"]
        }
      ]
    }
  ],
  "answerKey": [
    { "number": 1, "sectionId": "A", "answer": "Full answer" }
  ]
}

Notes: Include "options" array ONLY for multiple-choice. Answer key must cover every question.`;
}

export async function generateQuestionPaper(assignment: IAssignment): Promise<{
  paper: IGeneratedPaper;
  rawPrompt: string;
}> {
  // Extract file content with full logging
  let fileData = null;
  if (assignment.filePath) {
    console.log(`[AI] Attempting file extraction for: ${assignment.filePath}`);
    fileData = await extractFileContent(assignment.filePath);
    if (!fileData) {
      console.warn('[AI] File extraction returned null — generating without reference');
    } else {
      console.log(`[AI] File ready: type=${fileData.type}, chars=${fileData.type === 'text' ? fileData.content.length : 'N/A (image)'}`);
    }
  } else {
    console.log('[AI] No file uploaded — generating from subject/class only');
  }

  let responseText: string;
  let rawPrompt: string;

  if (fileData?.type === 'image' && fileData.mimeType) {
    rawPrompt = buildFilePrompt(assignment, '[image reference — see vision input]');
    console.log('[AI] Sending image to gpt-4o vision...');

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert examiner. Generate questions ONLY from the provided image content. Return valid JSON only.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: rawPrompt },
            {
              type: 'image_url',
              image_url: { url: `data:${fileData.mimeType};base64,${fileData.content}`, detail: 'high' },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 8192,
    });
    responseText = response.choices[0]?.message?.content ?? '';

  } else if (fileData?.type === 'text') {
    rawPrompt = buildFilePrompt(assignment, fileData.content);
    console.log('[AI] Sending text+reference prompt to gpt-4o...');
    console.log('[AI] Reference content preview:', fileData.content.slice(0, 300));

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert examiner. Your ONLY job is to generate exam questions strictly from the reference document provided by the user. Never use outside knowledge. Return valid JSON only.',
        },
        { role: 'user', content: rawPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 8192,
    });
    responseText = response.choices[0]?.message?.content ?? '';

  } else {
    rawPrompt = buildNoFilePrompt(assignment);
    console.log('[AI] No reference — generating from subject knowledge...');

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert teacher and examiner. Return valid JSON only.' },
        { role: 'user', content: rawPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 8192,
    });
    responseText = response.choices[0]?.message?.content ?? '';
  }

  if (!responseText) throw new Error('Empty response from OpenAI');

  const paper = JSON.parse(responseText) as IGeneratedPaper;
  if (!paper.sections || !Array.isArray(paper.sections)) {
    throw new Error('Invalid paper structure: missing sections');
  }

  console.log(`[AI] Paper generated: ${paper.sections.length} sections`);
  return { paper, rawPrompt };
}
