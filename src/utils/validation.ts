import { ModelType, PromptType, OutputFormat, OutputDestination } from './config';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validatePrompt(prompt: string): void {
  if (!prompt || typeof prompt !== 'string') {
    throw new ValidationError('Prompt must be a non-empty string');
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    throw new ValidationError('Prompt cannot be empty or contain only whitespace');
  }

  if (trimmedPrompt.length < 5) {
    throw new ValidationError('Prompt must be at least 5 characters long');
  }

  if (trimmedPrompt.length > 10000) {
    throw new ValidationError('Prompt must be less than 10,000 characters');
  }
}

export function validateModel(model: string): ModelType {
  const validModels: ModelType[] = ['openai:gpt-4o-mini', 'openai:gpt-4.1-mini', 'openai:gpt-5-mini'];
  
  if (!validModels.includes(model as ModelType)) {
    throw new ValidationError(`Invalid model type. Must be one of: ${validModels.join(', ')}`);
  }
  
  return model as ModelType;
}

export function validatePromptType(type: string): PromptType {
  const validTypes: PromptType[] = ['generative', 'reasoning'];
  
  if (!validTypes.includes(type as PromptType)) {
    throw new ValidationError(`Invalid prompt type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  return type as PromptType;
}

export function validateOutputFormat(format: string): OutputFormat {
  const validFormats: OutputFormat[] = ['markdown', 'json'];
  
  if (!validFormats.includes(format as OutputFormat)) {
    throw new ValidationError(`Invalid output format. Must be one of: ${validFormats.join(', ')}`);
  }
  
  return format as OutputFormat;
}

export function validateOutputDestination(destination: string): OutputDestination {
  const validDestinations: OutputDestination[] = ['clipboard', 'file'];
  
  if (!validDestinations.includes(destination as OutputDestination)) {
    throw new ValidationError(`Invalid output destination. Must be one of: ${validDestinations.join(', ')}`);
  }
  
  return destination as OutputDestination;
}

export function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('API key must be a non-empty string');
  }

  const trimmedKey = apiKey.trim();
  if (trimmedKey.length === 0) {
    throw new ValidationError('API key cannot be empty or contain only whitespace');
  }

  // Basic OpenAI API key format validation
  if (!trimmedKey.startsWith('sk-')) {
    throw new ValidationError('OpenAI API key must start with "sk-"');
  }

  if (trimmedKey.length < 20) {
    throw new ValidationError('API key appears to be too short');
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
}

export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function validateJsonOutput(jsonString: string): void {
  if (!isValidJson(jsonString)) {
    throw new ValidationError('Generated output is not valid JSON');
  }
}