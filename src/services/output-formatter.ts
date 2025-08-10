import { OutputFormat, OutputDestination } from '../utils/config';
import { AnalysisResult } from './prompt-analyzer';
import clipboardy from 'clipboardy';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface OutputOptions {
  format: OutputFormat;
  destination: OutputDestination;
}

export interface OutputResult {
  content: string;
  destination: OutputDestination;
  filePath?: string;
}

export class OutputFormatter {
  async formatAndOutput(result: AnalysisResult, options: OutputOptions): Promise<OutputResult> {
    const { format, destination } = options;
    let content: string;

    // The structured prompt is already formatted based on the format type
    content = result.structuredPrompt;

    if (destination === 'clipboard') {
      return await this.outputToClipboard(content);
    } else {
      return await this.outputToFile(content, format, result.promptType);
    }
  }

  private async outputToClipboard(content: string): Promise<OutputResult> {
    try {
      await clipboardy.write(content);
      return {
        content,
        destination: 'clipboard'
      };
    } catch (error) {
      throw new Error(`Failed to copy to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async outputToFile(content: string, format: OutputFormat, promptType: string): Promise<OutputResult> {
    try {
      // Create output directory if it doesn't exist
      const outputDir = path.join(process.cwd(), 'refined-prompts');
      await fs.mkdir(outputDir, { recursive: true });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = format === 'json' ? 'json' : 'md';
      const filename = `${promptType}-prompt-${timestamp}.${extension}`;
      const filePath = path.join(outputDir, filename);

      // Write content to file
      await fs.writeFile(filePath, content, 'utf8');

      return {
        content,
        destination: 'file',
        filePath
      };
    } catch (error) {
      throw new Error(`Failed to write to file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  createSideBySideComparison(originalPrompt: string, structuredPrompt: string, format: OutputFormat): string {
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

  formatForPreview(content: string, maxLines: number = 20): string {
    const lines = content.split('\n');
    if (lines.length <= maxLines) {
      return content;
    }

    const truncatedLines = lines.slice(0, maxLines);
    const remainingLines = lines.length - maxLines;
    
    return truncatedLines.join('\n') + `\n\n... (${remainingLines} more lines) ...`;
  }
}

export const outputFormatter = new OutputFormatter();