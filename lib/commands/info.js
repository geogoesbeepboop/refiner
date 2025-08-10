"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
        // Commands
        if (commandList.length > 0) {
            this.log('\n' + chalk_1.default.blue('▶ Available Commands'));
            for (const cmd of commandList) {
                const hint = cmd === 'refine' ? 'Refine a prompt into structured output' : cmd === 'config' ? 'Configure defaults and API key' : cmd === 'info' ? 'Show this information' : '';
                this.log(chalk_1.default.gray(`   • ${cmd}${hint ? ' — ' + hint : ''}`));
            }
            this.log(chalk_1.default.gray(`\nTip: You can also run with ${chalk_1.default.white('refiner info')} or alias ${chalk_1.default.white('refiner -info')}.`));
        }
        this.log();
    }
}
Info.description = 'Show Refiner product information and available commands';
exports.default = Info;
