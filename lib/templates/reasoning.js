"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REASONING_ANALYSIS_PROMPT = void 0;
exports.buildReasoningTemplate = buildReasoningTemplate;
function buildReasoningTemplate(data, format) {
    if (format === 'json') {
        return buildReasoningJSON(data);
    }
    return buildReasoningMarkdown(data);
}
function buildReasoningMarkdown(data) {
    const stripLeadingListMarker = (text) => {
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
function buildReasoningJSON(data) {
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
exports.REASONING_ANALYSIS_PROMPT = `You are an expert AI prompt engineer. Your task is to analyze an unstructured prompt and transform it into a comprehensive, well-structured reasoning prompt optimized for AI model-to-model communication for building features and products.

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

Return a JSON object with these fields, ensuring each field contains comprehensive, detailed content:
- goal: string (detailed goal with specific objectives and success metrics)
- responseFormat: string (comprehensive format specifications)
- warnings: string[] (array of detailed warning strings covering all potential issues)
- context: string (extensive context including technical, business, and operational considerations)
- analysisContent: string (comprehensive content for <analysis> section with detailed breakdown and methodology)
- requirementsContent: string (extensive content for <requirements> section with detailed specifications and criteria)
- outputContent: string (comprehensive content for <output> section with detailed deliverable specifications)
- orderedInstructions: { priority1: string[] (detailed critical requirements), priority2: string[] (comprehensive important features), priority3: string[] (detailed enhancements) }
- rankings: { security: string (detailed security considerations and strategies), performance: string (comprehensive performance requirements and optimizations), userExperience: string (detailed UX requirements and guidelines), maintainability: string (extensive maintainability strategies and best practices) }

REQUIREMENT: Make each field extensively detailed and comprehensive. Prioritize thoroughness and depth over brevity. Focus on making this prompt perfect for logical, step-by-step feature building with clear priorities, detailed constraints, and comprehensive implementation guidance.`;
