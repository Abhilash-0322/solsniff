import { config } from 'dotenv';
import { resolve } from 'path';
import type { LLMProviderType } from '@solsniff/shared-types';

// Load .env from monorepo root
config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

function getEnv(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (!value && defaultValue === undefined) {
        console.warn(`⚠️  Missing environment variable: ${key}`);
        return '';
    }
    return value || '';
}

export const appConfig = {
    nodeEnv: getEnv('NODE_ENV', 'development'),
    isDev: getEnv('NODE_ENV', 'development') === 'development',

    api: {
        port: parseInt(getEnv('API_PORT', '4000'), 10),
        corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
    },

    llm: {
        provider: getEnv('LLM_PROVIDER', 'groq') as LLMProviderType,
        groqApiKey: getEnv('GROQ_API_KEY'),
        openaiApiKey: getEnv('OPENAI_API_KEY'),
        anthropicApiKey: getEnv('ANTHROPIC_API_KEY'),
        defaultModel: {
            groq: 'llama-3.3-70b-versatile',
            openai: 'gpt-4o-mini',
            anthropic: 'claude-3-haiku-20240307',
        },
        temperature: 0.7,
        maxTokens: 4096,
    },

    dataSources: {
        heliusApiKey: getEnv('HELIUS_API_KEY'),
        githubToken: getEnv('GITHUB_TOKEN'),
        lunarCrushApiKey: getEnv('LUNARCRUSH_API_KEY'),
    },

    database: {
        url: getEnv('DATABASE_URL', 'file:./solsniff.db'),
    },

    schedule: {
        // Fortnightly refresh: every 14 days
        refreshIntervalDays: 14,
        // Hourly signal collection
        signalCollectionCron: '0 */6 * * *', // Every 6 hours
    },
} as const;

export type AppConfig = typeof appConfig;
export default appConfig;
