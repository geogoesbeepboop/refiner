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
declare class ConfigManager {
    private config;
    constructor();
    get<K extends keyof RefinerConfig>(key: K): RefinerConfig[K];
    set<K extends keyof RefinerConfig>(key: K, value: RefinerConfig[K]): void;
    getAll(): RefinerConfig;
    reset(): void;
    getApiKey(): string | undefined;
    setApiKey(apiKey: string): void;
    getTemperature(type: PromptType): number;
}
export declare const config: ConfigManager;
export declare function getPromptTypeForModel(model: ModelType): PromptType;
export {};
