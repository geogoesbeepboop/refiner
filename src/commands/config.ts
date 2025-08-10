import { Command, Flags } from '@oclif/core';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { config, ModelType, PromptType, OutputDestination, OutputFormat, getPromptTypeForModel } from '../utils/config';

export default class Config extends Command {
  static override description = 'Configure Refiner defaults (model, type, output format, destination, API key)';

  static override examples = [
    '$ refiner config',
    '$ refiner config --show',
    '$ refiner config --reset'
  ];

  static override flags = {
    show: Flags.boolean({ description: 'Show current configuration and exit', default: false }),
    reset: Flags.boolean({ description: 'Reset configuration to defaults', default: false })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Config);

    if (flags.reset) {
      config.reset();
      this.log(chalk.green('✅ Configuration reset to defaults.'));
      return;
    }

    if (flags.show) {
      this.showConfig();
      return;
    }

    await this.interactiveFlow();
  }

  private showConfig(): void {
    const current = config.getAll();
    this.log(chalk.blue('\n⚙️  Current configuration:'));
    this.log(chalk.gray(`   Default Model: ${current.defaultModel}`));
    this.log(chalk.gray(`   Default Type: ${current.defaultType}`));
    this.log(chalk.gray(`   Default Format: ${current.defaultFormat}`));
    this.log(chalk.gray(`   Default Output: ${current.defaultOutput}`));
    this.log(chalk.gray(`   API Key: ${current.apiKey ? 'set (stored securely)' : 'not set'}`));
    this.log(chalk.gray(`   Temperature (generative/reasoning): ${current.temperature.generative} / ${current.temperature.reasoning}`));
    this.log();
  }

  private async interactiveFlow(): Promise<void> {
    const current = config.getAll();

    this.log(chalk.blue('\nRefiner Configuration'));
    this.log(chalk.gray('Use arrow keys to pick values. Press enter to confirm.'));

    // Optional API key setup
    const { setApiKey } = await inquirer.prompt<{ setApiKey: boolean }>([
      {
        type: 'confirm',
        name: 'setApiKey',
        message: current.apiKey ? 'Update OpenAI API key?' : 'Set OpenAI API key now?',
        default: false
      }
    ]);

    if (setApiKey) {
      const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
        {
          type: 'password',
          name: 'apiKey',
          mask: '*',
          message: 'Enter OpenAI API key (starts with sk-):',
          validate: (input: string) => input && input.trim().startsWith('sk-') && input.trim().length >= 20 ? true : 'Please enter a valid OpenAI API key'
        }
      ]);
      config.setApiKey(apiKey.trim());
      this.log(chalk.green('✅ API key saved.'));
    }

    // Model selection
    const { model } = await inquirer.prompt<{ model: ModelType }>([
      {
        type: 'list',
        name: 'model',
        message: 'Select default model:',
        choices: [
          { name: 'OpenAI gpt-4o-mini (reasoning-optimized)', value: 'openai:gpt-4o-mini' },
          { name: 'OpenAI gpt-4.1-mini (generative-leaning)', value: 'openai:gpt-4.1-mini' },
          { name: 'OpenAI gpt-5-mini (advanced, reasoning default)', value: 'openai:gpt-5-mini' }
        ],
        default: current.defaultModel
      }
    ]);

    // Prompt type selection, inferred by default from model
    const inferredType: PromptType = getPromptTypeForModel(model);
    const { type } = await inquirer.prompt<{ type: PromptType }>([
      {
        type: 'list',
        name: 'type',
        message: `Select default prompt type (auto-inferred: ${inferredType} for ${model}):`,
        choices: [
          { name: 'Reasoning', value: 'reasoning' },
          { name: 'Generative', value: 'generative' }
        ],
        default: inferredType
      }
    ]);

    // Output format
    const { format } = await inquirer.prompt<{ format: OutputFormat }>([
      {
        type: 'list',
        name: 'format',
        message: 'Select default output format:',
        choices: [
          { name: 'Markdown', value: 'markdown' },
          { name: 'JSON', value: 'json' }
        ],
        default: current.defaultFormat
      }
    ]);

    // Output destination
    const { output } = await inquirer.prompt<{ output: OutputDestination }>([
      {
        type: 'list',
        name: 'output',
        message: 'Select default output destination:',
        choices: [
          { name: 'Clipboard', value: 'clipboard' },
          { name: 'File (refined-prompts/*)', value: 'file' }
        ],
        default: current.defaultOutput
      }
    ]);

    // Save
    config.set('defaultModel', model);
    config.set('defaultType', type);
    config.set('defaultFormat', format);
    config.set('defaultOutput', output);

    this.log(chalk.green('\n✅ Configuration saved.'));
    this.log(chalk.gray('Note: When running "refiner refine" without --type, the prompt type will be auto-selected based on the chosen model.'));

    this.showConfig();
  }
}


