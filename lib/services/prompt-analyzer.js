"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptAnalyzer = exports.PromptAnalyzer = void 0;
const ai_client_1 = require("./ai-client");
const json_parser_1 = require("../utils/json-parser");
const generative_1 = require("../templates/generative");
const reasoning_1 = require("../templates/reasoning");
class PromptAnalyzer {
    async analyzeAndStructure(originalPrompt, promptType, modelType, outputFormat) {
        try {
            if (promptType === 'generative') {
                return await this.analyzeGenerativePrompt(originalPrompt, modelType, outputFormat);
            }
            else {
                return await this.analyzeReasoningPrompt(originalPrompt, modelType, outputFormat);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Analysis failed: ${error.message}`);
            }
            throw new Error('Unknown error during prompt analysis');
        }
    }
    async analyzeGenerativePrompt(originalPrompt, modelType, outputFormat) {
        const response = await (0, ai_client_1.getAIClient)().analyzePrompt(originalPrompt, 'generative', modelType, generative_1.GENERATIVE_ANALYSIS_PROMPT);
        try {
            const analysisData = (0, json_parser_1.parseAIResponse)(response);
            const promptData = {
                originalPrompt,
                ...analysisData
            };
            const structuredPrompt = (0, generative_1.buildGenerativeTemplate)(promptData, outputFormat);
            return {
                originalPrompt,
                structuredPrompt,
                promptType: 'generative',
                outputFormat
            };
        }
        catch (parseError) {
            console.error('Failed to parse AI response:', response);
            throw new Error(`Failed to parse AI response for generative prompt analysis: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
    }
    async analyzeReasoningPrompt(originalPrompt, modelType, outputFormat) {
        const response = await (0, ai_client_1.getAIClient)().analyzePrompt(originalPrompt, 'reasoning', modelType, reasoning_1.REASONING_ANALYSIS_PROMPT);
        try {
            const analysisData = (0, json_parser_1.parseAIResponse)(response);
            const promptData = {
                originalPrompt,
                ...analysisData
            };
            const structuredPrompt = (0, reasoning_1.buildReasoningTemplate)(promptData, outputFormat);
            return {
                originalPrompt,
                structuredPrompt,
                promptType: 'reasoning',
                outputFormat
            };
        }
        catch (parseError) {
            console.error('Failed to parse AI response:', response);
            throw new Error(`Failed to parse AI response for reasoning prompt analysis: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
    }
    async regenerateWithContext(result, additionalContext, modelType) {
        try {
            const systemPrompt = result.promptType === 'generative'
                ? generative_1.GENERATIVE_ANALYSIS_PROMPT
                : reasoning_1.REASONING_ANALYSIS_PROMPT;
            const response = await (0, ai_client_1.getAIClient)().regenerateWithContext(result.originalPrompt, result.structuredPrompt, additionalContext, result.promptType, modelType, systemPrompt);
            let newStructuredPrompt;
            try {
                if (result.promptType === 'generative') {
                    const analysisData = (0, json_parser_1.parseAIResponse)(response);
                    const promptData = {
                        originalPrompt: result.originalPrompt,
                        ...analysisData
                    };
                    newStructuredPrompt = (0, generative_1.buildGenerativeTemplate)(promptData, result.outputFormat);
                }
                else {
                    const analysisData = (0, json_parser_1.parseAIResponse)(response);
                    const promptData = {
                        originalPrompt: result.originalPrompt,
                        ...analysisData
                    };
                    newStructuredPrompt = (0, reasoning_1.buildReasoningTemplate)(promptData, result.outputFormat);
                }
            }
            catch (parseError) {
                throw new Error('Failed to parse AI response during regeneration');
            }
            return {
                ...result,
                structuredPrompt: newStructuredPrompt
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Regeneration failed: ${error.message}`);
            }
            throw new Error('Unknown error during prompt regeneration');
        }
    }
}
exports.PromptAnalyzer = PromptAnalyzer;
exports.promptAnalyzer = new PromptAnalyzer();
