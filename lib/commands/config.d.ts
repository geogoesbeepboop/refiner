import { Command } from '@oclif/core';
export default class Config extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        show: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        reset: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    private showConfig;
    private interactiveFlow;
}
