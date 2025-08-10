"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const config_1 = require("../utils/config");
const prompt_analyzer_1 = require("../services/prompt-analyzer");
const output_formatter_1 = require("../services/output-formatter");
const review_1 = require("../ui/review");
const loading_1 = require("../ui/loading");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
class Refine extends core_1.Command {
    async run() {
        const { args, flags } = await this.parse(Refine);
        try {
            // Get prompt input
            const prompt = await this.getPromptInput(args.prompt);
            if (!prompt) {
                this.log(chalk_1.default.yellow('👋 No prompt provided. Exiting.'));
                return;
            }
            // Get configuration with defaults and flag overrides
            const promptType = flags.type || config_1.config.get('defaultType');
            const modelType = flags.model || config_1.config.get('defaultModel');
            const outputFormat = flags.format || config_1.config.get('defaultFormat');
            const outputDestination = flags.output || config_1.config.get('defaultOutput');
            // Show configuration
            this.showConfiguration(promptType, modelType, outputFormat, outputDestination);
            // Analyze and structure the prompt
            const loader = (0, loading_1.createAnalysisLoader)();
            loader.startStage(0);
            let result;
            try {
                result = await prompt_analyzer_1.promptAnalyzer.analyzeAndStructure(prompt, promptType, modelType, outputFormat);
                loader.completeAll('🎉 Analysis complete!');
            }
            catch (error) {
                loader.failStage(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return;
            }
            // Review loop
            await this.reviewLoop(result, modelType, outputDestination);
        }
        catch (error) {
            if (error instanceof Error) {
                this.error(error.message, { exit: 1 });
            }
            else {
                this.error('An unknown error occurred', { exit: 1 });
            }
        }
    }
    async getPromptInput(promptArg) {
        if (promptArg) {
            return promptArg;
        }
        console.log(chalk_1.default.blue('💭 No prompt provided as argument.'));
        const { prompt } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'prompt',
                message: 'Enter your prompt to refine:',
                validate: (input) => {
                    if (input.trim().length === 0) {
                        return 'Please enter a prompt to refine.';
                    }
                    if (input.trim().length < 10) {
                        return 'Prompt should be at least 10 characters long for meaningful analysis.';
                    }
                    return true;
                }
            }
        ]);
        return prompt.trim() || null;
    }
    showConfiguration(promptType, modelType, outputFormat, outputDestination) {
        console.log(chalk_1.default.blue('\n⚙️  Refiner Configuration:'));
        console.log(chalk_1.default.gray(`   Type: ${promptType}`));
        console.log(chalk_1.default.gray(`   Model: ${modelType}`));
        console.log(chalk_1.default.gray(`   Format: ${outputFormat}`));
        console.log(chalk_1.default.gray(`   Output: ${outputDestination}`));
        console.log();
    }
    async reviewLoop(result, modelType, outputDestination) {
        let currentResult = result;
        let isRetryMode = false;
        while (true) {
            // Show comparison (with retry mode flag if this is after a retry)
            await review_1.reviewUI.showComparison(currentResult, { retryMode: isRetryMode });
            // Get user action
            const review = await review_1.reviewUI.getReviewAction(currentResult);
            switch (review.action) {
                case 'accept':
                    await this.handleAccept(currentResult, outputDestination);
                    return;
                case 'edit':
                    if (review.editedPrompt) {
                        currentResult = {
                            ...currentResult,
                            structuredPrompt: review.editedPrompt
                        };
                        // After an edit, keep the user in the review loop with the edited prompt
                        // so they can choose to accept, edit again, or retry.
                        isRetryMode = false;
                    }
                    break;
                case 'retry':
                    if (review.additionalContext) {
                        currentResult = await this.handleRetry(currentResult, review.additionalContext, modelType);
                        isRetryMode = true; // Next iteration will be in retry mode
                    }
                    break;
                case 'reject':
                    review_1.reviewUI.showCancelMessage();
                    return;
            }
        }
    }
    async handleAccept(result, outputDestination) {
        try {
            const outputResult = await output_formatter_1.outputFormatter.formatAndOutput(result, {
                format: result.outputFormat,
                destination: outputDestination
            });
            review_1.reviewUI.showSuccessMessage('accept', outputResult.filePath);
        }
        catch (error) {
            review_1.reviewUI.showErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        }
    }
    async handleRetry(result, additionalContext, modelType) {
        const loader = (0, loading_1.createAnalysisLoader)();
        loader.startStage(0);
        try {
            const newResult = await prompt_analyzer_1.promptAnalyzer.regenerateWithContext(result, additionalContext, modelType);
            loader.completeAll('🔄 Regeneration complete!');
            return newResult;
        }
        catch (error) {
            loader.failStage(`Regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result; // Return original result if regeneration fails
        }
    }
}
Refine.description = 'Transform unstructured prompts into well-structured, AI-optimized prompts';
Refine.examples = [
    '$ refiner refine',
    '$ refiner refine "help me build a login system"',
    '$ refiner refine --type=reasoning',
    '$ refiner refine --model=openai:gpt-4.1-mini --format=json',
    '$ refiner refine "build an API" --type=reasoning --output=file'
];
Refine.args = {
    prompt: core_1.Args.string({
        description: 'The unstructured prompt to refine',
        required: false
    })
};
Refine.flags = {
    type: core_1.Flags.string({
        char: 't',
        description: 'Prompt type (generative for creative tasks, reasoning for logical tasks)',
        options: ['generative', 'reasoning'],
        required: false
    }),
    model: core_1.Flags.string({
        char: 'm',
        description: 'AI model to use',
        options: ['openai:gpt-4o-mini', 'openai:gpt-4.1-mini', 'openai:gpt-5-mini'],
        required: false
    }),
    format: core_1.Flags.string({
        char: 'f',
        description: 'Output format',
        options: ['markdown', 'json'],
        required: false
    }),
    output: core_1.Flags.string({
        char: 'o',
        description: 'Output destination',
        options: ['clipboard', 'file'],
        required: false
    })
};
exports.default = Refine;
