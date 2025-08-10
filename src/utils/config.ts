import Conf from 'conf';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file without showing dotenv banner/logs
(() => {
  const originalLog = console.log;
  const originalInfo = console.info;
  try {
    console.log = () => {};
    console.info = () => {};
    dotenvConfig();
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
  }
})();

export type ModelType = 'openai:gpt-4o-mini' | 'openai:gpt-4.1-mini' | 'openai:gpt-5-mini';
export type PromptType = 'generative' | 'reasoning';
export type OutputFormat = 'markdown' | 'json';
export type OutputDestination = 'clipboard' | 'file';
export type PromptFlavor = 'detailed' | 'compact';

export interface RefinerConfig {
  defaultModel: ModelType;
  defaultType: PromptType;
  defaultFormat: OutputFormat;
  defaultOutput: OutputDestination;
  apiKey?: string;
  temperature: {
    generative: number;
    reasoning: number;
  };
}

const defaults: RefinerConfig = {
  defaultModel: 'openai:gpt-4o-mini',
  defaultType: 'reasoning',
  defaultFormat: 'markdown',
  defaultOutput: 'clipboard',
  temperature: {
    generative: 0.7,
    reasoning: 0.2
  }
};

class ConfigManager {
  private config: Conf;

  constructor() {
    this.config = new Conf({
      projectName: 'refiner',
      defaults: defaults
    });
  }

  get<K extends keyof RefinerConfig>(key: K): RefinerConfig[K] {
    return this.config.get(key, defaults[key]) as RefinerConfig[K];
  }

  set<K extends keyof RefinerConfig>(key: K, value: RefinerConfig[K]): void {
    this.config.set(key, value);
  }

  getAll(): RefinerConfig {
    return {
      defaultModel: this.get('defaultModel'),
      defaultType: this.get('defaultType'),
      defaultFormat: this.get('defaultFormat'),
      defaultOutput: this.get('defaultOutput'),
      apiKey: this.get('apiKey'),
      temperature: this.get('temperature')
    };
  }

  reset(): void {
    this.config.clear();
  }

  getApiKey(): string | undefined {
    return this.get('apiKey') || process.env.OPENAI_API_KEY;
  }

  setApiKey(apiKey: string): void {
    this.set('apiKey', apiKey);
  }

  getTemperature(type: PromptType): number {
    const temps = this.get('temperature');
    return temps[type];
  }
}

export const config = new ConfigManager();

// Helper to infer the ideal prompt type for a given model
export function getPromptTypeForModel(model: ModelType): PromptType {
  // Assumptions based on current supported models in this CLI
  // - openai:gpt-4o-mini → optimized for reasoning-style prompts
  // - openai:gpt-4.1-mini → better suited for generative-style prompts
  // - openai:gpt-5-mini → treat as reasoning-oriented by default
  switch (model) {
    case 'openai:gpt-4o-mini':
      return 'reasoning';
    case 'openai:gpt-4.1-mini':
      return 'generative';
    case 'openai:gpt-5-mini':
    default:
      return 'reasoning';
  }
}