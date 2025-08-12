import { ModelType, PromptType } from '../utils/config';
import { StreamingCallbacks } from './claude-client';
export interface AIClientInterface {
    analyzePrompt(originalPrompt: string, promptType: PromptType, modelType: ModelType, systemPrompt: string, options?: any): Promise<string>;
    regenerateWithContext(originalPrompt: string, structuredPrompt: string, additionalContext: string, promptType: PromptType, modelType: ModelType, systemPrompt: string, options?: any): Promise<string>;
}
export declare class AIClientFactory {
    static getClient(modelType: ModelType): AIClientInterface;
    static analyzePrompt(originalPrompt: string, promptType: PromptType, modelType: ModelType, systemPrompt: string, options?: {
        enableStreaming?: boolean;
        showThinking?: boolean;
        callbacks?: StreamingCallbacks;
    }): Promise<string>;
    static regenerateWithContext(originalPrompt: string, structuredPrompt: string, additionalContext: string, promptType: PromptType, modelType: ModelType, systemPrompt: string, options?: {
        enableStreaming?: boolean;
        showThinking?: boolean;
        callbacks?: StreamingCallbacks;
    }): Promise<string>;
}
