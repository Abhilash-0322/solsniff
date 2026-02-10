import { BaseLLMProvider } from './base-provider.js';
import type { LLMMessage, LLMResponse, LLMConfig } from '@solsniff/shared-types';

/**
 * OpenAI-compatible provider. Works with OpenAI API and any compatible endpoints.
 */
export class OpenAIProvider extends BaseLLMProvider {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: LLMConfig, baseUrl = 'https://api.openai.com/v1') {
        super(config);
        this.apiKey = config.apiKey;
        this.baseUrl = baseUrl;
    }

    async chat(messages: LLMMessage[]): Promise<LLMResponse> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json() as any;
        const choice = data.choices?.[0];

        return {
            content: choice?.message?.content || '',
            model: data.model,
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
            },
        };
    }
}
