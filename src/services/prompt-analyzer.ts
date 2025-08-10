import { getAIClient } from './ai-client';
import { parseAIResponse } from '../utils/json-parser';
import { ModelType, PromptType, OutputFormat } from '../utils/config';
import { 
  buildGenerativeTemplate, 
  GenerativePromptData, 
  GENERATIVE_ANALYSIS_PROMPT 
} from '../templates/generative';
import { 
  buildReasoningTemplate, 
  ReasoningPromptData, 
  REASONING_ANALYSIS_PROMPT 
} from '../templates/reasoning';

export interface AnalysisResult {
  originalPrompt: string;
  structuredPrompt: string;
  promptType: PromptType;
  outputFormat: OutputFormat;
}

export class PromptAnalyzer {
  async analyzeAndStructure(
    originalPrompt: string,
    promptType: PromptType,
    modelType: ModelType,
    outputFormat: OutputFormat
  ): Promise<AnalysisResult> {
    try {
      if (promptType === 'generative') {
        return await this.analyzeGenerativePrompt(originalPrompt, modelType, outputFormat);
      } else {
        return await this.analyzeReasoningPrompt(originalPrompt, modelType, outputFormat);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Analysis failed: ${error.message}`);
      }
      throw new Error('Unknown error during prompt analysis');
    }
  }

  private async analyzeGenerativePrompt(
    originalPrompt: string,
    modelType: ModelType,
    outputFormat: OutputFormat
  ): Promise<AnalysisResult> {
    const response = await getAIClient().analyzePrompt(
      originalPrompt,
      'generative',
      modelType,
      GENERATIVE_ANALYSIS_PROMPT
    );

    try {
      const analysisData = parseAIResponse(response) as Omit<GenerativePromptData, 'originalPrompt'>;
      const promptData: GenerativePromptData = {
        originalPrompt,
        ...analysisData
      };

      const structuredPrompt = buildGenerativeTemplate(promptData, outputFormat);

      return {
        originalPrompt,
        structuredPrompt,
        promptType: 'generative',
        outputFormat
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      throw new Error(`Failed to parse AI response for generative prompt analysis: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  }

  private async analyzeReasoningPrompt(
    originalPrompt: string,
    modelType: ModelType,
    outputFormat: OutputFormat
  ): Promise<AnalysisResult> {
    const response = await getAIClient().analyzePrompt(
      originalPrompt,
      'reasoning',
      modelType,
      REASONING_ANALYSIS_PROMPT
    );

    try {
      const analysisData = parseAIResponse(response) as Omit<ReasoningPromptData, 'originalPrompt'>;
      const promptData: ReasoningPromptData = {
        originalPrompt,
        ...analysisData
      };

      const structuredPrompt = buildReasoningTemplate(promptData, outputFormat);

      return {
        originalPrompt,
        structuredPrompt,
        promptType: 'reasoning',
        outputFormat
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      throw new Error(`Failed to parse AI response for reasoning prompt analysis: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  }

  async regenerateWithContext(
    result: AnalysisResult,
    additionalContext: string,
    modelType: ModelType
  ): Promise<AnalysisResult> {
    try {
      const systemPrompt = result.promptType === 'generative' 
        ? GENERATIVE_ANALYSIS_PROMPT 
        : REASONING_ANALYSIS_PROMPT;

      const response = await getAIClient().regenerateWithContext(
        result.originalPrompt,
        result.structuredPrompt,
        additionalContext,
        result.promptType,
        modelType,
        systemPrompt
      );

      let newStructuredPrompt: string;

      try {
        if (result.promptType === 'generative') {
          const analysisData = parseAIResponse(response) as Omit<GenerativePromptData, 'originalPrompt'>;
          const promptData: GenerativePromptData = {
            originalPrompt: result.originalPrompt,
            ...analysisData
          };
          newStructuredPrompt = buildGenerativeTemplate(promptData, result.outputFormat);
        } else {
          const analysisData = parseAIResponse(response) as Omit<ReasoningPromptData, 'originalPrompt'>;
          const promptData: ReasoningPromptData = {
            originalPrompt: result.originalPrompt,
            ...analysisData
          };
          newStructuredPrompt = buildReasoningTemplate(promptData, result.outputFormat);
        }
      } catch (parseError) {
        throw new Error('Failed to parse AI response during regeneration');
      }

      return {
        ...result,
        structuredPrompt: newStructuredPrompt
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Regeneration failed: ${error.message}`);
      }
      throw new Error('Unknown error during prompt regeneration');
    }
  }
}

export const promptAnalyzer = new PromptAnalyzer();