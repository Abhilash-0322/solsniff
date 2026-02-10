import { BaseLLMProvider } from './base-provider.js';
import { GroqProvider } from './groq-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { appConfig } from '@solsniff/config';
import type { LLMConfig, LLMProviderType } from '@solsniff/shared-types';

export function createLLMProvider(providerOverride?: LLMProviderType): BaseLLMProvider {
    const providerType = providerOverride || appConfig.llm.provider;

    const config: LLMConfig = {
        provider: providerType,
        model: appConfig.llm.defaultModel[providerType],
        temperature: appConfig.llm.temperature,
        maxTokens: appConfig.llm.maxTokens,
        apiKey: getApiKey(providerType),
    };

    switch (providerType) {
        case 'groq':
            return new GroqProvider(config);
        case 'openai':
            return new OpenAIProvider(config);
        case 'anthropic':
            // Anthropic uses OpenAI-compatible format via their API
            return new OpenAIProvider(config, 'https://api.anthropic.com/v1');
        default:
            console.warn(`Unknown provider: ${providerType}, falling back to Groq`);
            config.provider = 'groq';
            config.model = appConfig.llm.defaultModel.groq;
            config.apiKey = appConfig.llm.groqApiKey;
            return new GroqProvider(config);
    }
}

function getApiKey(provider: LLMProviderType): string {
    switch (provider) {
        case 'groq':
            return appConfig.llm.groqApiKey;
        case 'openai':
            return appConfig.llm.openaiApiKey;
        case 'anthropic':
            return appConfig.llm.anthropicApiKey;
        default:
            return appConfig.llm.groqApiKey;
    }
}

export { BaseLLMProvider } from './base-provider.js';
export { GroqProvider } from './groq-provider.js';
export { OpenAIProvider } from './openai-provider.js';
