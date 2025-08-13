import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, ModelType, PromptType } from '../utils/config';
import { validatePrompt } from '../utils/validation';

export class GoogleClient {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = config.getGeminiApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key not found. Set GEMINI_API_KEY in your environment or run "refiner config" to save your Gemini API key.');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private getModelName(modelType: ModelType): string {
    switch (modelType) {
      case 'gemini:flash-lite':
        return 'gemini-2.5-flash-lite';
      case 'gemini:flash':
        return 'gemini-2.5-flash';
      default:
        throw new Error(`Unsupported Gemini model type: ${modelType}`);
    }
  }

  async analyzePrompt(
    originalPrompt: string, 
    promptType: PromptType, 
    modelType: ModelType, 
    systemPrompt: string
  ): Promise<string> {
    // Validate inputs
    validatePrompt(originalPrompt);
    
    const modelName = this.getModelName(modelType);
    const temperature = config.getTemperature(promptType);

    try {
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: 16000,
        },
      });

      const prompt = `${systemPrompt}

Original prompt to analyze and restructure:

"${originalPrompt}"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      if (!content) {
        throw new Error('No response received from Gemini model');
      }

      return content;
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific Gemini API errors
        if (error.message.includes('API_KEY')) {
          throw new Error('Invalid Gemini API key. Please check your Gemini API key.');
        }
        if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API quota exceeded. Please check your Gemini usage limits.');
        }
        if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (error.message.includes('MODEL_NOT_FOUND')) {
          throw new Error(`Gemini model ${modelName} not found or not accessible.`);
        }
        if (error.message.includes('SAFETY')) {
          throw new Error('Content was blocked by Gemini safety filters. Please try rephrasing your prompt.');
        }
        throw new Error(`Gemini API Error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling Gemini API');
    }
  }

  async regenerateWithContext(
    originalPrompt: string, 
    structuredPrompt: string, 
    additionalContext: string, 
    promptType: PromptType, 
    modelType: ModelType, 
    systemPrompt: string
  ): Promise<string> {
    const regenerationPrompt = `REGENERATION REQUEST: Create a SIGNIFICANTLY DIFFERENT and IMPROVED version of the structured prompt.

Original user prompt: "${originalPrompt}"

Previously generated structured prompt:
${structuredPrompt}

Additional user requirements and context to incorporate:
${additionalContext}

CRITICAL INSTRUCTIONS FOR REGENERATION:
1. Generate a SUBSTANTIALLY DIFFERENT structured prompt that incorporates the additional context
2. DO NOT simply copy or slightly modify the previous version - create a fresh, improved approach
3. Significantly expand on details, add new perspectives, and improve comprehensiveness
4. Integrate the additional context throughout all sections, not just as an afterthought
5. Consider alternative approaches, methodologies, and frameworks that might better serve the goal
6. Ensure the new version is 2-3x more comprehensive and detailed than the previous attempt
7. Maintain the same JSON structure and format requirements, but completely refresh the content
8. Focus on creating substantial value-add over the previous version

REQUIREMENT: The regenerated prompt must be notably different, more comprehensive, and better integrated with the additional context. Avoid repetitive or similar content from the previous version.

${systemPrompt}`;

    return await this.analyzePrompt(regenerationPrompt, promptType, modelType, '');
  }
}

let _googleClient: GoogleClient | null = null;

export function getGoogleClient(): GoogleClient {
  if (!_googleClient) {
    _googleClient = new GoogleClient();
  }
  return _googleClient;
}