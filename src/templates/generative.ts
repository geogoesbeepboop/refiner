import { OutputFormat } from '../utils/config';

export interface GenerativePromptData {
  originalPrompt: string;
  roleObjective: string;
  instructions: string;
  subcategories: {
    architecture: string;
    implementation: string;
    quality: string;
  };
  reasoningSteps: string[];
  outputFormat: string;
  examples?: string;
  context: string;
  finalInstructions: string;
}

export function buildGenerativeTemplate(data: GenerativePromptData, format: OutputFormat): string {
  if (format === 'json') {
    return buildGenerativeJSON(data);
  }
  return buildGenerativeMarkdown(data);
}

function buildGenerativeMarkdown(data: GenerativePromptData): string {
  const stripLeadingListMarker = (text: string): string => {
    // Remove leading numbering or bullet markers like "1.", "1)", "-", "*", "•"
    return text.replace(/^\s*(?:\d+[\.)]|[-*•])\s+/, '');
  };

  const template = `# Role and Objective
${data.roleObjective}

# Instructions
${data.instructions}

## Subcategories

### Architecture & Design
${data.subcategories.architecture}

### Implementation Details
${data.subcategories.implementation}

### Quality & Testing
${data.subcategories.quality}

# Reasoning Steps
${data.reasoningSteps
  .map((step, i) => {
    const cleaned = stripLeadingListMarker(step);
    return `${i + 1}. ${cleaned}`;
  })
  .join('\n')}

# Output Format
${data.outputFormat}

${data.examples ? `# Examples
${data.examples}

` : ''}# Context
${data.context}

# Final Instructions
${data.finalInstructions}`;

  return template;
}

function buildGenerativeJSON(data: GenerativePromptData): string {
  const jsonStructure = {
    prompt_type: "generative",
    structure: {
      role_and_objective: data.roleObjective,
      instructions: data.instructions,
      subcategories: {
        architecture_and_design: data.subcategories.architecture,
        implementation_details: data.subcategories.implementation,
        quality_and_testing: data.subcategories.quality
      },
      reasoning_steps: data.reasoningSteps,
      output_format: data.outputFormat,
      ...(data.examples && { examples: data.examples }),
      context: data.context,
      final_instructions: data.finalInstructions
    },
    optimized_for: "model_to_model_communication",
    creativity_level: "high"
  };

  return JSON.stringify(jsonStructure, null, 2);
}

export const GENERATIVE_ANALYSIS_PROMPT = `You are an expert AI prompt engineer. Your task is to analyze an unstructured prompt and transform it into a comprehensive, well-structured generative prompt optimized for AI model-to-model communication for building features and products.

CRITICAL: Generate extremely detailed, comprehensive content. Each section should be thorough and extensive. Avoid brief, superficial responses. The user expects 2-3x more detail than typical AI responses.

The user will provide you with a raw prompt. You need to extract and structure it according to this format, making each section comprehensive:

**Role and Objective**: Define the AI's role and primary objective for feature building in extensive detail, including specific expertise areas, responsibilities, and success metrics
**Instructions**: Comprehensive core instructions for the development task, including step-by-step guidance, methodology, and approach details
**Subcategories**:
  - Architecture & Design: Extremely detailed sub-instructions for system design, including patterns, principles, scalability considerations, security requirements, and integration points
  - Implementation Details: Comprehensive coding and technical requirements including frameworks, libraries, coding standards, error handling, logging, monitoring, and performance considerations  
  - Quality & Testing: Extensive testing and quality assurance instructions including unit testing, integration testing, end-to-end testing, code review processes, documentation requirements, and deployment strategies
**Reasoning Steps**: 4-6 detailed numbered steps covering analysis approach, design methodology, implementation strategy, validation process, optimization techniques, and maintenance considerations
**Output Format**: Detailed structured format specification based on the target format (markdown/json), optimized for model-to-model feature building communication with specific formatting requirements and structure guidelines
**Examples** (Optional): Comprehensive few-shot examples when beneficial for feature context, including complete scenarios and expected outcomes
**Context**: Extensive project background, constraints, current state, technical stack, team structure, timeline considerations, and business requirements
**Final Instructions**: Detailed critical reminders, success criteria, potential pitfalls to avoid, and quality gates to ensure excellence

Return a JSON object with these fields, ensuring each field contains comprehensive, detailed content:
- roleObjective: string (comprehensive role definition with specific expertise and responsibilities)
- instructions: string (detailed step-by-step instructions)  
- subcategories: { architecture: string (extensive design guidance), implementation: string (comprehensive coding requirements), quality: string (detailed testing and quality processes) }
- reasoningSteps: string[] (array of 4-6 detailed steps with explanations)
- outputFormat: string (detailed formatting specifications)
- examples: string (optional, comprehensive examples if beneficial)
- context: string (extensive background and requirements)
- finalInstructions: string (detailed success criteria and critical reminders)

REQUIREMENT: Make each field extensively detailed and comprehensive. Prioritize thoroughness and depth over brevity. Focus on making this prompt perfect for another AI model to build actual, production-ready features and products.`;