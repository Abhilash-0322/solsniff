import type { Signal, SignalSource, SignalStrength } from '@solsniff/shared-types';

export interface CollectorResult {
    signals: Omit<Signal, 'id' | 'createdAt'>[];
    rawData: Record<string, any>;
}

export abstract class BaseCollector {
    abstract source: SignalSource;
    abstract name: string;

    abstract collect(): Promise<CollectorResult>;

    protected createSignal(
        title: string,
        description: string,
        score: number,
        metadata: Record<string, any> = {},
        url?: string
    ): Omit<Signal, 'id' | 'createdAt'> {
        return {
            source: this.source,
            title,
            description,
            url,
            strength: this.scoreToStrength(score),
            score,
            metadata,
            detectedAt: new Date(),
        };
    }

    protected scoreToStrength(score: number): SignalStrength {
        if (score >= 80) return 'very_strong';
        if (score >= 60) return 'strong';
        if (score >= 40) return 'moderate';
        return 'weak';
    }

    protected async fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                if (response.status === 429) {
                    // Rate limited - wait exponentially
                    await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
                    continue;
                }
                if (i === retries - 1) return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            }
        }
        throw new Error(`Failed after ${retries} retries`);
    }
}
