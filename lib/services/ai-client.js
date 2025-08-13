"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClient = void 0;
exports.getAIClient = getAIClient;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../utils/config");
const validation_1 = require("../utils/validation");
class AIClient {
    constructor() {
        const apiKey = config_1.config.getApiKey();
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Set OPENAI_API_KEY in your environment or run "refiner config" to save your API key.');
        }
        try {
            (0, validation_1.validateApiKey)(apiKey);
        }
        catch (error) {
            throw new Error(`Invalid API key: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
        }
        this.openai = new openai_1.default({
            apiKey: apiKey,
        });
    }
    getModelName(modelType) {
        switch (modelType) {
            case 'openai:gpt-4o-mini':
                return 'gpt-4o-mini';
            case 'openai:gpt-4.1-mini':
                return 'gpt-4.1-mini'; // Now using correct model name
            case 'openai:gpt-5-mini':
                return 'gpt-5-mini'; // Now using correct model name
            default:
                return 'gpt-4o-mini';
        }
    }
    async analyzePrompt(originalPrompt, promptType, modelType, systemPrompt) {
        // Validate inputs
        (0, validation_1.validatePrompt)(originalPrompt);
        const modelName = this.getModelName(modelType);
        const temperature = config_1.config.getTemperature(promptType);
        try {
            const requestParams = {
                model: modelName,
                input: `${systemPrompt}\n\nOriginal prompt to analyze and restructure:\n\n"${originalPrompt}"`,
                max_output_tokens: 16000,
            };
            // Only add temperature for models that support it (not o-series or gpt-5)
            if (!modelName.startsWith('gpt-5') && !modelName.startsWith('o1') && !modelName.startsWith('o3')) {
                requestParams.temperature = temperature;
            }
            const response = await this.openai.responses.create(requestParams);
            // Parse response according to Responses API structure
            const output = response.output?.[0];
            if (!output || output.type !== 'message') {
                throw new Error('Invalid response format from AI model');
            }
            const content = output.content?.[0];
            if (!content || content.type !== 'output_text') {
                throw new Error('No text content in AI model response');
            }
            const text = content.text;
            if (!text) {
                throw new Error('No response received from AI model');
            }
            return text;
        }
        catch (error) {
            if (error instanceof Error) {
                // Handle specific OpenAI API errors
                if (error.message.includes('insufficient_quota')) {
                    throw new Error('API quota exceeded. Please check your OpenAI billing and usage limits.');
                }
                if (error.message.includes('invalid_api_key')) {
                    throw new Error('Invalid API key. Please check your OpenAI API key.');
                }
                if (error.message.includes('rate_limit_exceeded')) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                }
                if (error.message.includes('model_not_found')) {
                    throw new Error(`Model ${modelName} not found or not accessible with your API key.`);
                }
                throw new Error(`AI API Error: ${error.message}`);
            }
            throw new Error('Unknown error occurred while calling AI API');
        }
    }
    async regenerateWithContext(originalPrompt, structuredPrompt, additionalContext, promptType, modelType, systemPrompt) {
        const modelName = this.getModelName(modelType);
        const temperature = config_1.config.getTemperature(promptType);
        const regenerationPrompt = `REGENERATION REQUEST: Create a SIGNIFICANTLY DIFFERENT and IMPROVED version of the structured prompt.

Original user prompt: "${originalPrompt}"

Previously generated structured prompt:
${structuredPrompt}

Additional user requirements and context to incorporate:
${additionalContext}

CRITICAL INSTRUCTIONS FOR REGENERATION:
1. Generate a SUBSTANTIALLY DIFFERENT structured prompt that incorporates the additional context
2. DO NOT simply copy or slightly modify the previous version - create a fresh, improved approach
3. Significantly expand on details, add new perspectives, and improve comprehensiveness
4. Integrate the additional context throughout all sections, not just as an afterthought
5. Consider alternative approaches, methodologies, and frameworks that might better serve the goal
6. Ensure the new version is 2-3x more comprehensive and detailed than the previous attempt
7. Maintain the same JSON structure and format requirements, but completely refresh the content
8. Focus on creating substantial value-add over the previous version

REQUIREMENT: The regenerated prompt must be notably different, more comprehensive, and better integrated with the additional context. Avoid repetitive or similar content from the previous version.`;
        try {
            const requestParams = {
                model: modelName,
                input: `${systemPrompt}\n\n${regenerationPrompt}`,
                max_output_tokens: 16000,
            };
            // Only add temperature for models that support it (not o-series or gpt-5)
            if (!modelName.startsWith('gpt-5') && !modelName.startsWith('o1') && !modelName.startsWith('o3')) {
                requestParams.temperature = temperature;
            }
            const response = await this.openai.responses.create(requestParams);
            // Parse response according to Responses API structure
            const output = response.output?.[0];
            if (!output || output.type !== 'message') {
                throw new Error('Invalid response format from AI model during regeneration');
            }
            const content = output.content?.[0];
            if (!content || content.type !== 'output_text') {
                throw new Error('No text content in AI model response during regeneration');
            }
            const text = content.text;
            if (!text) {
                throw new Error('No response received from AI model during regeneration');
            }
            return text;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`AI API Error during regeneration: ${error.message}`);
            }
            throw new Error('Unknown error occurred while regenerating with AI API');
        }
    }
}
exports.AIClient = AIClient;
let _aiClient = null;
function getAIClient() {
    if (!_aiClient) {
        _aiClient = new AIClient();
    }
    return _aiClient;
}
