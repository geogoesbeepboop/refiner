"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.validatePrompt = validatePrompt;
exports.validateModel = validateModel;
exports.validatePromptType = validatePromptType;
exports.validateOutputFormat = validateOutputFormat;
exports.validateOutputDestination = validateOutputDestination;
exports.validateApiKey = validateApiKey;
exports.sanitizeInput = sanitizeInput;
exports.isValidJson = isValidJson;
exports.validateJsonOutput = validateJsonOutput;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
function validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
        throw new ValidationError('Prompt must be a non-empty string');
    }
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
        throw new ValidationError('Prompt cannot be empty or contain only whitespace');
    }
    if (trimmedPrompt.length < 5) {
        throw new ValidationError('Prompt must be at least 5 characters long');
    }
    if (trimmedPrompt.length > 10000) {
        throw new ValidationError('Prompt must be less than 10,000 characters');
    }
}
function validateModel(model) {
    const validModels = ['openai:gpt-4o-mini', 'openai:gpt-4.1-mini', 'openai:gpt-5-mini'];
    if (!validModels.includes(model)) {
        throw new ValidationError(`Invalid model type. Must be one of: ${validModels.join(', ')}`);
    }
    return model;
}
function validatePromptType(type) {
    const validTypes = ['generative', 'reasoning'];
    if (!validTypes.includes(type)) {
        throw new ValidationError(`Invalid prompt type. Must be one of: ${validTypes.join(', ')}`);
    }
    return type;
}
function validateOutputFormat(format) {
    const validFormats = ['markdown', 'json'];
    if (!validFormats.includes(format)) {
        throw new ValidationError(`Invalid output format. Must be one of: ${validFormats.join(', ')}`);
    }
    return format;
}
function validateOutputDestination(destination) {
    const validDestinations = ['clipboard', 'file'];
    if (!validDestinations.includes(destination)) {
        throw new ValidationError(`Invalid output destination. Must be one of: ${validDestinations.join(', ')}`);
    }
    return destination;
}
function validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        throw new ValidationError('API key must be a non-empty string');
    }
    const trimmedKey = apiKey.trim();
    if (trimmedKey.length === 0) {
        throw new ValidationError('API key cannot be empty or contain only whitespace');
    }
    // Basic OpenAI API key format validation
    if (!trimmedKey.startsWith('sk-')) {
        throw new ValidationError('OpenAI API key must start with "sk-"');
    }
    if (trimmedKey.length < 20) {
        throw new ValidationError('API key appears to be too short');
    }
}
function sanitizeInput(input) {
    return input.trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
}
function isValidJson(str) {
    try {
        JSON.parse(str);
        return true;
    }
    catch {
        return false;
    }
}
function validateJsonOutput(jsonString) {
    if (!isValidJson(jsonString)) {
        throw new ValidationError('Generated output is not valid JSON');
    }
}
