import { getAIClient } from './ai-client';
import { parseAIResponse } from '../utils/json-parser';
import { ModelType, PromptType, OutputFormat, PromptFlavor } from '../utils/config';
import { 
  buildGenerativeTemplate, 
  GenerativeDetailedPromptData, 
  GenerativeCompactPromptData,
  GENERATIVE_DETAILED_ANALYSIS_PROMPT,
  GENERATIVE_COMPACT_ANALYSIS_PROMPT
} from '../templates/generative';
import { 
  buildReasoningTemplate, 
  ReasoningDetailedPromptData, 
  ReasoningCompactPromptData,
  REASONING_DETAILED_ANALYSIS_PROMPT,
  REASONING_COMPACT_ANALYSIS_PROMPT
} from '../templates/reasoning';

export interface AnalysisResult {
  originalPrompt: string;
  structuredPrompt: string;
  promptType: PromptType;
  outputFormat: OutputFormat;
  flavor: PromptFlavor;
}

export class PromptAnalyzer {
  async analyzeAndStructure(
    originalPrompt: string,
    promptType: PromptType,
    modelType: ModelType,
    outputFormat: OutputFormat,
    flavor: PromptFlavor
  ): Promise<AnalysisResult> {
    try {
      if (promptType === 'generative') {
        return await this.analyzeGenerativePrompt(originalPrompt, modelType, outputFormat, flavor);
      } else {
        return await this.analyzeReasoningPrompt(originalPrompt, modelType, outputFormat, flavor);
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
    outputFormat: OutputFormat,
    flavor: PromptFlavor
  ): Promise<AnalysisResult> {
    const analysisPrompt = flavor === 'compact' 
      ? GENERATIVE_COMPACT_ANALYSIS_PROMPT 
      : GENERATIVE_DETAILED_ANALYSIS_PROMPT;

    const response = await getAIClient().analyzePrompt(
      originalPrompt,
      'generative',
      modelType,
      analysisPrompt
    );

    try {
      let promptData: GenerativeDetailedPromptData | GenerativeCompactPromptData;
      
      if (flavor === 'compact') {
        const analysisData = parseAIResponse(response) as Omit<GenerativeCompactPromptData, 'originalPrompt'>;
        promptData = {
          originalPrompt,
          ...analysisData
        } as GenerativeCompactPromptData;
      } else {
        const analysisData = parseAIResponse(response) as Omit<GenerativeDetailedPromptData, 'originalPrompt'>;
        promptData = {
          originalPrompt,
          ...analysisData
        } as GenerativeDetailedPromptData;
      }

      const structuredPrompt = buildGenerativeTemplate(promptData, outputFormat, flavor);

      return {
        originalPrompt,
        structuredPrompt,
        promptType: 'generative',
        outputFormat,
        flavor
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      throw new Error(`Failed to parse AI response for generative prompt analysis: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  }

  private async analyzeReasoningPrompt(
    originalPrompt: string,
    modelType: ModelType,
    outputFormat: OutputFormat,
    flavor: PromptFlavor
  ): Promise<AnalysisResult> {
    const analysisPrompt = flavor === 'compact' 
      ? REASONING_COMPACT_ANALYSIS_PROMPT 
      : REASONING_DETAILED_ANALYSIS_PROMPT;

    const response = await getAIClient().analyzePrompt(
      originalPrompt,
      'reasoning',
      modelType,
      analysisPrompt
    );

    try {
      let promptData: ReasoningDetailedPromptData | ReasoningCompactPromptData;
      
      if (flavor === 'compact') {
        const analysisData = parseAIResponse(response) as Omit<ReasoningCompactPromptData, 'originalPrompt'>;
        promptData = {
          originalPrompt,
          ...analysisData
        } as ReasoningCompactPromptData;
      } else {
        const analysisData = parseAIResponse(response) as Omit<ReasoningDetailedPromptData, 'originalPrompt'>;
        promptData = {
          originalPrompt,
          ...analysisData
        } as ReasoningDetailedPromptData;
      }

      const structuredPrompt = buildReasoningTemplate(promptData, outputFormat, flavor);

      return {
        originalPrompt,
        structuredPrompt,
        promptType: 'reasoning',
        outputFormat,
        flavor
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
        ? (result.flavor === 'compact' ? GENERATIVE_COMPACT_ANALYSIS_PROMPT : GENERATIVE_DETAILED_ANALYSIS_PROMPT)
        : (result.flavor === 'compact' ? REASONING_COMPACT_ANALYSIS_PROMPT : REASONING_DETAILED_ANALYSIS_PROMPT);

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
          if (result.flavor === 'compact') {
            const analysisData = parseAIResponse(response) as Omit<GenerativeCompactPromptData, 'originalPrompt'>;
            const promptData: GenerativeCompactPromptData = {
              originalPrompt: result.originalPrompt,
              ...analysisData
            };
            newStructuredPrompt = buildGenerativeTemplate(promptData, result.outputFormat, result.flavor);
          } else {
            const analysisData = parseAIResponse(response) as Omit<GenerativeDetailedPromptData, 'originalPrompt'>;
            const promptData: GenerativeDetailedPromptData = {
              originalPrompt: result.originalPrompt,
              ...analysisData
            };
            newStructuredPrompt = buildGenerativeTemplate(promptData, result.outputFormat, result.flavor);
          }
        } else {
          if (result.flavor === 'compact') {
            const analysisData = parseAIResponse(response) as Omit<ReasoningCompactPromptData, 'originalPrompt'>;
            const promptData: ReasoningCompactPromptData = {
              originalPrompt: result.originalPrompt,
              ...analysisData
            };
            newStructuredPrompt = buildReasoningTemplate(promptData, result.outputFormat, result.flavor);
          } else {
            const analysisData = parseAIResponse(response) as Omit<ReasoningDetailedPromptData, 'originalPrompt'>;
            const promptData: ReasoningDetailedPromptData = {
              originalPrompt: result.originalPrompt,
              ...analysisData
            };
            newStructuredPrompt = buildReasoningTemplate(promptData, result.outputFormat, result.flavor);
          }
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