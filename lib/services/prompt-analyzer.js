"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptAnalyzer = exports.PromptAnalyzer = void 0;
const ai_client_factory_1 = require("./ai-client-factory");
const loading_1 = require("../ui/loading");
const config_1 = require("../utils/config");
const json_parser_1 = require("../utils/json-parser");
const generative_1 = require("../templates/generative");
const reasoning_1 = require("../templates/reasoning");
class PromptAnalyzer {
    async analyzeAndStructure(originalPrompt, promptType, modelType, outputFormat, flavor, options = {}) {
        try {
            if (promptType === 'generative') {
                return await this.analyzeGenerativePrompt(originalPrompt, modelType, outputFormat, flavor, options);
            }
            else {
                return await this.analyzeReasoningPrompt(originalPrompt, modelType, outputFormat, flavor, options);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Analysis failed: ${error.message}`);
            }
            throw new Error('Unknown error during prompt analysis');
        }
    }
    async analyzeGenerativePrompt(originalPrompt, modelType, outputFormat, flavor, options = {}) {
        const analysisPrompt = flavor === 'compact'
            ? generative_1.GENERATIVE_COMPACT_ANALYSIS_PROMPT
            : generative_1.GENERATIVE_DETAILED_ANALYSIS_PROMPT;
        // Set up streaming UI if applicable
        let streamingLoader;
        if ((0, config_1.modelSupportsStreaming)(modelType) && options.enableStreaming) {
            streamingLoader = new loading_1.StreamingLoader(options.showThinking);
        }
        const response = await ai_client_factory_1.AIClientFactory.analyzePrompt(originalPrompt, 'generative', modelType, analysisPrompt, {
            enableStreaming: options.enableStreaming,
            showThinking: options.showThinking,
            callbacks: streamingLoader ? {
                onThinkingStart: () => streamingLoader.startThinking(),
                onThinkingDelta: (delta) => streamingLoader.onThinkingDelta(delta),
                onWebSearchStart: (query) => streamingLoader.startWebSearch(query),
                onWebSearchResults: (count) => streamingLoader.onWebSearchResults(count),
                onResponseStart: () => streamingLoader.startResponse(),
                onResponseDelta: (delta) => streamingLoader.onResponseDelta(delta),
                onComplete: () => streamingLoader.complete('🎉 Analysis complete!'),
                onError: (error) => streamingLoader.fail(`Analysis failed: ${error.message}`)
            } : undefined
        });
        try {
            let promptData;
            if (flavor === 'compact') {
                const analysisData = (0, json_parser_1.parseAIResponse)(response);
                promptData = {
                    originalPrompt,
                    ...analysisData
                };
            }
            else {
                const analysisData = (0, json_parser_1.parseAIResponse)(response);
                promptData = {
                    originalPrompt,
                    ...analysisData
                };
            }
            const structuredPrompt = (0, generative_1.buildGenerativeTemplate)(promptData, outputFormat, flavor);
            return {
                originalPrompt,
                structuredPrompt,
                promptType: 'generative',
                outputFormat,
                flavor
            };
        }
        catch (parseError) {
            console.error('Failed to parse AI response:', response);
            throw new Error(`Failed to parse AI response for generative prompt analysis: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
    }
    async analyzeReasoningPrompt(originalPrompt, modelType, outputFormat, flavor, options = {}) {
        const analysisPrompt = flavor === 'compact'
            ? reasoning_1.REASONING_COMPACT_ANALYSIS_PROMPT
            : reasoning_1.REASONING_DETAILED_ANALYSIS_PROMPT;
        // Set up streaming UI if applicable
        let streamingLoader;
        if ((0, config_1.modelSupportsStreaming)(modelType) && options.enableStreaming) {
            streamingLoader = new loading_1.StreamingLoader(options.showThinking);
            streamingLoader.startConnecting();
        }
        const response = await ai_client_factory_1.AIClientFactory.analyzePrompt(originalPrompt, 'reasoning', modelType, analysisPrompt, {
            enableStreaming: options.enableStreaming,
            showThinking: options.showThinking,
            callbacks: streamingLoader ? {
                onThinkingStart: () => streamingLoader.startThinking(),
                onThinkingDelta: (delta) => streamingLoader.onThinkingDelta(delta),
                onWebSearchStart: (query) => streamingLoader.startWebSearch(query),
                onWebSearchResults: (count) => streamingLoader.onWebSearchResults(count),
                onResponseStart: () => streamingLoader.startResponse(),
                onResponseDelta: (delta) => streamingLoader.onResponseDelta(delta),
                onComplete: () => streamingLoader.complete('🎉 Analysis complete!'),
                onError: (error) => streamingLoader.fail(`Analysis failed: ${error.message}`)
            } : undefined
        });
        try {
            let promptData;
            if (flavor === 'compact') {
                const analysisData = (0, json_parser_1.parseAIResponse)(response);
                promptData = {
                    originalPrompt,
                    ...analysisData
                };
            }
            else {
                const analysisData = (0, json_parser_1.parseAIResponse)(response);
                promptData = {
                    originalPrompt,
                    ...analysisData
                };
            }
            const structuredPrompt = (0, reasoning_1.buildReasoningTemplate)(promptData, outputFormat, flavor);
            return {
                originalPrompt,
                structuredPrompt,
                promptType: 'reasoning',
                outputFormat,
                flavor
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
                ? (result.flavor === 'compact' ? generative_1.GENERATIVE_COMPACT_ANALYSIS_PROMPT : generative_1.GENERATIVE_DETAILED_ANALYSIS_PROMPT)
                : (result.flavor === 'compact' ? reasoning_1.REASONING_COMPACT_ANALYSIS_PROMPT : reasoning_1.REASONING_DETAILED_ANALYSIS_PROMPT);
            const response = await ai_client_factory_1.AIClientFactory.regenerateWithContext(result.originalPrompt, result.structuredPrompt, additionalContext, result.promptType, modelType, systemPrompt);
            let newStructuredPrompt;
            try {
                if (result.promptType === 'generative') {
                    if (result.flavor === 'compact') {
                        const analysisData = (0, json_parser_1.parseAIResponse)(response);
                        const promptData = {
                            originalPrompt: result.originalPrompt,
                            ...analysisData
                        };
                        newStructuredPrompt = (0, generative_1.buildGenerativeTemplate)(promptData, result.outputFormat, result.flavor);
                    }
                    else {
                        const analysisData = (0, json_parser_1.parseAIResponse)(response);
                        const promptData = {
                            originalPrompt: result.originalPrompt,
                            ...analysisData
                        };
                        newStructuredPrompt = (0, generative_1.buildGenerativeTemplate)(promptData, result.outputFormat, result.flavor);
                    }
                }
                else {
                    if (result.flavor === 'compact') {
                        const analysisData = (0, json_parser_1.parseAIResponse)(response);
                        const promptData = {
                            originalPrompt: result.originalPrompt,
                            ...analysisData
                        };
                        newStructuredPrompt = (0, reasoning_1.buildReasoningTemplate)(promptData, result.outputFormat, result.flavor);
                    }
                    else {
                        const analysisData = (0, json_parser_1.parseAIResponse)(response);
                        const promptData = {
                            originalPrompt: result.originalPrompt,
                            ...analysisData
                        };
                        newStructuredPrompt = (0, reasoning_1.buildReasoningTemplate)(promptData, result.outputFormat, result.flavor);
                    }
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
