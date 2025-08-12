export type ModelType = 'openai:gpt-4o-mini' | 'openai:gpt-4.1-mini' | 'openai:gpt-5-mini' | 'claude:sonnet-4-0';
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
    claudeApiKey?: string;
    temperature: {
        generative: number;
        reasoning: number;
    };
    streaming: {
        enabled: boolean;
        showThinking: boolean;
        thinkingBudgetTokens: number;
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
    getClaudeApiKey(): string | undefined;
    setClaudeApiKey(apiKey: string): void;
    getTemperature(type: PromptType): number;
}
export declare const config: ConfigManager;
export declare function getPromptTypeForModel(model: ModelType): PromptType;
export declare function modelSupportsStreaming(model: ModelType): boolean;
export declare function modelSupportsThinking(model: ModelType): boolean;
export declare function modelSupportsWebSearch(model: ModelType): boolean;
export {};
