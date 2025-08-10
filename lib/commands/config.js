"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../utils/config");
class Config extends core_1.Command {
    async run() {
        const { flags } = await this.parse(Config);
        if (flags.reset) {
            config_1.config.reset();
            this.log(chalk_1.default.green('✅ Configuration reset to defaults.'));
            return;
        }
        if (flags.show) {
            this.showConfig();
            return;
        }
        await this.interactiveFlow();
    }
    showConfig() {
        const current = config_1.config.getAll();
        this.log(chalk_1.default.blue('\n⚙️  Current configuration:'));
        this.log(chalk_1.default.gray(`   Default Model: ${current.defaultModel}`));
        this.log(chalk_1.default.gray(`   Default Type: ${current.defaultType}`));
        this.log(chalk_1.default.gray(`   Default Format: ${current.defaultFormat}`));
        this.log(chalk_1.default.gray(`   Default Output: ${current.defaultOutput}`));
        this.log(chalk_1.default.gray(`   API Key: ${current.apiKey ? 'set (stored securely)' : 'not set'}`));
        this.log(chalk_1.default.gray(`   Temperature (generative/reasoning): ${current.temperature.generative} / ${current.temperature.reasoning}`));
        this.log();
    }
    async interactiveFlow() {
        const current = config_1.config.getAll();
        this.log(chalk_1.default.blue('\nRefiner Configuration'));
        this.log(chalk_1.default.gray('Use arrow keys to pick values. Press enter to confirm.'));
        // Optional API key setup
        const { setApiKey } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'setApiKey',
                message: current.apiKey ? 'Update OpenAI API key?' : 'Set OpenAI API key now?',
                default: false
            }
        ]);
        if (setApiKey) {
            const { apiKey } = await inquirer_1.default.prompt([
                {
                    type: 'password',
                    name: 'apiKey',
                    mask: '*',
                    message: 'Enter OpenAI API key (starts with sk-):',
                    validate: (input) => input && input.trim().startsWith('sk-') && input.trim().length >= 20 ? true : 'Please enter a valid OpenAI API key'
                }
            ]);
            config_1.config.setApiKey(apiKey.trim());
            this.log(chalk_1.default.green('✅ API key saved.'));
        }
        // Model selection
        const { model } = await inquirer_1.default.prompt([
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
        const inferredType = (0, config_1.getPromptTypeForModel)(model);
        const { type } = await inquirer_1.default.prompt([
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
        const { format } = await inquirer_1.default.prompt([
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
        const { output } = await inquirer_1.default.prompt([
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
        config_1.config.set('defaultModel', model);
        config_1.config.set('defaultType', type);
        config_1.config.set('defaultFormat', format);
        config_1.config.set('defaultOutput', output);
        this.log(chalk_1.default.green('\n✅ Configuration saved.'));
        this.log(chalk_1.default.gray('Note: When running "refiner refine" without --type, the prompt type will be auto-selected based on the chosen model.'));
        this.showConfig();
    }
}
Config.description = 'Configure Refiner defaults (model, type, output format, destination, API key)';
Config.examples = [
    '$ refiner config',
    '$ refiner config --show',
    '$ refiner config --reset'
];
Config.flags = {
    show: core_1.Flags.boolean({ description: 'Show current configuration and exit', default: false }),
    reset: core_1.Flags.boolean({ description: 'Reset configuration to defaults', default: false })
};
exports.default = Config;
