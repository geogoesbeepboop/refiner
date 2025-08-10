import inquirer from 'inquirer';
import chalk from 'chalk';
import { outputFormatter } from '../services/output-formatter';
import { AnalysisResult } from '../services/prompt-analyzer';

export interface ReviewOptions {
  showPreview?: boolean;
  retryMode?: boolean;
}

export type ReviewAction = 'accept' | 'edit' | 'retry' | 'reject';

export interface ReviewResult {
  action: ReviewAction;
  editedPrompt?: string;
  additionalContext?: string;
}

export class ReviewUI {
  async showComparison(result: AnalysisResult, options: ReviewOptions = {}): Promise<void> {
    const { showPreview = true, retryMode = false } = options;
    
    if (retryMode) {
      // In retry mode, show only the new structured prompt to avoid clutter
      console.log('\n' + chalk.cyan('='.repeat(80)));
      console.log(chalk.cyan.bold('                          UPDATED PROMPT (RETRY)'));
      console.log(chalk.cyan('='.repeat(80)));

      console.log('\n' + chalk.green.bold(`UPDATED STRUCTURED PROMPT (${result.outputFormat.toUpperCase()}):`));
      console.log(chalk.gray('─'.repeat(50)));
      // Always show full content, do not truncate in review
      console.log(chalk.white(result.structuredPrompt));

      console.log('\n' + chalk.cyan('='.repeat(80)));
    } else {
      // Normal mode - show full comparison
      console.log('\n' + chalk.cyan('='.repeat(80)));
      console.log(chalk.cyan.bold('                            PROMPT COMPARISON'));
      console.log(chalk.cyan('='.repeat(80)));

      // Show original prompt
      console.log('\n' + chalk.yellow.bold('ORIGINAL PROMPT:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.white(result.originalPrompt));

      // Show structured prompt (always show full content in review mode)
      console.log('\n' + chalk.green.bold(`STRUCTURED PROMPT (${result.outputFormat.toUpperCase()}):`));
      console.log(chalk.gray('─'.repeat(50)));
      // Always show full content, do not truncate in review
      console.log(chalk.white(result.structuredPrompt));

      console.log('\n' + chalk.cyan('='.repeat(80)));
    }
  }

  async getReviewAction(currentResult?: AnalysisResult): Promise<ReviewResult> {
    const choices = [
      {
        name: '✅ Accept - Copy to clipboard and finish',
        value: 'accept',
        short: 'Accept'
      },
      {
        name: '✏️  Edit - Modify the structured prompt',
        value: 'edit', 
        short: 'Edit'
      },
      {
        name: '🔄 Retry - Regenerate with additional context',
        value: 'retry',
        short: 'Retry'
      },
      {
        name: '❌ Reject - Discard and exit',
        value: 'reject',
        short: 'Reject'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices,
        pageSize: 4
      }
    ]);

    switch (action) {
      case 'accept':
        return { action: 'accept' };
      
      case 'edit':
        return await this.handleEdit(currentResult?.structuredPrompt);
      
      case 'retry':
        return await this.handleRetry();
      
      case 'reject':
        return await this.handleReject();
      
      default:
        return { action: 'accept' };
    }
  }

  private async handleEdit(currentStructuredPrompt?: string): Promise<ReviewResult> {
    console.log(chalk.yellow('\n📝 Edit Mode'));
    console.log(chalk.gray('The current structured prompt is pre-loaded in the editor. Make your modifications and save when done.\n'));

    const { editedPrompt } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'editedPrompt',
        message: 'Edit the structured prompt:',
        default: currentStructuredPrompt || ''
      }
    ]);

    return {
      action: 'edit',
      editedPrompt: editedPrompt.trim()
    };
  }

  private async handleRetry(): Promise<ReviewResult> {
    console.log(chalk.blue('\n🔄 Retry Mode'));
    console.log(chalk.gray('Provide additional context to improve the prompt generation.\n'));

    const { additionalContext } = await inquirer.prompt([
      {
        type: 'input',
        name: 'additionalContext',
        message: 'Additional context or requirements:',
        validate: (input: string) => {
          if (input.trim().length === 0) {
            return 'Please provide some additional context.';
          }
          return true;
        }
      }
    ]);

    return {
      action: 'retry',
      additionalContext: additionalContext.trim()
    };
  }

  private async handleReject(): Promise<ReviewResult> {
    console.log(chalk.red('\n❌ Reject Mode'));
    
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Are you sure you want to discard this prompt and exit?',
        default: false
      }
    ]);

    if (!confirmed) {
      // Return to main menu - note: currentResult won't be available here, but that's okay
      // since this is called from within getReviewAction and will recurse properly
      return await this.getReviewAction();
    }

    return { action: 'reject' };
  }

  showSuccessMessage(action: ReviewAction, filePath?: string): void {
    switch (action) {
      case 'accept':
        console.log(chalk.green('\n✅ Prompt copied to clipboard successfully!'));
        console.log(chalk.gray('You can now paste it into your AI tool of choice.'));
        break;
      
      case 'edit':
        console.log(chalk.green('\n✅ Prompt edited and copied to clipboard!'));
        break;
      
      default:
        console.log(chalk.green('\n✅ Operation completed successfully!'));
        break;
    }

    if (filePath) {
      console.log(chalk.blue(`📁 Also saved to: ${filePath}`));
    }
  }

  showErrorMessage(error: string): void {
    console.log(chalk.red(`\n❌ Error: ${error}`));
  }

  showCancelMessage(): void {
    console.log(chalk.yellow('\n👋 Operation cancelled. No changes made.'));
  }
}

export const reviewUI = new ReviewUI();