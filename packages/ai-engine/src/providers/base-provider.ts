import type { LLMMessage, LLMResponse, LLMConfig } from '@solsniff/shared-types';

export abstract class BaseLLMProvider {
    protected config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = config;
    }

    abstract chat(messages: LLMMessage[]): Promise<LLMResponse>;

    async structuredOutput<T>(messages: LLMMessage[], schema?: string): Promise<T> {
        // Add JSON instruction to system message
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg) {
            systemMsg.content += '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code blocks, no extra text. Just raw JSON.';
            if (schema) {
                systemMsg.content += `\n\nExpected JSON schema:\n${schema}`;
            }
        }

        const response = await this.chat(messages);

        try {
            // Try to parse directly
            let content = response.content.trim();

            // Remove markdown code blocks if present
            if (content.startsWith('```')) {
                content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }

            return JSON.parse(content) as T;
        } catch (error) {
            console.error('Failed to parse LLM JSON response:', response.content.substring(0, 200));

            // Try to extract JSON from the response
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]) as T;
                } catch {
                    // Fall through
                }
            }

            const arrayMatch = response.content.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                try {
                    return JSON.parse(arrayMatch[0]) as T;
                } catch {
                    // Fall through
                }
            }

            throw new Error(`Failed to parse LLM response as JSON: ${(error as Error).message}`);
        }
    }
}
