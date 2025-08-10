import { ModelType, PromptType, OutputFormat, OutputDestination } from './config';
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare function validatePrompt(prompt: string): void;
export declare function validateModel(model: string): ModelType;
export declare function validatePromptType(type: string): PromptType;
export declare function validateOutputFormat(format: string): OutputFormat;
export declare function validateOutputDestination(destination: string): OutputDestination;
export declare function validateApiKey(apiKey: string): void;
export declare function sanitizeInput(input: string): string;
export declare function isValidJson(str: string): boolean;
export declare function validateJsonOutput(jsonString: string): void;
