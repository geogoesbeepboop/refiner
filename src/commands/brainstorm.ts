import { Args, Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { brainstormer, QAItem } from '../services/brainstormer';
import { config, ModelType, PromptType, OutputDestination, OutputFormat, getPromptTypeForModel, PromptFlavor } from '../utils/config';
import { createAnalysisLoader, createSimpleLoader } from '../ui/loading';
import { promptAnalyzer, AnalysisResult } from '../services/prompt-analyzer';
import { reviewUI } from '../ui/review';

export default class Brainstorm extends Command {
  static override description = 'Interactive Q&A to transform a rough idea into a rich, refined prompt';

  static override examples = [
    '$ refiner brainstorm',
    '$ refiner brainstorm "idea: a simple expense tracker"',
    '$ refiner brainstorm --type=reasoning --model=openai:gpt-5-mini'
  ];

  static override args = {
    idea: Args.string({
      description: 'A rough idea: product, feature, bug, or initiative',
      required: false
    })
  };

  static override flags = {
    type: Flags.string({
      char: 't',
      description: 'Prompt type to optimize for after synthesis',
      options: ['generative', 'reasoning'],
      required: false
    }),
    model: Flags.string({
      char: 'm',
      description: 'AI model to use',
      options: ['openai:gpt-4o-mini', 'openai:gpt-4.1-mini', 'openai:gpt-5-mini'],
      required: false
    }),
    format: Flags.string({
      char: 'f',
      description: 'Output format',
      options: ['markdown', 'json'],
      required: false
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output destination',
      options: ['clipboard', 'file'],
      required: false
    }),
    flavor: Flags.string({
      char: 'l',
      description: 'Prompt flavor (detailed or compact)',
      options: ['detailed', 'compact'],
      required: false
    }),
    rounds: Flags.integer({
      char: 'r',
      description: 'Max Q&A rounds before synthesis',
      default: 3
    })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Brainstorm);

    const modelType: ModelType = (flags.model as ModelType) || config.get('defaultModel');
    const inferredType: PromptType = getPromptTypeForModel(modelType);
    const promptType: PromptType = (flags.type as PromptType) || inferredType;
    const outputFormat: OutputFormat = (flags.format as OutputFormat) || config.get('defaultFormat');
    const outputDestination: OutputDestination = (flags.output as OutputDestination) || config.get('defaultOutput');
    const flavor: PromptFlavor = (flags.flavor as PromptFlavor) || 'detailed';
    const maxRounds: number = typeof flags.rounds === 'number' ? flags.rounds : 3;

    try {
      const initialIdea = await this.getIdeaInput(args.idea);
      if (!initialIdea) {
        this.log(chalk.yellow('👋 No idea provided. Exiting.'));
        return;
      }

      this.showConfiguration(promptType, modelType, outputFormat, outputDestination, flavor, maxRounds);

      const transcript: QAItem[] = [];

      for (let round = 1; round <= maxRounds; round++) {
        const loader = createSimpleLoader();
        loader.start(`🧠 Brainstorming round ${round}: generating questions...`);
        let questions: string[] | undefined;
        try {
          const next = await brainstormer.generateNextQuestions(initialIdea, transcript, promptType, modelType);
          questions = next.questions;
          loader.succeed(`Got ${questions.length} question(s).`);
          if (!next.shouldContinue && questions.length === 0) {
            break;
          }
        } catch (error) {
          loader.fail('Failed to generate questions, stopping Q&A.');
          break;
        }

        if (!questions || questions.length === 0) {
          break;
        }

        for (const q of questions) {
          const { answer } = await inquirer.prompt<{ answer: string }>([
            {
              type: 'input',
              name: 'answer',
              message: q,
              validate: (input: string) => input.trim().length > 0 || 'Please provide an answer.'
            }
          ]);
          transcript.push({ question: q, answer: answer.trim() });
        }
      }

      const synthLoader = createSimpleLoader();
      synthLoader.start('🧩 Synthesizing your answers into a single raw prompt...');
      const rawPrompt = await brainstormer.synthesizeRawPrompt(initialIdea, transcript, promptType, modelType);
      synthLoader.succeed('Synthesis complete.');

      // Now feed the synthesized raw prompt into the standard refine flow
      const analysisLoader = createAnalysisLoader();
      analysisLoader.startStage(0);
      const result = await promptAnalyzer.analyzeAndStructure(rawPrompt, promptType, modelType, outputFormat, flavor);
      analysisLoader.completeAll('🎉 Refinement complete!');

      await this.reviewLoop(result, modelType, outputDestination);
    } catch (error) {
      if (error instanceof Error) {
        this.error(error.message, { exit: 1 });
      } else {
        this.error('An unknown error occurred', { exit: 1 });
      }
    }
  }

  private async getIdeaInput(ideaArg?: string): Promise<string | null> {
    if (ideaArg) return ideaArg;

    console.log(chalk.blue('💡 No idea provided as argument.'));
    const { idea } = await inquirer.prompt([
      {
        type: 'input',
        name: 'idea',
        message: 'Describe your rough idea (product, feature, bug, or initiative):',
        validate: (input: string) => {
          if (input.trim().length === 0) return 'Please enter your idea.';
          if (input.trim().length < 10) return 'Please add a bit more detail (≥ 10 chars).';
          return true;
        }
      }
    ]);

    return idea.trim() || null;
  }

  private showConfiguration(
    promptType: PromptType,
    modelType: ModelType,
    outputFormat: OutputFormat,
    outputDestination: OutputDestination,
    flavor: PromptFlavor,
    rounds: number
  ): void {
    console.log(chalk.blue('\n⚙️  Brainstorm Configuration:'));
    console.log(chalk.gray(`   Target Type: ${promptType}`));
    console.log(chalk.gray(`   Model: ${modelType}`));
    console.log(chalk.gray(`   Format: ${outputFormat}`));
    console.log(chalk.gray(`   Output: ${outputDestination}`));
    console.log(chalk.gray(`   Flavor: ${flavor}`));
    console.log(chalk.gray(`   Max Rounds: ${rounds}`));
    console.log();
  }

  private async reviewLoop(
    result: AnalysisResult,
    modelType: ModelType,
    outputDestination: OutputDestination
  ): Promise<void> {
    let currentResult = result;
    let isRetryMode = false;

    while (true) {
      await reviewUI.showComparison(currentResult, { retryMode: isRetryMode });
      const review = await reviewUI.getReviewAction(currentResult);

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
          reviewUI.showCancelMessage();
          return;
      }
    }
  }

  private async handleAccept(result: AnalysisResult, outputDestination: OutputDestination): Promise<void> {
    try {
      const { outputFormatter } = await import('../services/output-formatter');
      const outputResult = await outputFormatter.formatAndOutput(result, {
        format: result.outputFormat,
        destination: outputDestination
      });
      reviewUI.showSuccessMessage('accept', outputResult.filePath);
    } catch (error) {
      reviewUI.showErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async handleRetry(result: AnalysisResult, additionalContext: string, modelType: ModelType): Promise<AnalysisResult> {
    const loader = createAnalysisLoader();
    loader.startStage(0);
    try {
      const newResult = await promptAnalyzer.regenerateWithContext(result, additionalContext, modelType);
      loader.completeAll('🔄 Regeneration complete!');
      return newResult;
    } catch (error) {
      loader.failStage(`Regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }
}
