import { ModelType, PromptType, OutputFormat } from '../utils/config';
export interface AnalysisResult {
    originalPrompt: string;
    structuredPrompt: string;
    promptType: PromptType;
    outputFormat: OutputFormat;
}
export declare class PromptAnalyzer {
    analyzeAndStructure(originalPrompt: string, promptType: PromptType, modelType: ModelType, outputFormat: OutputFormat): Promise<AnalysisResult>;
    private analyzeGenerativePrompt;
    private analyzeReasoningPrompt;
    regenerateWithContext(result: AnalysisResult, additionalContext: string, modelType: ModelType): Promise<AnalysisResult>;
}
export declare const promptAnalyzer: PromptAnalyzer;
