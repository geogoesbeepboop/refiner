"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClientFactory = void 0;
const openai_client_1 = require("./openai-client");
const claude_client_1 = require("./claude-client");
class AIClientFactory {
    static getClient(modelType) {
        if (modelType.startsWith('claude:')) {
            return (0, claude_client_1.getClaudeClient)();
        }
        else if (modelType.startsWith('openai:')) {
            return (0, openai_client_1.getOpenAIClient)();
        }
        else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }
    static async analyzePrompt(originalPrompt, promptType, modelType, systemPrompt, options = {}) {
        const client = this.getClient(modelType);
        if (client instanceof claude_client_1.ClaudeClient) {
            return await client.analyzePrompt(originalPrompt, promptType, modelType, systemPrompt, options);
        }
        else {
            return await client.analyzePrompt(originalPrompt, promptType, modelType, systemPrompt);
        }
    }
    static async regenerateWithContext(originalPrompt, structuredPrompt, additionalContext, promptType, modelType, systemPrompt, options = {}) {
        const client = this.getClient(modelType);
        if (client instanceof claude_client_1.ClaudeClient) {
            return await client.regenerateWithContext(originalPrompt, structuredPrompt, additionalContext, promptType, modelType, systemPrompt, options);
        }
        else {
            return await client.regenerateWithContext(originalPrompt, structuredPrompt, additionalContext, promptType, modelType, systemPrompt);
        }
    }
}
exports.AIClientFactory = AIClientFactory;
