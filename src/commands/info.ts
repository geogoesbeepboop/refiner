import { Command } from '@oclif/core';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export default class Info extends Command {
  static override description = 'Show Refiner product information and available commands';

  public async run(): Promise<void> {
    const asciiArt = [
      '██████╗ ███████╗███████╗██╗███╗   ██╗███████╗██████╗ ',
      '██╔══██╗██╔════╝██╔════╝██║████╗  ██║██╔════╝██╔══██╗',
      '██████╔╝█████╗  █████╗  ██║██╔██╗ ██║█████╗  ██████╔╝',
      '██╔══██╗██╔══╝  ██╔══╝  ██║██║╚██╗██║██╔══╝  ██╔══██╗',
      '██║  ██║███████╗██║     ██║██║ ╚████║███████╗██║  ██║',
      '╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝',
    ].join('\n');

    const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json');
    let pkg: any = {};
    try {
      const raw = fs.readFileSync(packageJsonPath, 'utf8');
      pkg = JSON.parse(raw);
    } catch {
      // ignore
    }

    let lastUpdated = '';
    try {
      const stats = fs.statSync(packageJsonPath);
      lastUpdated = stats.mtime.toISOString();
    } catch {
      // ignore
    }

    // Discover available commands by reading compiled command files
    let commandList: string[] = [];
    try {
      const files = fs.readdirSync(__dirname);
      commandList = files
        .filter((f) => f.endsWith('.js'))
        .map((f) => path.basename(f, '.js'))
        .filter((name) => !name.startsWith('_'))
        .sort();
    } catch {
      // ignore
    }

    // Header Art
    this.log('\n' + chalk.cyanBright(asciiArt));
    this.log(chalk.gray('A prompt refining CLI for builders and teams.'));

    // Product Info
    this.log('\n' + chalk.blue('ℹ️  Product Information'));
    this.log(chalk.gray(`   Name: ${pkg.name ?? 'refiner'}`));
    this.log(chalk.gray(`   Version: ${pkg.version ?? 'unknown'}`));
    this.log(chalk.gray(`   Last Update: ${lastUpdated || 'unknown'}`));
    this.log(chalk.gray(`   Author/Devs: ${pkg.author || (Array.isArray(pkg.contributors) && pkg.contributors.length > 0 ? pkg.contributors.join(', ') : 'not specified')}`));
    if (pkg.repository?.url) {
      this.log(chalk.gray(`   Repo: ${pkg.repository.url}`));
    }

    // Commands
    if (commandList.length > 0) {
      this.log('\n' + chalk.blue('▶ Available Commands'));
      for (const cmd of commandList) {
        const hint = cmd === 'refine' ? 'Refine a prompt into structured output' : cmd === 'config' ? 'Configure defaults and API key' : cmd === 'info' ? 'Show this information' : '';
        this.log(chalk.gray(`   • ${cmd}${hint ? ' — ' + hint : ''}`));
      }
      this.log(chalk.gray(`\nTip: You can also run with ${chalk.white('refiner info')} or alias ${chalk.white('refiner -info')}.`));
    }

    this.log();
  }
}


