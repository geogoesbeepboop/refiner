import { OutputFormat } from '../utils/config';
export interface ReasoningPromptData {
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
export declare function buildReasoningTemplate(data: ReasoningPromptData, format: OutputFormat): string;
export declare const REASONING_ANALYSIS_PROMPT = "You are an expert AI prompt engineer. Your task is to analyze an unstructured prompt and transform it into a comprehensive, well-structured reasoning prompt optimized for AI model-to-model communication for building features and products.\n\nCRITICAL: Generate extremely detailed, comprehensive content. Each section should be thorough and extensive. Avoid brief, superficial responses. The user expects 2-3x more detail than typical AI responses.\n\nThe user will provide you with a raw prompt. You need to extract and structure it according to this format, making each section comprehensive and detailed:\n\n**Goal**: Clear, detailed statement of the feature/system to be built, including specific objectives, success criteria, target users, and expected outcomes\n**Response Format**: Comprehensive structured requirements specification (JSON/markdown based on format flag), optimized for downstream model consumption with detailed formatting guidelines and structure expectations  \n**Warnings**: Extensive critical constraints, security considerations, anti-patterns to avoid, potential pitfalls, edge cases, performance bottlenecks, and compliance requirements\n**Context**: Detailed current system state, dependencies, architectural context, technical stack, team capabilities, timeline constraints, business requirements, and integration considerations\n**Separators**: \n  - Analysis: Comprehensive problem breakdown, root cause analysis, approach methodology, technical considerations, and strategic planning\n  - Requirements: Extensively detailed feature requirements with priorities, acceptance criteria, technical specifications, and implementation guidelines\n  - Output: Final structured deliverable with comprehensive specifications, validation criteria, and quality gates\n**Ordered Instructions**:\n  - Priority 1: Comprehensive critical requirements (must have) with detailed specifications, technical requirements, and success criteria\n  - Priority 2: Extensive important features (should have) with implementation details, dependencies, and validation approaches\n  - Priority 3: Detailed nice-to-have enhancements (could have) with future roadmap considerations and extensibility patterns\n**Rankings/Priorities**: Comprehensive assessment of Security, Performance, User Experience, and Maintainability levels with detailed explanations, metrics, and implementation strategies\n\nReturn a JSON object with these fields, ensuring each field contains comprehensive, detailed content:\n- goal: string (detailed goal with specific objectives and success metrics)\n- responseFormat: string (comprehensive format specifications)\n- warnings: string[] (array of detailed warning strings covering all potential issues)\n- context: string (extensive context including technical, business, and operational considerations)\n- analysisContent: string (comprehensive content for <analysis> section with detailed breakdown and methodology)\n- requirementsContent: string (extensive content for <requirements> section with detailed specifications and criteria)\n- outputContent: string (comprehensive content for <output> section with detailed deliverable specifications)\n- orderedInstructions: { priority1: string[] (detailed critical requirements), priority2: string[] (comprehensive important features), priority3: string[] (detailed enhancements) }\n- rankings: { security: string (detailed security considerations and strategies), performance: string (comprehensive performance requirements and optimizations), userExperience: string (detailed UX requirements and guidelines), maintainability: string (extensive maintainability strategies and best practices) }\n\nREQUIREMENT: Make each field extensively detailed and comprehensive. Prioritize thoroughness and depth over brevity. Focus on making this prompt perfect for logical, step-by-step feature building with clear priorities, detailed constraints, and comprehensive implementation guidance.";
