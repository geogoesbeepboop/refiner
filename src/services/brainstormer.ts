import { ModelType, PromptType } from '../utils/config';
import { getAIClient } from './ai-client';
import { parseAIResponse } from '../utils/json-parser';

export interface QAItem {
  question: string;
  answer: string;
}

export interface BrainstormQuestions {
  questions: string[];
  shouldContinue: boolean;
  reason?: string;
}

export class Brainstormer {
  async generateNextQuestions(
    initialIdea: string,
    transcript: QAItem[],
    promptType: PromptType,
    modelType: ModelType
  ): Promise<BrainstormQuestions> {
    const systemPrompt = `You are a world-class product discovery and prompt-engineering assistant.
Your job is to interview the user to transform a rough idea into a comprehensive, high-context prompt for an AI to build a product/feature or solve a bug.

INSTRUCTIONS:
- Carefully read the initial idea and the Q&A transcript so far.
- Identify the most critical unknowns and ambiguities.
- Ask the 3-6 highest-priority questions that will most increase clarity, feasibility, and completeness.
- Prefer short, clear, answerable questions; avoid multi-part/compound questions.
- Cover categories only if still unclear: target users, problem framing, scope and non-goals, constraints (security, compliance, performance, budget, timeline), success metrics, technical stack, integrations, data I/O, UX flows, risks/edge cases, acceptance criteria.
- If the transcript already contains enough detail for a strong final prompt, set shouldContinue to false.

OUTPUT STRICT JSON with fields:
{
  "questions": string[] (3-6 concise questions),
  "shouldContinue": boolean,
  "reason": string (brief rationale)
}`;

    const originalPrompt = `INITIAL_IDEA:\n${initialIdea}\n\nTRANSCRIPT:\n${transcript
      .map((qa, i) => `${i + 1}. Q: ${qa.question}\n   A: ${qa.answer}`)
      .join('\n') || '(none yet)'}\n\nPROMPT_TYPE: ${promptType}`;

    const response = await getAIClient().analyzePrompt(
      originalPrompt,
      // Treat this as reasoning regardless, since it's interviewing
      'reasoning',
      modelType,
      systemPrompt
    );

    try {
      const parsed = parseAIResponse(response) as BrainstormQuestions;
      const questions = Array.isArray(parsed.questions) ? parsed.questions.filter(Boolean) : [];
      const shouldContinue = Boolean(parsed.shouldContinue) && questions.length > 0;
      return {
        questions,
        shouldContinue,
        reason: typeof parsed.reason === 'string' ? parsed.reason : undefined
      };
    } catch (error) {
      // Fallback: if parsing fails, provide a generic set to avoid blocking
      return {
        questions: [
          'Who is the primary user and what core job are they trying to accomplish?',
          'What are the must-have outcomes and success criteria?',
          'What constraints or non-goals should we respect?',
        ],
        shouldContinue: true,
      };
    }
  }

  async synthesizeRawPrompt(
    initialIdea: string,
    transcript: QAItem[],
    promptType: PromptType,
    modelType: ModelType
  ): Promise<string> {
    const systemPrompt = `You are an expert prompt engineer. Synthesize the interview into a single, rich RAW PROMPT the user would give to an AI to build/solve the thing.

REQUIREMENTS:
- Concisely restate the goal and problem framing.
- Summarize key constraints, assumptions, and context.
- Capture technical preferences, integrations, data inputs/outputs, UX expectations, success metrics, and risks/edge cases mentioned.
- Include any acceptance criteria or testable outcomes.
- Keep it readable (2-4 short sections), not bullet spam. Avoid meta commentary.

OUTPUT JSON ONLY with field: { "rawPrompt": string }`;

    const originalPrompt = `INITIAL_IDEA:\n${initialIdea}\n\nTRANSCRIPT:\n${transcript
      .map((qa, i) => `${i + 1}. Q: ${qa.question}\n   A: ${qa.answer}`)
      .join('\n') || '(none)'}\n\nPROMPT_TYPE: ${promptType}`;

    const response = await getAIClient().analyzePrompt(
      originalPrompt,
      'reasoning',
      modelType,
      systemPrompt
    );

    const parsed = parseAIResponse(response) as { rawPrompt: string };
    if (!parsed || typeof parsed.rawPrompt !== 'string' || parsed.rawPrompt.trim().length === 0) {
      // Minimal fallback
      return `Goal and Idea:\n${initialIdea}\n\nKey Details from Q&A:\n${transcript.map(t => `- ${t.question} => ${t.answer}`).join('\n')}`;
    }
    return parsed.rawPrompt.trim();
  }
}

export const brainstormer = new Brainstormer();
