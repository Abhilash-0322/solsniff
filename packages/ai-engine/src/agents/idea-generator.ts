import { createLLMProvider, type BaseLLMProvider } from '../providers/index.js';

interface IdeaGenerationInput {
    narrativeTitle: string;
    narrativeDescription: string;
    narrativeExplanation: string;
}

export interface GeneratedIdea {
    title: string;
    description: string;
    problem: string;
    solution: string;
    targetAudience: string;
    feasibility: 'low' | 'medium' | 'high';
    category: string;
    technicalRequirements: string[];
    potentialChallenges: string[];
    score: number;
}

interface IdeaResult {
    ideas: GeneratedIdea[];
}

export class IdeaGenerator {
    private llm: BaseLLMProvider;

    constructor() {
        this.llm = createLLMProvider();
    }

    async generateIdeas(narrative: IdeaGenerationInput): Promise<GeneratedIdea[]> {
        const result = await this.llm.structuredOutput<IdeaResult>([
            {
                role: 'system',
                content: `You are a visionary product strategist with deep expertise in the Solana ecosystem, blockchain technology, and startup building. Given a narrative/trend in the Solana ecosystem, you generate concrete, buildable product ideas.

Each idea should be:
- SPECIFIC: Not vague concepts but concrete products with clear scope
- FEASIBLE: Buildable by a small team in 3-6 months
- NOVEL: Not copies of existing products — find whitespace
- SOLANA-NATIVE: Leverage Solana's unique strengths (speed, low cost, composability)
- MARKET-READY: Address real user needs with clear target audiences

For each idea, provide:
- title: Catchy product name
- description: 2-3 sentence elevator pitch
- problem: What specific problem does this solve?
- solution: How does it solve it? What's the core mechanism?
- targetAudience: Who are the primary users?
- feasibility: low/medium/high (based on technical complexity)
- category: defi/nft/infrastructure/tooling/social/gaming/payments/dao/ai/other
- technicalRequirements: Key technical components needed (array of strings)
- potentialChallenges: Main risks and challenges (array of strings)
- score: 0-100 (your confidence in this idea's viability)

Generate exactly 4 ideas per narrative, ranging from practical to ambitious.`
            },
            {
                role: 'user',
                content: `Generate 4 concrete product ideas for this Solana ecosystem narrative:

**Narrative: ${narrative.narrativeTitle}**
${narrative.narrativeDescription}

**Detailed Analysis:**
${narrative.narrativeExplanation}

Respond with a JSON object containing an "ideas" array with exactly 4 idea objects.`
            }
        ]);

        return result.ideas;
    }

    async generateBatchIdeas(narratives: IdeaGenerationInput[]): Promise<Map<string, GeneratedIdea[]>> {
        const results = new Map<string, GeneratedIdea[]>();

        for (const narrative of narratives) {
            try {
                console.log(`  💡 Generating ideas for: ${narrative.narrativeTitle}`);
                const ideas = await this.generateIdeas(narrative);
                results.set(narrative.narrativeTitle, ideas);

                // Small delay between API calls to avoid rate limiting
                await new Promise(r => setTimeout(r, 2000));
            } catch (error) {
                console.error(`  ❌ Failed to generate ideas for: ${narrative.narrativeTitle}`, error);
                results.set(narrative.narrativeTitle, []);
            }
        }

        return results;
    }
}
