import { Args, Command, Flags } from '@oclif/core';
import { config, ModelType, PromptType, OutputFormat, OutputDestination } from '../utils/config';
import { promptAnalyzer, AnalysisResult } from '../services/prompt-analyzer';
import { outputFormatter } from '../services/output-formatter';
import { reviewUI } from '../ui/review';
import { createAnalysisLoader } from '../ui/loading';
import inquirer from 'inquirer';
import chalk from 'chalk';

export default class Refine extends Command {
  static override description = 'Transform unstructured prompts into well-structured, AI-optimized prompts';

  static override examples = [
    '$ refiner refine',
    '$ refiner refine "help me build a login system"',
    '$ refiner refine --type=reasoning',
    '$ refiner refine --model=openai:gpt-4.1-mini --format=json',
    '$ refiner refine "build an API" --type=reasoning --output=file'
  ];

  static override args = {
    prompt: Args.string({
      description: 'The unstructured prompt to refine',
      required: false
    })
  };

  static override flags = {
    type: Flags.string({
      char: 't',
      description: 'Prompt type (generative for creative tasks, reasoning for logical tasks)',
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
    })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Refine);
    
    try {
      // Get prompt input
      const prompt = await this.getPromptInput(args.prompt);
      if (!prompt) {
        this.log(chalk.yellow('👋 No prompt provided. Exiting.'));
        return;
      }

      // Get configuration with defaults and flag overrides
      const promptType = (flags.type as PromptType) || config.get('defaultType');
      const modelType = (flags.model as ModelType) || config.get('defaultModel');
      const outputFormat = (flags.format as OutputFormat) || config.get('defaultFormat');
      const outputDestination = (flags.output as OutputDestination) || config.get('defaultOutput');

      // Show configuration
      this.showConfiguration(promptType, modelType, outputFormat, outputDestination);

      // Analyze and structure the prompt
      const loader = createAnalysisLoader();
      loader.startStage(0);

      let result: AnalysisResult;
      try {
        result = await promptAnalyzer.analyzeAndStructure(prompt, promptType, modelType, outputFormat);
        loader.completeAll('🎉 Analysis complete!');
      } catch (error) {
        loader.failStage(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }

      // Review loop
      await this.reviewLoop(result, modelType, outputDestination);

    } catch (error) {
      if (error instanceof Error) {
        this.error(error.message, { exit: 1 });
      } else {
        this.error('An unknown error occurred', { exit: 1 });
      }
    }
  }

  private async getPromptInput(promptArg?: string): Promise<string | null> {
    if (promptArg) {
      return promptArg;
    }

    console.log(chalk.blue('💭 No prompt provided as argument.'));
    const { prompt } = await inquirer.prompt([
      {
        type: 'input',
        name: 'prompt',
        message: 'Enter your prompt to refine:',
        validate: (input: string) => {
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

  private showConfiguration(
    promptType: PromptType,
    modelType: ModelType,
    outputFormat: OutputFormat,
    outputDestination: OutputDestination
  ): void {
    console.log(chalk.blue('\n⚙️  Configuration:'));
    console.log(chalk.gray(`   Type: ${promptType}`));
    console.log(chalk.gray(`   Model: ${modelType}`));
    console.log(chalk.gray(`   Format: ${outputFormat}`));
    console.log(chalk.gray(`   Output: ${outputDestination}`));
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
      // Show comparison (with retry mode flag if this is after a retry)
      await reviewUI.showComparison(currentResult, { retryMode: isRetryMode });

      // Get user action
      const review = await reviewUI.getReviewAction(currentResult);

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
          reviewUI.showCancelMessage();
          return;
      }
    }
  }

  private async handleAccept(result: AnalysisResult, outputDestination: OutputDestination): Promise<void> {
    try {
      const outputResult = await outputFormatter.formatAndOutput(result, {
        format: result.outputFormat,
        destination: outputDestination
      });

      reviewUI.showSuccessMessage('accept', outputResult.filePath);
    } catch (error) {
      reviewUI.showErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async handleRetry(
    result: AnalysisResult,
    additionalContext: string,
    modelType: ModelType
  ): Promise<AnalysisResult> {
    const loader = createAnalysisLoader();
    loader.startStage(0);

    try {
      const newResult = await promptAnalyzer.regenerateWithContext(result, additionalContext, modelType);
      loader.completeAll('🔄 Regeneration complete!');
      return newResult;
    } catch (error) {
      loader.failStage(`Regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result; // Return original result if regeneration fails
    }
  }
}