import { Command, Flags } from '@oclif/core';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { config, ModelType, PromptType, OutputDestination, OutputFormat, getPromptTypeForModel } from '../utils/config';

export default class Config extends Command {
  static override description = 'Configure Refiner defaults (model, type, output format, destination, API keys)';

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
    this.log(chalk.gray(`   OpenAI API Key: ${current.apiKey ? 'set (stored securely)' : 'not set'}`));
    this.log(chalk.gray(`   Claude API Key: ${current.claudeApiKey ? 'set (stored securely)' : 'not set'}`));
    this.log(chalk.gray(`   Gemini API Key: ${current.geminiApiKey ? 'set (stored securely)' : 'not set'}`));
    this.log(chalk.gray(`   Temperature (generative/reasoning): ${current.temperature.generative} / ${current.temperature.reasoning}`));
    this.log(chalk.gray(`   Streaming: ${current.streaming?.enabled ? 'enabled' : 'disabled'}, Show thinking: ${current.streaming?.showThinking ? 'yes' : 'no'}`));
    this.log();
  }

  private async interactiveFlow(): Promise<void> {
    const current = config.getAll();

    this.log(chalk.blue('\nRefiner Configuration'));
    this.log(chalk.gray('Use arrow keys to pick values. Press enter to confirm.'));

    // Optional OpenAI API key setup
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
      this.log(chalk.green('✅ OpenAI API key saved.'));
    }

    // Optional Claude API key setup
    const { setClaudeApiKey } = await inquirer.prompt<{ setClaudeApiKey: boolean }>([
      {
        type: 'confirm',
        name: 'setClaudeApiKey',
        message: current.claudeApiKey ? 'Update Claude API key?' : 'Set Claude API key now?',
        default: false
      }
    ]);

    if (setClaudeApiKey) {
      const { claudeApiKey } = await inquirer.prompt<{ claudeApiKey: string }>([
        {
          type: 'password',
          name: 'claudeApiKey',
          mask: '*',
          message: 'Enter Claude API key (starts with sk-ant-):',
          validate: (input: string) => input && input.trim().startsWith('sk-ant-') && input.trim().length >= 20 ? true : 'Please enter a valid Claude API key'
        }
      ]);
      config.setClaudeApiKey(claudeApiKey.trim());
      this.log(chalk.green('✅ Claude API key saved.'));
    }

    // Optional Gemini API key setup
    const { setGeminiApiKey } = await inquirer.prompt<{ setGeminiApiKey: boolean }>([
      {
        type: 'confirm',
        name: 'setGeminiApiKey',
        message: current.geminiApiKey ? 'Update Gemini API key?' : 'Set Gemini API key now?',
        default: false
      }
    ]);

    if (setGeminiApiKey) {
      const { geminiApiKey } = await inquirer.prompt<{ geminiApiKey: string }>([
        {
          type: 'password',
          name: 'geminiApiKey',
          mask: '*',
          message: 'Enter Gemini API key:',
          validate: (input: string) => input && input.trim().length >= 20 ? true : 'Please enter a valid Gemini API key'
        }
      ]);
      config.setGeminiApiKey(geminiApiKey.trim());
      this.log(chalk.green('✅ Gemini API key saved.'));
    }

    // Model selection
    const { model } = await inquirer.prompt<{ model: ModelType }>([
      {
        type: 'list',
        name: 'model',
        message: 'Select default model:',
        choices: [
          { name: 'Claude Sonnet 4.0 (reasoning-optimized, streaming, thinking, web search)', value: 'claude:sonnet-4-0' },
          { name: 'OpenAI gpt-4o-mini (reasoning-optimized, default model)', value: 'openai:gpt-4o-mini' },
          { name: 'OpenAI gpt-4.1-mini (generative-leaning)', value: 'openai:gpt-4.1-mini' },
          { name: 'OpenAI gpt-5-mini (advanced reasoning, latest model)', value: 'openai:gpt-5-mini' },
          { name: 'Gemini 2.5 Flash-Lite (fast generative tasks)', value: 'gemini:flash-lite' },
          { name: 'Gemini 2.5 Flash (balanced reasoning and generative)', value: 'gemini:flash' }
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

    // Streaming preferences (only for Claude models)
    let streamingConfig = current.streaming;
    if (model === 'claude:sonnet-4-0') {
      const { enableStreaming } = await inquirer.prompt<{ enableStreaming: boolean }>([
        {
          type: 'confirm',
          name: 'enableStreaming',
          message: 'Enable streaming for faster response feedback?',
          default: current.streaming?.enabled ?? true
        }
      ]);

      const { showThinking } = await inquirer.prompt<{ showThinking: boolean }>([
        {
          type: 'confirm',
          name: 'showThinking',
          message: 'Show extended thinking process during generation?',
          default: current.streaming?.showThinking ?? false
        }
      ]);

      streamingConfig = {
        enabled: enableStreaming,
        showThinking: showThinking,
        thinkingBudgetTokens: current.streaming?.thinkingBudgetTokens ?? 16000
      };
    }

    // Save
    config.set('defaultModel', model);
    config.set('defaultType', type);
    config.set('defaultFormat', format);
    config.set('defaultOutput', output);
    config.set('streaming', streamingConfig);

    this.log(chalk.green('\n✅ Configuration saved.'));
    this.log(chalk.gray('Note: When running "refiner refine" without --type, the prompt type will be auto-selected based on the chosen model.'));

    this.showConfig();
  }
}


