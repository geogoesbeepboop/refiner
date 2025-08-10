"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const conf_1 = __importDefault(require("conf"));
const dotenv_1 = require("dotenv");
// Load environment variables from .env file without showing dotenv banner/logs
(() => {
    const originalLog = console.log;
    const originalInfo = console.info;
    try {
        console.log = () => { };
        console.info = () => { };
        (0, dotenv_1.config)();
    }
    finally {
        console.log = originalLog;
        console.info = originalInfo;
    }
})();
const defaults = {
    defaultModel: 'openai:gpt-4o-mini',
    defaultType: 'generative',
    defaultFormat: 'markdown',
    defaultOutput: 'clipboard',
    temperature: {
        generative: 0.7,
        reasoning: 0.2
    }
};
class ConfigManager {
    constructor() {
        this.config = new conf_1.default({
            projectName: 'refiner',
            defaults: defaults
        });
    }
    get(key) {
        return this.config.get(key, defaults[key]);
    }
    set(key, value) {
        this.config.set(key, value);
    }
    getAll() {
        return {
            defaultModel: this.get('defaultModel'),
            defaultType: this.get('defaultType'),
            defaultFormat: this.get('defaultFormat'),
            defaultOutput: this.get('defaultOutput'),
            apiKey: this.get('apiKey'),
            temperature: this.get('temperature')
        };
    }
    reset() {
        this.config.clear();
    }
    getApiKey() {
        return this.get('apiKey') || process.env.OPENAI_API_KEY;
    }
    setApiKey(apiKey) {
        this.set('apiKey', apiKey);
    }
    getTemperature(type) {
        const temps = this.get('temperature');
        return temps[type];
    }
}
exports.config = new ConfigManager();
