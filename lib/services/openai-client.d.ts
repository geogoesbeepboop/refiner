import { ModelType, PromptType } from '../utils/config';
export declare class OpenAIClient {
    private openai;
    constructor();
    private getModelName;
    private extractTextFromResponse;
    analyzePrompt(originalPrompt: string, promptType: PromptType, modelType: ModelType, systemPrompt: string): Promise<string>;
    regenerateWithContext(originalPrompt: string, structuredPrompt: string, additionalContext: string, promptType: PromptType, modelType: ModelType, systemPrompt: string): Promise<string>;
}
export declare function getOpenAIClient(): OpenAIClient;
