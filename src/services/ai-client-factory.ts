import { ModelType, PromptType } from '../utils/config';
import { OpenAIClient, getOpenAIClient } from './openai-client';
import { ClaudeClient, getClaudeClient, StreamingCallbacks } from './claude-client';

export interface AIClientInterface {
  analyzePrompt(
    originalPrompt: string, 
    promptType: PromptType, 
    modelType: ModelType, 
    systemPrompt: string,
    options?: any
  ): Promise<string>;

  regenerateWithContext(
    originalPrompt: string, 
    structuredPrompt: string, 
    additionalContext: string, 
    promptType: PromptType, 
    modelType: ModelType, 
    systemPrompt: string,
    options?: any
  ): Promise<string>;
}

export class AIClientFactory {
  static getClient(modelType: ModelType): AIClientInterface {
    if (modelType.startsWith('claude:')) {
      return getClaudeClient();
    } else if (modelType.startsWith('openai:')) {
      return getOpenAIClient();
    } else {
      throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  static async analyzePrompt(
    originalPrompt: string,
    promptType: PromptType,
    modelType: ModelType,
    systemPrompt: string,
    options: {
      enableStreaming?: boolean;
      showThinking?: boolean;
      callbacks?: StreamingCallbacks;
    } = {}
  ): Promise<string> {
    const client = this.getClient(modelType);
    
    if (client instanceof ClaudeClient) {
      return await client.analyzePrompt(originalPrompt, promptType, modelType, systemPrompt, options);
    } else {
      return await client.analyzePrompt(originalPrompt, promptType, modelType, systemPrompt);
    }
  }

  static async regenerateWithContext(
    originalPrompt: string,
    structuredPrompt: string,
    additionalContext: string,
    promptType: PromptType,
    modelType: ModelType,
    systemPrompt: string,
    options: {
      enableStreaming?: boolean;
      showThinking?: boolean;
      callbacks?: StreamingCallbacks;
    } = {}
  ): Promise<string> {
    const client = this.getClient(modelType);
    
    if (client instanceof ClaudeClient) {
      return await client.regenerateWithContext(
        originalPrompt, 
        structuredPrompt, 
        additionalContext, 
        promptType, 
        modelType, 
        systemPrompt, 
        options
      );
    } else {
      return await client.regenerateWithContext(
        originalPrompt, 
        structuredPrompt, 
        additionalContext, 
        promptType, 
        modelType, 
        systemPrompt
      );
    }
  }
}