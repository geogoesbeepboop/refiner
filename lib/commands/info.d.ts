import { Command } from '@oclif/core';
export default class Info extends Command {
    static description: string;
    run(): Promise<void>;
}
