export declare class LoadingUI {
    private spinner;
    private messageInterval?;
    private currentMessageIndex;
    constructor();
    start(initialMessage?: string): void;
    stop(finalMessage?: string): void;
    fail(errorMessage: string): void;
    succeed(successMessage: string): void;
    updateMessage(message: string): void;
    private startMessageRotation;
    private stopMessageRotation;
}
export declare class MultiStageLoader {
    private currentLoader?;
    private stages;
    private currentStageIndex;
    constructor(stages: string[]);
    startStage(stageIndex?: number): void;
    nextStage(): void;
    completeStage(message?: string): void;
    failStage(errorMessage: string): void;
    completeAll(finalMessage?: string): void;
}
export declare function createAnalysisLoader(): MultiStageLoader;
export declare function createStreamingAnalysisLoader(): MultiStageLoader;
export declare class StreamingLoader {
    private spinner;
    private thinkingContent;
    private showThinking;
    constructor(showThinking?: boolean);
    startConnecting(): void;
    startThinking(): void;
    onThinkingDelta(delta: string): void;
    startWebSearch(query: string): void;
    onWebSearchResults(resultCount: number): void;
    startResponse(): void;
    onResponseDelta(delta: string): void;
    complete(finalMessage?: string): void;
    fail(errorMessage: string): void;
    getThinkingContent(): string;
}
export declare function createSimpleLoader(message?: string): LoadingUI;
