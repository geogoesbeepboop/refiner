"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeClient = void 0;
exports.getClaudeClient = getClaudeClient;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const config_1 = require("../utils/config");
const validation_1 = require("../utils/validation");
class ClaudeClient {
    constructor() {
        const apiKey = config_1.config.getClaudeApiKey();
        if (!apiKey) {
            throw new Error('Claude API key not found. Set CLAUDE_API_KEY in your environment or run "refiner config" to save your Claude API key.');
        }
        this.anthropic = new sdk_1.default({
            apiKey: apiKey,
        });
    }
    getModelName(modelType) {
        switch (modelType) {
            case 'claude:sonnet-4-0':
                return 'claude-sonnet-4-0';
            default:
                throw new Error(`Unsupported Claude model type: ${modelType}`);
        }
    }
    async analyzePrompt(originalPrompt, promptType, modelType, systemPrompt, options = {}) {
        // Validate inputs
        (0, validation_1.validatePrompt)(originalPrompt);
        const modelName = this.getModelName(modelType);
        const temperature = config_1.config.getTemperature(promptType);
        const streamingConfig = config_1.config.get('streaming');
        const enableStreaming = options.enableStreaming ?? streamingConfig.enabled;
        const showThinking = options.showThinking ?? streamingConfig.showThinking;
        const callbacks = options.callbacks;
        try {
            const messages = [
                {
                    role: 'user',
                    content: `Original prompt to analyze and restructure:\n\n"${originalPrompt}"\n\nSystem instructions: ${systemPrompt}`
                }
            ];
            // Enable extended thinking if model supports it and adjust token allocation
            let maxTokens = 20000;
            let thinkingBudgetTokens = streamingConfig.thinkingBudgetTokens;
            if (showThinking) {
                // Ensure max_tokens > thinking.budget_tokens
                if (thinkingBudgetTokens >= maxTokens) {
                    thinkingBudgetTokens = Math.floor(maxTokens * 0.7); // Use 70% for thinking, 30% for response
                }
            }
            const requestParams = {
                model: modelName,
                max_tokens: maxTokens,
                messages: messages
            };
            // Enable extended thinking if model supports it
            if (showThinking) {
                requestParams.thinking = {
                    type: 'enabled',
                    budget_tokens: thinkingBudgetTokens
                };
                // When thinking is enabled, temperature must be 1
                requestParams.temperature = 1;
            }
            else {
                // Use configured temperature when thinking is disabled
                requestParams.temperature = temperature;
            }
            if (enableStreaming) {
                return await this.streamResponse(requestParams, callbacks);
            }
            else {
                const response = await this.anthropic.messages.create(requestParams);
                return this.extractTextContent(response);
            }
        }
        catch (error) {
            if (callbacks?.onError) {
                callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
            }
            if (error instanceof Error) {
                // Handle specific Anthropic API errors
                if (error.message.includes('authentication')) {
                    throw new Error('Invalid Claude API key. Please check your Claude API key.');
                }
                if (error.message.includes('rate_limit')) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                }
                if (error.message.includes('overloaded')) {
                    throw new Error('Claude API is currently overloaded. Please try again in a moment.');
                }
                throw new Error(`Claude API Error: ${error.message}`);
            }
            throw new Error('Unknown error occurred while calling Claude API');
        }
    }
    async regenerateWithContext(originalPrompt, structuredPrompt, additionalContext, promptType, modelType, systemPrompt, options = {}) {
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

REQUIREMENT: The regenerated prompt must be notably different, more comprehensive, and better integrated with the additional context. Avoid repetitive or similar content from the previous version.

System instructions: ${systemPrompt}`;
        return await this.analyzePrompt(regenerationPrompt, promptType, modelType, '', options);
    }
    async streamResponse(requestParams, callbacks) {
        requestParams.stream = true;
        let fullContent = '';
        try {
            callbacks?.onResponseStart?.();
            const stream = this.anthropic.messages.stream(requestParams);
            stream.on('text', (text) => {
                fullContent += text;
                callbacks?.onResponseDelta?.(text);
            });
            stream.on('error', (error) => {
                callbacks?.onError?.(error);
                throw error;
            });
            // Wait for stream to complete
            const message = await stream.finalMessage();
            callbacks?.onComplete?.();
            // If we didn't get content from streaming deltas, extract from final message
            if (!fullContent) {
                fullContent = this.extractTextContent(message);
            }
            return fullContent;
        }
        catch (error) {
            callbacks?.onError?.(error instanceof Error ? error : new Error('Streaming error'));
            throw error;
        }
    }
    extractTextContent(message) {
        if (!message.content || !Array.isArray(message.content)) {
            throw new Error('No content received from Claude');
        }
        // Find the first text content block
        const textBlock = message.content.find((block) => block.type === 'text');
        if (!textBlock || !textBlock.text) {
            throw new Error('No text content found in Claude response');
        }
        return textBlock.text;
    }
}
exports.ClaudeClient = ClaudeClient;
let _claudeClient = null;
function getClaudeClient() {
    if (!_claudeClient) {
        _claudeClient = new ClaudeClient();
    }
    return _claudeClient;
}
