import { ModelType, PromptType } from '../utils/config';
export interface QAItem {
    question: string;
    answer: string;
}
export interface BrainstormQuestions {
    questions: string[];
    shouldContinue: boolean;
    reason?: string;
}
export declare class Brainstormer {
    generateNextQuestions(initialIdea: string, transcript: QAItem[], promptType: PromptType, modelType: ModelType): Promise<BrainstormQuestions>;
    synthesizeRawPrompt(initialIdea: string, transcript: QAItem[], promptType: PromptType, modelType: ModelType): Promise<string>;
}
export declare const brainstormer: Brainstormer;
