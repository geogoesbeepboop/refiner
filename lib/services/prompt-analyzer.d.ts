import { ModelType, PromptType, OutputFormat, PromptFlavor } from '../utils/config';
export interface AnalysisResult {
    originalPrompt: string;
    structuredPrompt: string;
    promptType: PromptType;
    outputFormat: OutputFormat;
    flavor: PromptFlavor;
}
export declare class PromptAnalyzer {
    analyzeAndStructure(originalPrompt: string, promptType: PromptType, modelType: ModelType, outputFormat: OutputFormat, flavor: PromptFlavor): Promise<AnalysisResult>;
    private analyzeGenerativePrompt;
    private analyzeReasoningPrompt;
    regenerateWithContext(result: AnalysisResult, additionalContext: string, modelType: ModelType): Promise<AnalysisResult>;
}
export declare const promptAnalyzer: PromptAnalyzer;
