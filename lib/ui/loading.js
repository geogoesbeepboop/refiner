"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingLoader = exports.MultiStageLoader = exports.LoadingUI = void 0;
exports.createAnalysisLoader = createAnalysisLoader;
exports.createStreamingAnalysisLoader = createStreamingAnalysisLoader;
exports.createSimpleLoader = createSimpleLoader;
const ora_1 = __importDefault(require("ora"));
const LOADING_MESSAGES = [
    '🔧 Analyzing your prompt structure...',
    '🧠 Applying engineering best practices...',
    '⚡ Optimizing for model-to-model communication...',
    '✨ Generating feature-ready prompt...',
    '🚀 Polishing the final structure...',
    '🎯 Almost ready for action...',
    '🔨 Building something amazing...',
    '⚙️ Fine-tuning the prompt architecture...',
    '🌟 Adding that special touch...',
    '🎨 Crafting the perfect structure...'
];
class LoadingUI {
    constructor() {
        this.currentMessageIndex = 0;
        this.spinner = (0, ora_1.default)({
            spinner: 'dots',
            color: 'cyan'
        });
    }
    start(initialMessage) {
        const message = initialMessage || LOADING_MESSAGES[0];
        this.spinner.start(message);
        this.startMessageRotation();
    }
    stop(finalMessage) {
        this.stopMessageRotation();
        if (finalMessage) {
            this.spinner.succeed(finalMessage);
        }
        else {
            this.spinner.stop();
        }
    }
    fail(errorMessage) {
        this.stopMessageRotation();
        this.spinner.fail(errorMessage);
    }
    succeed(successMessage) {
        this.stopMessageRotation();
        this.spinner.succeed(successMessage);
    }
    updateMessage(message) {
        this.spinner.text = message;
    }
    startMessageRotation() {
        this.messageInterval = setInterval(() => {
            this.currentMessageIndex = (this.currentMessageIndex + 1) % LOADING_MESSAGES.length;
            this.spinner.text = LOADING_MESSAGES[this.currentMessageIndex];
        }, 2000); // Change message every 2 seconds
    }
    stopMessageRotation() {
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = undefined;
        }
    }
}
exports.LoadingUI = LoadingUI;
class MultiStageLoader {
    constructor(stages) {
        this.stages = [];
        this.currentStageIndex = 0;
        this.stages = stages;
    }
    startStage(stageIndex) {
        if (stageIndex !== undefined) {
            this.currentStageIndex = stageIndex;
        }
        if (this.currentLoader) {
            this.currentLoader.stop();
        }
        this.currentLoader = new LoadingUI();
        if (this.currentStageIndex < this.stages.length) {
            this.currentLoader.start(this.stages[this.currentStageIndex]);
        }
        else {
            this.currentLoader.start();
        }
    }
    nextStage() {
        this.currentStageIndex++;
        this.startStage();
    }
    completeStage(message) {
        if (this.currentLoader) {
            this.currentLoader.succeed(message || `✅ Stage ${this.currentStageIndex + 1} complete`);
            this.currentLoader = undefined;
        }
    }
    failStage(errorMessage) {
        if (this.currentLoader) {
            this.currentLoader.fail(errorMessage);
            this.currentLoader = undefined;
        }
    }
    completeAll(finalMessage) {
        if (this.currentLoader) {
            this.currentLoader.succeed(finalMessage || '🎉 All stages completed!');
            this.currentLoader = undefined;
        }
    }
}
exports.MultiStageLoader = MultiStageLoader;
function createAnalysisLoader() {
    return new MultiStageLoader([
        '🔍 Analyzing prompt structure and intent...',
        '🧠 Applying AI prompt engineering patterns...',
        '⚡ Structuring for optimal model communication...',
        '✨ Finalizing the enhanced prompt...'
    ]);
}
function createStreamingAnalysisLoader() {
    return new MultiStageLoader([
        '🔗 Connecting to AI model...',
        '🤔 Processing with extended thinking...',
        '🌐 Searching web for context...',
        '📝 Generating structured response...',
        '✅ Stream complete'
    ]);
}
class StreamingLoader {
    constructor(showThinking = false) {
        this.thinkingContent = '';
        this.showThinking = showThinking;
        this.spinner = (0, ora_1.default)({
            spinner: 'dots',
            color: 'cyan'
        });
    }
    startConnecting() {
        this.spinner.start('🔗 Connecting to Claude...');
    }
    startThinking() {
        this.spinner.text = '🤔 Processing with extended thinking...';
    }
    onThinkingDelta(delta) {
        if (this.showThinking) {
            this.thinkingContent += delta;
            // For now, just update the spinner text with a truncated thinking preview
            const preview = this.thinkingContent.slice(-50).replace(/\n/g, ' ');
            this.spinner.text = `🤔 Thinking: ${preview}...`;
        }
    }
    startWebSearch(query) {
        this.spinner.text = `🌐 Searching web for "${query}"...`;
    }
    onWebSearchResults(resultCount) {
        this.spinner.text = `🌐 Found ${resultCount} search results...`;
    }
    startResponse() {
        this.spinner.text = '📝 Generating structured response...';
    }
    onResponseDelta(delta) {
        // Could show response streaming preview if desired
        // For now, keep the same message
    }
    complete(finalMessage) {
        this.spinner.succeed(finalMessage || '✅ Stream complete');
    }
    fail(errorMessage) {
        this.spinner.fail(errorMessage);
    }
    getThinkingContent() {
        return this.thinkingContent;
    }
}
exports.StreamingLoader = StreamingLoader;
function createSimpleLoader(message) {
    return new LoadingUI();
}
