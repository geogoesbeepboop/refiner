import { OutputFormat, PromptFlavor } from '../utils/config';

export interface ReasoningDetailedPromptData {
  originalPrompt: string;
  goal: string;
  responseFormat: string;
  warnings: string[];
  context: string;
  analysisContent: string;
  requirementsContent: string;
  outputContent: string;
  orderedInstructions: {
    priority1: string[];
    priority2: string[];
    priority3: string[];
  };
  rankings: {
    security: string;
    performance: string;
    userExperience: string;
    maintainability: string;
  };
}

export interface ReasoningCompactPromptData {
  originalPrompt: string;
  problemStatement: string;
  knownInformation: string;
  hardConstraints: string[];
  keyAssumptions?: string[];
  reasoningFramework: {
    describe: string;
    isolate: string;
    sequence: string;
    test: string;
  };
  outputFormat: string;
}

export function buildReasoningTemplate(data: ReasoningDetailedPromptData | ReasoningCompactPromptData, format: OutputFormat, flavor: PromptFlavor = 'detailed'): string {
  if (flavor === 'compact') {
    return buildReasoningCompactMarkdown(data as ReasoningCompactPromptData);
  }
  if (format === 'json') {
    return buildReasoningJSON(data);
  }
  return buildReasoningMarkdown(data as ReasoningDetailedPromptData);
}

function buildReasoningMarkdown(data: ReasoningDetailedPromptData): string {
  const stripLeadingListMarker = (text: string): string => {
    // Remove leading numbering or bullet markers like "1.", "1)", "-", "*", "•"
    return text.replace(/^\s*(?:\d+[\.)]|[-*•])\s+/, '');
  };

  const template = `# Goal
${data.goal}

# Response Format
${data.responseFormat}

# Warnings
${data.warnings
  .map(warning => `- ${stripLeadingListMarker(warning)}`)
  .join('\n')}

# Context
${data.context}

# Separators

<analysis>
${data.analysisContent}
</analysis>

<requirements>
${data.requirementsContent}
</requirements>

<output>
${data.outputContent}
</output>

# Ordered Instructions

## Priority 1: Critical Requirements (Must Have)
${data.orderedInstructions.priority1
  .map(item => `- ${stripLeadingListMarker(item)}`)
  .join('\n')}

## Priority 2: Important Features (Should Have)
${data.orderedInstructions.priority2
  .map(item => `- ${stripLeadingListMarker(item)}`)
  .join('\n')}

## Priority 3: Nice-to-Have Enhancements (Could Have)
${data.orderedInstructions.priority3
  .map(item => `- ${stripLeadingListMarker(item)}`)
  .join('\n')}

# Rankings/Priorities
- **Security**: ${data.rankings.security}
- **Performance**: ${data.rankings.performance}
- **User Experience**: ${data.rankings.userExperience}
- **Maintainability**: ${data.rankings.maintainability}`;

  return template;
}

function buildReasoningJSON(data: ReasoningDetailedPromptData | ReasoningCompactPromptData): string {
  const isDetailed = 'goal' in data;
  
  if (isDetailed) {
    return buildReasoningDetailedJSON(data as ReasoningDetailedPromptData);
  } else {
    return buildReasoningCompactJSON(data as ReasoningCompactPromptData);
  }
}

function buildReasoningDetailedJSON(data: ReasoningDetailedPromptData): string {
  const jsonStructure = {
    prompt_type: "reasoning",
    structure: {
      goal: data.goal,
      response_format: data.responseFormat,
      warnings: data.warnings,
      context: data.context,
      separators: {
        analysis: data.analysisContent,
        requirements: data.requirementsContent,
        output: data.outputContent
      },
      ordered_instructions: {
        priority_1_critical: data.orderedInstructions.priority1,
        priority_2_important: data.orderedInstructions.priority2,
        priority_3_nice_to_have: data.orderedInstructions.priority3
      },
      rankings: {
        security: data.rankings.security,
        performance: data.rankings.performance,
        user_experience: data.rankings.userExperience,
        maintainability: data.rankings.maintainability
      }
    },
    optimized_for: "model_to_model_communication",
    reasoning_style: "structured_no_cot"
  };

  return JSON.stringify(jsonStructure, null, 2);
}

function buildReasoningCompactJSON(data: ReasoningCompactPromptData): string {
  const jsonStructure = {
    prompt_type: "reasoning_compact",
    structure: {
      problem_statement: data.problemStatement,
      known_information: data.knownInformation,
      hard_constraints: data.hardConstraints,
      ...(data.keyAssumptions && data.keyAssumptions.length > 0 && { key_assumptions: data.keyAssumptions }),
      reasoning_framework: {
        describe: data.reasoningFramework.describe,
        isolate: data.reasoningFramework.isolate,
        sequence: data.reasoningFramework.sequence,
        test: data.reasoningFramework.test
      },
      output_format: data.outputFormat
    },
    optimized_for: "model_to_model_communication",
    reasoning_style: "compact_structured"
  };

  return JSON.stringify(jsonStructure, null, 2);
}

function buildReasoningCompactMarkdown(data: ReasoningCompactPromptData): string {
  let compact = `# Problem Statement
${data.problemStatement}

# Known Information & Constraints
## Data / Code Under Analysis
${data.knownInformation}

## Hard Constraints
- ${data.hardConstraints.join('\n- ')}`;

  if (data.keyAssumptions && data.keyAssumptions.length > 0) {
    compact += `\n\n## Key Assumptions\n- ${data.keyAssumptions.join('\n- ')}`;
  }

  compact += `\n\n# Chain of Thought / Reasoning Framework (DESCRIBE → ISOLATE → SEQUENCE → TEST)
1. DESCRIBE: ${data.reasoningFramework.describe}
2. ISOLATE: ${data.reasoningFramework.isolate}
3. SEQUENCE: ${data.reasoningFramework.sequence}
4. TEST: ${data.reasoningFramework.test}

# Required Output Format
${data.outputFormat}`;

  return compact;
}

export const REASONING_DETAILED_ANALYSIS_PROMPT = `You are an expert AI prompt engineer. Your task is to analyze an unstructured prompt and transform it into a comprehensive, well-structured reasoning prompt optimized for AI model-to-model communication for building features and products.

CRITICAL: Generate extremely detailed, comprehensive content. Each section should be thorough and extensive. Avoid brief, superficial responses. The user expects 2-3x more detail than typical AI responses.

The user will provide you with a raw prompt. You need to extract and structure it according to this format, making each section comprehensive and detailed:

**Goal**: Clear, detailed statement of the feature/system to be built, including specific objectives, success criteria, target users, and expected outcomes
**Response Format**: Comprehensive structured requirements specification (JSON/markdown based on format flag), optimized for downstream model consumption with detailed formatting guidelines and structure expectations  
**Warnings**: Extensive critical constraints, security considerations, anti-patterns to avoid, potential pitfalls, edge cases, performance bottlenecks, and compliance requirements
**Context**: Detailed current system state, dependencies, architectural context, technical stack, team capabilities, timeline constraints, business requirements, and integration considerations
**Separators**: 
  - Analysis: Comprehensive problem breakdown, root cause analysis, approach methodology, technical considerations, and strategic planning
  - Requirements: Extensively detailed feature requirements with priorities, acceptance criteria, technical specifications, and implementation guidelines
  - Output: Final structured deliverable with comprehensive specifications, validation criteria, and quality gates
**Ordered Instructions**:
  - Priority 1: Comprehensive critical requirements (must have) with detailed specifications, technical requirements, and success criteria
  - Priority 2: Extensive important features (should have) with implementation details, dependencies, and validation approaches
  - Priority 3: Detailed nice-to-have enhancements (could have) with future roadmap considerations and extensibility patterns
**Rankings/Priorities**: Comprehensive assessment of Security, Performance, User Experience, and Maintainability levels with detailed explanations, metrics, and implementation strategies

Return ONLY a valid JSON object with these fields, ensuring each field contains comprehensive, detailed content:
- goal: string (detailed goal with specific objectives and success metrics)
- responseFormat: string (comprehensive format specifications)
- warnings: string[] (array of detailed warning strings covering all potential issues)
- context: string (extensive context including technical, business, and operational considerations)
- analysisContent: string (comprehensive content for <analysis> section with detailed breakdown and methodology)
- requirementsContent: string (extensive content for <requirements> section with detailed specifications and criteria)
- outputContent: string (comprehensive content for <output> section with detailed deliverable specifications)
- orderedInstructions: { priority1: string[] (detailed critical requirements), priority2: string[] (comprehensive important features), priority3: string[] (detailed enhancements) }
- rankings: { security: string (detailed security considerations and strategies), performance: string (comprehensive performance requirements and optimizations), userExperience: string (detailed UX requirements and guidelines), maintainability: string (extensive maintainability strategies and best practices) }

CRITICAL JSON REQUIREMENTS:
1. Return ONLY valid JSON - no explanatory text before or after
2. Ensure all strings are properly quoted with double quotes
3. Ensure all properties have commas between them
4. Escape any quotes within string values with backslashes
5. Do not include any markdown formatting or code fences

REQUIREMENT: Make each field extensively detailed and comprehensive. Prioritize thoroughness and depth over brevity. Focus on making this prompt perfect for logical, step-by-step feature building with clear priorities, detailed constraints, and comprehensive implementation guidance.`;

export const REASONING_COMPACT_ANALYSIS_PROMPT = `You are an expert AI prompt engineer. Your task is to analyze an unstructured prompt and transform it into a focused, compact reasoning prompt optimized for quick, structured AI model-to-model problem-solving communication.

CRITICAL: Generate concise, actionable content. Focus on essential elements for structured reasoning. Avoid verbose descriptions. The user expects focused, practical guidance that enables clear logical thinking.

The user will provide you with a raw prompt. You need to extract and structure it according to this compact reasoning format:

**Problem Statement**: Clear, specific problem or challenge to solve (4-5 sentences maximum, keep it concise)
**Known Information**: Key data, code, or context relevant to the problem (brief summary)
**Hard Constraints**: 3-5 non-negotiable limitations or requirements
**Key Assumptions** (Optional): Important assumptions being made (if applicable)
**Reasoning Framework**: Structure using DESCRIBE → ISOLATE → SEQUENCE → TEST:
  - DESCRIBE: What needs to be understood or analyzed
  - ISOLATE: What specific aspect to focus on
  - SEQUENCE: What steps or order to follow  
  - TEST: How to validate or verify the solution
**Output Format**: Specific format requirements for the final answer

Return ONLY a valid JSON object with these fields:
- problemStatement: string (clear, specific problem definition)
- knownInformation: string (relevant data/context summary)
- hardConstraints: string[] (array of 3-5 non-negotiable constraints)
- keyAssumptions: string[] (optional, key assumptions if relevant)
- reasoningFramework: object with describe, isolate, sequence, test fields (each a concise string)
- outputFormat: string (specific format requirements)

CRITICAL JSON REQUIREMENTS:
1. Return ONLY valid JSON - no explanatory text before or after
2. Ensure all strings are properly quoted with double quotes
3. Ensure all properties have commas between them
4. Escape any quotes within string values with backslashes
5. Do not include any markdown formatting or code fences

REQUIREMENT: Keep all content concise and focused on enabling clear, structured reasoning. Omit optional fields if they don't add value to the reasoning process. Focus on actionable guidance that supports logical problem-solving.`;

// Maintain backward compatibility
export const REASONING_ANALYSIS_PROMPT = REASONING_DETAILED_ANALYSIS_PROMPT;