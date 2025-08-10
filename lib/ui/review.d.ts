import { AnalysisResult } from '../services/prompt-analyzer';
export interface ReviewOptions {
    showPreview?: boolean;
    retryMode?: boolean;
}
export type ReviewAction = 'accept' | 'edit' | 'retry' | 'reject';
export interface ReviewResult {
    action: ReviewAction;
    editedPrompt?: string;
    additionalContext?: string;
}
export declare class ReviewUI {
    showComparison(result: AnalysisResult, options?: ReviewOptions): Promise<void>;
    getReviewAction(currentResult?: AnalysisResult): Promise<ReviewResult>;
    private handleEdit;
    private handleRetry;
    private handleReject;
    showSuccessMessage(action: ReviewAction, filePath?: string): void;
    showErrorMessage(error: string): void;
    showCancelMessage(): void;
}
export declare const reviewUI: ReviewUI;
