"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewUI = exports.ReviewUI = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
class ReviewUI {
    async showComparison(result, options = {}) {
        const { showPreview = true, retryMode = false } = options;
        if (retryMode) {
            // In retry mode, show only the new structured prompt to avoid clutter
            console.log('\n' + chalk_1.default.cyan('='.repeat(80)));
            console.log(chalk_1.default.cyan.bold('                          UPDATED PROMPT (RETRY)'));
            console.log(chalk_1.default.cyan('='.repeat(80)));
            console.log('\n' + chalk_1.default.green.bold(`UPDATED STRUCTURED PROMPT (${result.outputFormat.toUpperCase()}):`));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            // Always show full content, do not truncate in review
            console.log(chalk_1.default.white(result.structuredPrompt));
            console.log('\n' + chalk_1.default.cyan('='.repeat(80)));
        }
        else {
            // Normal mode - show full comparison
            console.log('\n' + chalk_1.default.cyan('='.repeat(80)));
            console.log(chalk_1.default.cyan.bold('                            PROMPT COMPARISON'));
            console.log(chalk_1.default.cyan('='.repeat(80)));
            // Show original prompt
            console.log('\n' + chalk_1.default.yellow.bold('ORIGINAL PROMPT:'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.white(result.originalPrompt));
            // Show structured prompt (always show full content in review mode)
            console.log('\n' + chalk_1.default.green.bold(`STRUCTURED PROMPT (${result.outputFormat.toUpperCase()}):`));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            // Always show full content, do not truncate in review
            console.log(chalk_1.default.white(result.structuredPrompt));
            console.log('\n' + chalk_1.default.cyan('='.repeat(80)));
        }
    }
    async getReviewAction(currentResult) {
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
        const { action } = await inquirer_1.default.prompt([
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
    async handleEdit(currentStructuredPrompt) {
        console.log(chalk_1.default.yellow('\n📝 Edit Mode'));
        console.log(chalk_1.default.gray('The current structured prompt is pre-loaded in the editor. Make your modifications and save when done.\n'));
        const { editedPrompt } = await inquirer_1.default.prompt([
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
    async handleRetry() {
        console.log(chalk_1.default.blue('\n🔄 Retry Mode'));
        console.log(chalk_1.default.gray('Provide additional context to improve the prompt generation.\n'));
        const { additionalContext } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'additionalContext',
                message: 'Additional context or requirements:',
                validate: (input) => {
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
    async handleReject() {
        console.log(chalk_1.default.red('\n❌ Reject Mode'));
        const { confirmed } = await inquirer_1.default.prompt([
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
    showSuccessMessage(action, filePath) {
        switch (action) {
            case 'accept':
                console.log(chalk_1.default.green('\n✅ Prompt copied to clipboard successfully!'));
                console.log(chalk_1.default.gray('You can now paste it into your AI tool of choice.'));
                break;
            case 'edit':
                console.log(chalk_1.default.green('\n✅ Prompt edited and copied to clipboard!'));
                break;
            default:
                console.log(chalk_1.default.green('\n✅ Operation completed successfully!'));
                break;
        }
        if (filePath) {
            console.log(chalk_1.default.blue(`📁 Also saved to: ${filePath}`));
        }
    }
    showErrorMessage(error) {
        console.log(chalk_1.default.red(`\n❌ Error: ${error}`));
    }
    showCancelMessage() {
        console.log(chalk_1.default.yellow('\n👋 Operation cancelled. No changes made.'));
    }
}
exports.ReviewUI = ReviewUI;
exports.reviewUI = new ReviewUI();
