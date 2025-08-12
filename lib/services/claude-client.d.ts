import { ModelType, PromptType } from '../utils/config';
export interface StreamingCallbacks {
    onThinkingStart?: () => void;
    onThinkingDelta?: (delta: string) => void;
    onWebSearchStart?: (query: string) => void;
    onWebSearchResults?: (resultCount: number) => void;
    onResponseStart?: () => void;
    onResponseDelta?: (delta: string) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}
export declare class ClaudeClient {
    private anthropic;
    constructor();
    private getModelName;
    analyzePrompt(originalPrompt: string, promptType: PromptType, modelType: ModelType, systemPrompt: string, options?: {
        enableStreaming?: boolean;
        showThinking?: boolean;
        callbacks?: StreamingCallbacks;
    }): Promise<string>;
    regenerateWithContext(originalPrompt: string, structuredPrompt: string, additionalContext: string, promptType: PromptType, modelType: ModelType, systemPrompt: string, options?: {
        enableStreaming?: boolean;
        showThinking?: boolean;
        callbacks?: StreamingCallbacks;
    }): Promise<string>;
    private streamResponse;
    private extractTextContent;
}
export declare function getClaudeClient(): ClaudeClient;
