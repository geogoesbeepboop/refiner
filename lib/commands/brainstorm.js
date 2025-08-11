"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const brainstormer_1 = require("../services/brainstormer");
const config_1 = require("../utils/config");
const loading_1 = require("../ui/loading");
const prompt_analyzer_1 = require("../services/prompt-analyzer");
const review_1 = require("../ui/review");
class Brainstorm extends core_1.Command {
    async run() {
        const { args, flags } = await this.parse(Brainstorm);
        const modelType = flags.model || config_1.config.get('defaultModel');
        const inferredType = (0, config_1.getPromptTypeForModel)(modelType);
        const promptType = flags.type || inferredType;
        const outputFormat = flags.format || config_1.config.get('defaultFormat');
        const outputDestination = flags.output || config_1.config.get('defaultOutput');
        const flavor = flags.flavor || 'detailed';
        const maxRounds = typeof flags.rounds === 'number' ? flags.rounds : 3;
        try {
            const initialIdea = await this.getIdeaInput(args.idea);
            if (!initialIdea) {
                this.log(chalk_1.default.yellow('👋 No idea provided. Exiting.'));
                return;
            }
            this.showConfiguration(promptType, modelType, outputFormat, outputDestination, flavor, maxRounds);
            const transcript = [];
            for (let round = 1; round <= maxRounds; round++) {
                const loader = (0, loading_1.createSimpleLoader)();
                loader.start(`🧠 Brainstorming round ${round}: generating questions...`);
                let questions;
                try {
                    const next = await brainstormer_1.brainstormer.generateNextQuestions(initialIdea, transcript, promptType, modelType);
                    questions = next.questions;
                    loader.succeed(`Got ${questions.length} question(s).`);
                    if (!next.shouldContinue && questions.length === 0) {
                        break;
                    }
                }
                catch (error) {
                    loader.fail('Failed to generate questions, stopping Q&A.');
                    break;
                }
                if (!questions || questions.length === 0) {
                    break;
                }
                for (const q of questions) {
                    const { answer } = await inquirer_1.default.prompt([
                        {
                            type: 'input',
                            name: 'answer',
                            message: q,
                            validate: (input) => input.trim().length > 0 || 'Please provide an answer.'
                        }
                    ]);
                    transcript.push({ question: q, answer: answer.trim() });
                }
            }
            const synthLoader = (0, loading_1.createSimpleLoader)();
            synthLoader.start('🧩 Synthesizing your answers into a single raw prompt...');
            const rawPrompt = await brainstormer_1.brainstormer.synthesizeRawPrompt(initialIdea, transcript, promptType, modelType);
            synthLoader.succeed('Synthesis complete.');
            // Now feed the synthesized raw prompt into the standard refine flow
            const analysisLoader = (0, loading_1.createAnalysisLoader)();
            analysisLoader.startStage(0);
            const result = await prompt_analyzer_1.promptAnalyzer.analyzeAndStructure(rawPrompt, promptType, modelType, outputFormat, flavor);
            analysisLoader.completeAll('🎉 Refinement complete!');
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
    async getIdeaInput(ideaArg) {
        if (ideaArg)
            return ideaArg;
        console.log(chalk_1.default.blue('💡 No idea provided as argument.'));
        const { idea } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'idea',
                message: 'Describe your rough idea (product, feature, bug, or initiative):',
                validate: (input) => {
                    if (input.trim().length === 0)
                        return 'Please enter your idea.';
                    if (input.trim().length < 10)
                        return 'Please add a bit more detail (≥ 10 chars).';
                    return true;
                }
            }
        ]);
        return idea.trim() || null;
    }
    showConfiguration(promptType, modelType, outputFormat, outputDestination, flavor, rounds) {
        console.log(chalk_1.default.blue('\n⚙️  Brainstorm Configuration:'));
        console.log(chalk_1.default.gray(`   Target Type: ${promptType}`));
        console.log(chalk_1.default.gray(`   Model: ${modelType}`));
        console.log(chalk_1.default.gray(`   Format: ${outputFormat}`));
        console.log(chalk_1.default.gray(`   Output: ${outputDestination}`));
        console.log(chalk_1.default.gray(`   Flavor: ${flavor}`));
        console.log(chalk_1.default.gray(`   Max Rounds: ${rounds}`));
        console.log();
    }
    async reviewLoop(result, modelType, outputDestination) {
        let currentResult = result;
        let isRetryMode = false;
        while (true) {
            await review_1.reviewUI.showComparison(currentResult, { retryMode: isRetryMode });
            const review = await review_1.reviewUI.getReviewAction(currentResult);
            switch (review.action) {
                case 'accept':
                    await this.handleAccept(currentResult, outputDestination);
                    return;
                case 'edit':
                    if (review.editedPrompt) {
                        currentResult = { ...currentResult, structuredPrompt: review.editedPrompt };
                        isRetryMode = false;
                    }
                    break;
                case 'retry':
                    if (review.additionalContext) {
                        currentResult = await this.handleRetry(currentResult, review.additionalContext, modelType);
                        isRetryMode = true;
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
            const { outputFormatter } = await Promise.resolve().then(() => __importStar(require('../services/output-formatter')));
            const outputResult = await outputFormatter.formatAndOutput(result, {
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
            return result;
        }
    }
}
Brainstorm.description = 'Interactive Q&A to transform a rough idea into a rich, refined prompt';
Brainstorm.examples = [
    '$ refiner brainstorm',
    '$ refiner brainstorm "idea: a simple expense tracker"',
    '$ refiner brainstorm --type=reasoning --model=openai:gpt-5-mini'
];
Brainstorm.args = {
    idea: core_1.Args.string({
        description: 'A rough idea: product, feature, bug, or initiative',
        required: false
    })
};
Brainstorm.flags = {
    type: core_1.Flags.string({
        char: 't',
        description: 'Prompt type to optimize for after synthesis',
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
    }),
    flavor: core_1.Flags.string({
        char: 'l',
        description: 'Prompt flavor (detailed or compact)',
        options: ['detailed', 'compact'],
        required: false
    }),
    rounds: core_1.Flags.integer({
        char: 'r',
        description: 'Max Q&A rounds before synthesis',
        default: 3
    })
};
exports.default = Brainstorm;
