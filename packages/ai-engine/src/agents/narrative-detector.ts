import { createLLMProvider, type BaseLLMProvider } from '../providers/index.js';
import type { Signal } from '@solsniff/shared-types';

interface NarrativeResult {
    narratives: {
        title: string;
        description: string;
        explanation: string;
        status: 'emerging' | 'accelerating' | 'established';
        confidenceScore: number;
        trendDirection: 'up' | 'down' | 'stable';
        tags: string[];
        relatedSignalIndices: number[];
    }[];
}

export class NarrativeDetector {
    private llm: BaseLLMProvider;

    constructor() {
        this.llm = createLLMProvider();
    }

    async detectNarratives(signals: Omit<Signal, 'id' | 'createdAt'>[]): Promise<NarrativeResult> {
        const signalSummary = signals
            .slice(0, 40) // Top 40 signals by score
            .map((s, i) => `[${i}] [${s.source}] (Score: ${s.score}) ${s.title}: ${s.description}`)
            .join('\n');

        const currentDate = new Date().toISOString().split('T')[0];

        const result = await this.llm.structuredOutput<NarrativeResult>([
            {
                role: 'system',
                content: `You are an expert crypto analyst specializing in the Solana ecosystem. Your job is to analyze signals from multiple data sources and identify emerging narratives — coherent themes or trends that indicate where the ecosystem is heading.

A "narrative" is a unifying theme that connects multiple signals. For example:
- "Solana DeFi Renaissance" (multiple DeFi protocols seeing TVL growth)
- "Institutional Adoption Wave" (institutional players entering Solana)
- "Developer Migration to Solana" (GitHub activity surge, new projects)
- "AI x Crypto Convergence" (AI-related projects launching on Solana)

You must identify 4-7 distinct narratives. Each must include ALL of these fields:
1. "title" - Clear, catchy title string
2. "description" - 1-2 sentence summary string
3. "explanation" - 2-4 paragraph detailed analysis string
4. "status" - MUST be one of: "emerging", "accelerating", or "established"
5. "confidenceScore" - integer 0-100 indicating your confidence
6. "trendDirection" - MUST be one of: "up", "down", or "stable"
7. "tags" - array of 3-6 keyword strings
8. "relatedSignalIndices" - array of integer indices referencing which signals support this narrative

Prioritize narratives that are EMERGING, ACTIONABLE, and SUPPORTED by multiple signal types.

Today's date: ${currentDate}`
            },
            {
                role: 'user',
                content: `Analyze these ${signals.length} signals from the Solana ecosystem and identify emerging narratives:\n\n${signalSummary}\n\nRespond with a JSON object matching this EXACT schema:
{
  "narratives": [
    {
      "title": "string",
      "description": "string",
      "explanation": "string",
      "status": "emerging" | "accelerating" | "established",
      "confidenceScore": 75,
      "trendDirection": "up" | "down" | "stable",
      "tags": ["tag1", "tag2", "tag3"],
      "relatedSignalIndices": [0, 1, 5]
    }
  ]
}

Every field is REQUIRED. Return 4-7 narratives.`
            }
        ]);

        return result;
    }
}
