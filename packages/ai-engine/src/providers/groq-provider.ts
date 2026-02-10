import Groq from 'groq-sdk';
import { BaseLLMProvider } from './base-provider.js';
import type { LLMMessage, LLMResponse, LLMConfig } from '@solsniff/shared-types';

export class GroqProvider extends BaseLLMProvider {
    private client: Groq;

    constructor(config: LLMConfig) {
        super(config);
        this.client = new Groq({ apiKey: config.apiKey });
    }

    async chat(messages: LLMMessage[]): Promise<LLMResponse> {
        try {
            const completion = await this.client.chat.completions.create({
                model: this.config.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
            });

            const choice = completion.choices[0];
            return {
                content: choice?.message?.content || '',
                model: completion.model,
                usage: {
                    promptTokens: completion.usage?.prompt_tokens || 0,
                    completionTokens: completion.usage?.completion_tokens || 0,
                    totalTokens: completion.usage?.total_tokens || 0,
                },
            };
        } catch (error: any) {
            // Handle rate limiting with retry
            if (error?.status === 429) {
                console.warn('Groq rate limited, waiting 5s...');
                await new Promise(r => setTimeout(r, 5000));
                return this.chat(messages);
            }
            throw error;
        }
    }
}
