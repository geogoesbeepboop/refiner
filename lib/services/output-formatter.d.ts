import { OutputFormat, OutputDestination } from '../utils/config';
import { AnalysisResult } from './prompt-analyzer';
export interface OutputOptions {
    format: OutputFormat;
    destination: OutputDestination;
}
export interface OutputResult {
    content: string;
    destination: OutputDestination;
    filePath?: string;
}
export declare class OutputFormatter {
    formatAndOutput(result: AnalysisResult, options: OutputOptions): Promise<OutputResult>;
    private outputToClipboard;
    private outputToFile;
    createSideBySideComparison(originalPrompt: string, structuredPrompt: string, format: OutputFormat): string;
    formatForPreview(content: string, maxLines?: number): string;
}
export declare const outputFormatter: OutputFormatter;
