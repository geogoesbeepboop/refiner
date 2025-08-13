import { ModelType, PromptType } from '../utils/config';
export declare class GoogleClient {
    private genAI;
    constructor();
    private getModelName;
    analyzePrompt(originalPrompt: string, promptType: PromptType, modelType: ModelType, systemPrompt: string): Promise<string>;
    regenerateWithContext(originalPrompt: string, structuredPrompt: string, additionalContext: string, promptType: PromptType, modelType: ModelType, systemPrompt: string): Promise<string>;
}
export declare function getGoogleClient(): GoogleClient;
