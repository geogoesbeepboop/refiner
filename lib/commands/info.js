"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../utils/config");
class Info extends core_1.Command {
    async run() {
        const asciiArt = [
            '██████╗ ███████╗███████╗██╗███╗   ██╗███████╗██████╗ ',
            '██╔══██╗██╔════╝██╔════╝██║████╗  ██║██╔════╝██╔══██╗',
            '██████╔╝█████╗  █████╗  ██║██╔██╗ ██║█████╗  ██████╔╝',
            '██╔══██╗██╔══╝  ██╔══╝  ██║██║╚██╗██║██╔══╝  ██╔══██╗',
            '██║  ██║███████╗██║     ██║██║ ╚████║███████╗██║  ██║',
            '╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝',
        ].join('\n');
        const packageJsonPath = path_1.default.resolve(__dirname, '..', '..', 'package.json');
        let pkg = {};
        try {
            const raw = fs_1.default.readFileSync(packageJsonPath, 'utf8');
            pkg = JSON.parse(raw);
        }
        catch {
            // ignore
        }
        let lastUpdated = '';
        try {
            const stats = fs_1.default.statSync(packageJsonPath);
            lastUpdated = stats.mtime.toISOString();
        }
        catch {
            // ignore
        }
        // Discover available commands by reading compiled command files
        let commandList = [];
        try {
            const files = fs_1.default.readdirSync(__dirname);
            commandList = files
                .filter((f) => f.endsWith('.js'))
                .map((f) => path_1.default.basename(f, '.js'))
                .filter((name) => !name.startsWith('_'))
                .sort();
        }
        catch {
            // ignore
        }
        // Header Art
        this.log('\n' + chalk_1.default.cyanBright(asciiArt));
        this.log(chalk_1.default.gray('A prompt refining CLI for builders and teams.'));
        // Product Info
        this.log('\n' + chalk_1.default.blue('ℹ️  Product Information'));
        this.log(chalk_1.default.gray(`   Name: ${pkg.name ?? 'refiner'}`));
        this.log(chalk_1.default.gray(`   Version: ${pkg.version ?? 'unknown'}`));
        this.log(chalk_1.default.gray(`   Last Update: ${lastUpdated || 'unknown'}`));
        this.log(chalk_1.default.gray(`   Author/Devs: ${pkg.author || (Array.isArray(pkg.contributors) && pkg.contributors.length > 0 ? pkg.contributors.join(', ') : 'not specified')}`));
        if (pkg.repository?.url) {
            this.log(chalk_1.default.gray(`   Repo: ${pkg.repository.url}`));
        }
        // Current configuration snapshot
        const current = config_1.config.getAll();
        const inferredType = (0, config_1.getPromptTypeForModel)(current.defaultModel);
        const typeNote = current.defaultType !== inferredType ? ` (auto-inference for model: ${inferredType})` : ' (auto-inference matches)';
        this.log('\n' + chalk_1.default.blue('🛠 Current Configuration'));
        this.log(chalk_1.default.gray(`   Default Model: ${current.defaultModel}`));
        this.log(chalk_1.default.gray(`   Default Type: ${current.defaultType}${typeNote}`));
        this.log(chalk_1.default.gray(`   Default Format: ${current.defaultFormat}`));
        this.log(chalk_1.default.gray(`   Default Output: ${current.defaultOutput}`));
        this.log(chalk_1.default.gray(`   OpenAI API Key: ${current.apiKey ? 'set' : 'not set'}`));
        this.log(chalk_1.default.gray(`   Claude API Key: ${current.claudeApiKey ? 'set' : 'not set'}`));
        this.log(chalk_1.default.gray(`   Temperature (generative/reasoning): ${current.temperature.generative} / ${current.temperature.reasoning}`));
        if (current.streaming) {
            this.log(chalk_1.default.gray(`   Streaming: ${current.streaming.enabled ? 'enabled' : 'disabled'}`));
            this.log(chalk_1.default.gray(`   Show thinking: ${current.streaming.showThinking ? 'yes' : 'no'}`));
            this.log(chalk_1.default.gray(`   Thinking budget (tokens): ${current.streaming.thinkingBudgetTokens}`));
        }
        // Model capabilities
        try {
            const supports = [
                (0, config_1.modelSupportsStreaming)(current.defaultModel) ? 'streaming' : null,
                (0, config_1.modelSupportsThinking)(current.defaultModel) ? 'thinking' : null,
                (0, config_1.modelSupportsWebSearch)(current.defaultModel) ? 'web-search' : null,
            ].filter(Boolean).join(', ');
            if (supports) {
                this.log(chalk_1.default.gray(`   Model capabilities: ${supports}`));
            }
        }
        catch {
            // ignore if helpers not applicable for the model
        }
        // Commands
        if (commandList.length > 0) {
            this.log('\n' + chalk_1.default.blue('▶ Available Commands'));
            for (const cmd of commandList) {
                const hint = cmd === 'refine' ? 'Refine a prompt into structured output' : cmd === 'config' ? 'Configure defaults and API key' : cmd === 'info' ? 'Show this information' : '';
                this.log(chalk_1.default.gray(`   • ${cmd}${hint ? ' — ' + hint : ''}`));
            }
        }
        this.log();
    }
}
Info.description = 'Show Refiner product information and available commands';
exports.default = Info;
