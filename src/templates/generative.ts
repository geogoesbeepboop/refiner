import { OutputFormat, PromptFlavor } from '../utils/config';

export interface GenerativeDetailedPromptData {
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

export interface GenerativeCompactPromptData {
  originalPrompt: string;
  persona: string;
  objective: string;
  projectOverview?: string;
  relevantFiles?: string;
  fileStructure?: string;
  bugDescription?: {
    expected: string;
    actual: string;
    errorMessage?: string;
  };
  dependencies?: { [key: string]: string };
  taskDecomposition: string[];
  constraints: string[];
  outputFormat: string;
}

export function buildGenerativeTemplate(data: GenerativeDetailedPromptData | GenerativeCompactPromptData, format: OutputFormat, flavor: PromptFlavor = 'detailed'): string {
  if (flavor === 'compact') {
    return buildGenerativeCompactMarkdown(data as GenerativeCompactPromptData);
  }
  if (format === 'json') {
    return buildGenerativeJSON(data);
  }
  return buildGenerativeMarkdown(data as GenerativeDetailedPromptData);
}

function buildGenerativeMarkdown(data: GenerativeDetailedPromptData): string {
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

function buildGenerativeJSON(data: GenerativeDetailedPromptData | GenerativeCompactPromptData): string {
  const isDetailed = 'subcategories' in data;
  
  if (isDetailed) {
    return buildGenerativeDetailedJSON(data as GenerativeDetailedPromptData);
  } else {
    return buildGenerativeCompactJSON(data as GenerativeCompactPromptData);
  }
}

function buildGenerativeDetailedJSON(data: GenerativeDetailedPromptData): string {
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

function buildGenerativeCompactJSON(data: GenerativeCompactPromptData): string {
  const jsonStructure = {
    prompt_type: "generative_compact",
    structure: {
      persona: data.persona,
      objective: data.objective,
      ...(data.projectOverview && { project_overview: data.projectOverview }),
      ...(data.relevantFiles && { relevant_files: data.relevantFiles }),
      ...(data.fileStructure && { file_structure: data.fileStructure }),
      ...(data.bugDescription && { bug_description: data.bugDescription }),
      ...(data.dependencies && { dependencies: data.dependencies }),
      task_decomposition: data.taskDecomposition,
      constraints: data.constraints,
      output_format: data.outputFormat
    },
    optimized_for: "model_to_model_communication",
    creativity_level: "focused"
  };

  return JSON.stringify(jsonStructure, null, 2);
}

function buildGenerativeCompactMarkdown(data: GenerativeCompactPromptData): string {
  const stripLeadingListMarker = (text: string): string => {
    return text.replace(/^\s*(?:\d+[\.)]|[-*•])\s+/, '');
  };

  let compact = `# Persona
${data.persona}

# Objective
${data.objective}

# Context & Scope`;

  if (data.projectOverview) {
    compact += `\n## Project Overview\n${data.projectOverview}`;
  }

  if (data.relevantFiles) {
    compact += `\n\n## Relevant File(s)\n${data.relevantFiles}`;
  }

  if (data.fileStructure) {
    compact += `\n\n## File Structure\n${data.fileStructure}`;
  }

  if (data.bugDescription) {
    compact += `\n\n## Bug Description\nExpected Behavior: ${data.bugDescription.expected}\nActual Behavior: ${data.bugDescription.actual}`;
    if (data.bugDescription.errorMessage) {
      compact += `\nError Message / Stack Trace:\n${data.bugDescription.errorMessage}`;
    }
  }

  if (data.dependencies && Object.keys(data.dependencies).length > 0) {
    compact += `\n\n## Dependencies & Versions\n${Object.entries(data.dependencies).map(([name, version]) => `${name}: ${version}`).join('\n')}`;
  }

  compact += `\n\n# Task Decomposition\n${data.taskDecomposition
    .map((step, i) => `${i + 1}. ${stripLeadingListMarker(step)}`)
    .join('\n')}\n\n# Constraints & Requirements\n${data.constraints.map(constraint => `- ${constraint}`).join('\n')}\n\n# Output Format\n${data.outputFormat}`;

  return compact;
}

export const GENERATIVE_DETAILED_ANALYSIS_PROMPT = `You are an expert AI prompt engineer. Your task is to analyze an unstructured prompt and transform it into a comprehensive, well-structured generative prompt optimized for AI model-to-model communication for building features and products.

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

export const GENERATIVE_COMPACT_ANALYSIS_PROMPT = `You are an expert AI prompt engineer. Your task is to analyze an unstructured prompt and transform it into a focused, compact generative prompt optimized for quick, specific AI model-to-model communication for targeted development tasks.

CRITICAL: Generate concise, actionable content. Focus on essential elements only. Avoid verbose descriptions. The user expects focused, practical guidance that gets straight to the point.

The user will provide you with a raw prompt. You need to extract and structure it according to this compact format:

**Persona**: Brief, clear definition of the AI's role and expertise (1-2 sentences)
**Objective**: Specific, actionable goal statement (1-2 sentences)
**Project Overview** (Optional): Brief project context if relevant (1-2 sentences)
**Relevant Files** (Optional): List of specific files to focus on if applicable
**File Structure** (Optional): Relevant directory structure if needed for context
**Bug Description** (Optional): If applicable, include:
  - Expected behavior (brief)
  - Actual behavior (brief)  
  - Error message/stack trace (if available)
**Dependencies** (Optional): Key dependencies and versions if relevant
**Task Decomposition**: 3-5 specific, actionable steps
**Constraints**: 3-5 key constraints and requirements (brief bullet points)
**Output Format**: Specific format requirements for the deliverable

Return a JSON object with these fields:
- persona: string (brief role definition)
- objective: string (specific goal statement)
- projectOverview: string (optional, brief project context)
- relevantFiles: string (optional, specific files to focus on)
- fileStructure: string (optional, relevant directory structure)
- bugDescription: object (optional, with expected, actual, errorMessage fields)
- dependencies: object (optional, key-value pairs of name: version)
- taskDecomposition: string[] (array of 3-5 specific actionable steps)
- constraints: string[] (array of 3-5 key constraints)
- outputFormat: string (specific format requirements)

REQUIREMENT: Keep all content concise and actionable. Focus on practical guidance that enables immediate action. Omit optional fields if they don't add value to the specific task.`;

// Maintain backward compatibility
export const GENERATIVE_ANALYSIS_PROMPT = GENERATIVE_DETAILED_ANALYSIS_PROMPT;