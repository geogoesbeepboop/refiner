import ora, { Ora } from 'ora';

const LOADING_MESSAGES = [
  '🔧 Analyzing your prompt structure...',
  '🧠 Applying engineering best practices...',
  '⚡ Optimizing for model-to-model communication...',
  '✨ Generating feature-ready prompt...',
  '🚀 Polishing the final structure...',
  '🎯 Almost ready for action...',
  '🔨 Building something amazing...',
  '⚙️ Fine-tuning the prompt architecture...',
  '🌟 Adding that special touch...',
  '🎨 Crafting the perfect structure...'
];

export class LoadingUI {
  private spinner: Ora;
  private messageInterval?: NodeJS.Timeout;
  private currentMessageIndex = 0;

  constructor() {
    this.spinner = ora({
      spinner: 'dots',
      color: 'cyan'
    });
  }

  start(initialMessage?: string): void {
    const message = initialMessage || LOADING_MESSAGES[0];
    this.spinner.start(message);
    this.startMessageRotation();
  }

  stop(finalMessage?: string): void {
    this.stopMessageRotation();
    if (finalMessage) {
      this.spinner.succeed(finalMessage);
    } else {
      this.spinner.stop();
    }
  }

  fail(errorMessage: string): void {
    this.stopMessageRotation();
    this.spinner.fail(errorMessage);
  }

  succeed(successMessage: string): void {
    this.stopMessageRotation();
    this.spinner.succeed(successMessage);
  }

  updateMessage(message: string): void {
    this.spinner.text = message;
  }

  private startMessageRotation(): void {
    this.messageInterval = setInterval(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % LOADING_MESSAGES.length;
      this.spinner.text = LOADING_MESSAGES[this.currentMessageIndex];
    }, 2000); // Change message every 2 seconds
  }

  private stopMessageRotation(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = undefined;
    }
  }
}

export class MultiStageLoader {
  private currentLoader?: LoadingUI;
  private stages: string[] = [];
  private currentStageIndex = 0;

  constructor(stages: string[]) {
    this.stages = stages;
  }

  startStage(stageIndex?: number): void {
    if (stageIndex !== undefined) {
      this.currentStageIndex = stageIndex;
    }

    if (this.currentLoader) {
      this.currentLoader.stop();
    }

    this.currentLoader = new LoadingUI();
    
    if (this.currentStageIndex < this.stages.length) {
      this.currentLoader.start(this.stages[this.currentStageIndex]);
    } else {
      this.currentLoader.start();
    }
  }

  nextStage(): void {
    this.currentStageIndex++;
    this.startStage();
  }

  completeStage(message?: string): void {
    if (this.currentLoader) {
      this.currentLoader.succeed(message || `✅ Stage ${this.currentStageIndex + 1} complete`);
      this.currentLoader = undefined;
    }
  }

  failStage(errorMessage: string): void {
    if (this.currentLoader) {
      this.currentLoader.fail(errorMessage);
      this.currentLoader = undefined;
    }
  }

  completeAll(finalMessage?: string): void {
    if (this.currentLoader) {
      this.currentLoader.succeed(finalMessage || '🎉 All stages completed!');
      this.currentLoader = undefined;
    }
  }
}

export function createAnalysisLoader(): MultiStageLoader {
  return new MultiStageLoader([
    '🔍 Analyzing prompt structure and intent...',
    '🧠 Applying AI prompt engineering patterns...',
    '⚡ Structuring for optimal model communication...',
    '✨ Finalizing the enhanced prompt...'
  ]);
}

export function createSimpleLoader(message?: string): LoadingUI {
  return new LoadingUI();
}