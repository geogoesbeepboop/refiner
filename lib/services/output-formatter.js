"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.outputFormatter = exports.OutputFormatter = void 0;
const clipboardy_1 = __importDefault(require("clipboardy"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class OutputFormatter {
    async formatAndOutput(result, options) {
        const { format, destination } = options;
        let content;
        // The structured prompt is already formatted based on the format type
        content = result.structuredPrompt;
        if (destination === 'clipboard') {
            return await this.outputToClipboard(content);
        }
        else {
            return await this.outputToFile(content, format, result.promptType);
        }
    }
    async outputToClipboard(content) {
        try {
            await clipboardy_1.default.write(content);
            return {
                content,
                destination: 'clipboard'
            };
        }
        catch (error) {
            throw new Error(`Failed to copy to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async outputToFile(content, format, promptType) {
        try {
            // Create output directory if it doesn't exist
            const outputDir = path_1.default.join(process.cwd(), 'refined-prompts');
            await fs_1.promises.mkdir(outputDir, { recursive: true });
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = format === 'json' ? 'json' : 'md';
            const filename = `${promptType}-prompt-${timestamp}.${extension}`;
            const filePath = path_1.default.join(outputDir, filename);
            // Write content to file
            await fs_1.promises.writeFile(filePath, content, 'utf8');
            return {
                content,
                destination: 'file',
                filePath
            };
        }
        catch (error) {
            throw new Error(`Failed to write to file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    createSideBySideComparison(originalPrompt, structuredPrompt, format) {
        const divider = '─'.repeat(80);
        const title = format === 'json' ? 'JSON Format' : 'Markdown Format';
        return `
${divider}
ORIGINAL PROMPT
${divider}
${originalPrompt}

${divider}
STRUCTURED PROMPT (${title})
${divider}
${structuredPrompt}

${divider}`;
    }
    formatForPreview(content, maxLines = 20) {
        const lines = content.split('\n');
        if (lines.length <= maxLines) {
            return content;
        }
        const truncatedLines = lines.slice(0, maxLines);
        const remainingLines = lines.length - maxLines;
        return truncatedLines.join('\n') + `\n\n... (${remainingLines} more lines) ...`;
    }
}
exports.OutputFormatter = OutputFormatter;
exports.outputFormatter = new OutputFormatter();
