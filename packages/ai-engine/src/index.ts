import { CollectorManager } from '@solsniff/data-collectors';
import { NarrativeDetector } from './agents/narrative-detector.js';
import { IdeaGenerator, type GeneratedIdea } from './agents/idea-generator.js';
import type { Signal, Narrative, BuildIdea } from '@solsniff/shared-types';

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 60);
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export interface AnalysisPipelineResult {
    narratives: Narrative[];
    allSignals: Omit<Signal, 'id' | 'createdAt'>[];
    errors: string[];
    metadata: {
        startedAt: Date;
        completedAt: Date;
        duration: number;
        signalCount: number;
        narrativeCount: number;
        ideaCount: number;
    };
}

export class AnalysisPipeline {
    private collectorManager: CollectorManager;
    private narrativeDetector: NarrativeDetector;
    private ideaGenerator: IdeaGenerator;

    constructor() {
        this.collectorManager = new CollectorManager();
        this.narrativeDetector = new NarrativeDetector();
        this.ideaGenerator = new IdeaGenerator();
    }

    async run(): Promise<AnalysisPipelineResult> {
        const startedAt = new Date();
        const errors: string[] = [];

        console.log('🚀 Starting SolSniff Analysis Pipeline...\n');

        // Step 1: Collect signals
        console.log('📡 Phase 1: Data Collection');
        const { signals, errors: collectionErrors } = await this.collectorManager.collectAll();
        errors.push(...collectionErrors);

        if (signals.length === 0) {
            console.warn('⚠️  No signals collected. Generating synthetic analysis...');
            // Generate with minimal data
        }

        console.log(`\n🧠 Phase 2: Narrative Detection (${signals.length} signals)`);

        // Step 2: Detect narratives
        let detectedNarratives;
        try {
            detectedNarratives = await this.narrativeDetector.detectNarratives(signals);
            console.log(`  ✅ Detected ${detectedNarratives.narratives.length} narratives`);
        } catch (error) {
            console.error('  ❌ Narrative detection failed:', error);
            errors.push(`Narrative detection failed: ${(error as Error).message}`);
            detectedNarratives = { narratives: [] };
        }

        // Step 3: Generate ideas for each narrative
        console.log('\n💡 Phase 3: Idea Generation');
        const ideasMap = await this.ideaGenerator.generateBatchIdeas(
            detectedNarratives.narratives.map(n => ({
                narrativeTitle: n.title,
                narrativeDescription: n.description,
                narrativeExplanation: n.explanation,
            }))
        );

        // Step 4: Assemble results
        const now = new Date();
        const fortnightPeriod = `${startedAt.toISOString().split('T')[0]}_${now.toISOString().split('T')[0]}`;

        const narratives: Narrative[] = detectedNarratives.narratives.map(n => {
            const narrativeId = generateId();
            const ideas = (ideasMap.get(n.title) || []).map((idea): BuildIdea => ({
                id: generateId(),
                title: idea.title,
                slug: generateSlug(idea.title),
                description: idea.description,
                problem: idea.problem,
                solution: idea.solution,
                targetAudience: idea.targetAudience,
                feasibility: idea.feasibility,
                category: idea.category as BuildIdea['category'],
                technicalRequirements: idea.technicalRequirements,
                potentialChallenges: idea.potentialChallenges,
                score: idea.score,
                narrativeId,
                createdAt: now,
            }));

            // Map related signals — use indices from LLM or fall back to empty
            const indices = Array.isArray(n.relatedSignalIndices) ? n.relatedSignalIndices : [];
            const relatedSignals: Signal[] = indices
                .filter(i => i >= 0 && i < signals.length)
                .map(i => ({
                    ...signals[i],
                    id: generateId(),
                    createdAt: now,
                }));

            // Provide robust defaults for fields the LLM may omit
            return {
                id: narrativeId,
                title: n.title,
                slug: generateSlug(n.title),
                description: n.description,
                explanation: n.explanation,
                status: n.status || 'emerging',
                confidenceScore: typeof n.confidenceScore === 'number' ? n.confidenceScore : 70,
                trendDirection: n.trendDirection || 'up',
                signals: relatedSignals,
                ideas,
                tags: Array.isArray(n.tags) ? n.tags : [],
                detectedAt: now,
                updatedAt: now,
                fortnightPeriod,
            };
        });

        const completedAt = new Date();
        const totalIdeas = narratives.reduce((sum, n) => sum + n.ideas.length, 0);

        console.log(`\n✨ Analysis Complete!`);
        console.log(`  📊 ${signals.length} signals → ${narratives.length} narratives → ${totalIdeas} build ideas`);
        console.log(`  ⏱  Duration: ${((completedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1)}s`);

        return {
            narratives,
            allSignals: signals,
            errors,
            metadata: {
                startedAt,
                completedAt,
                duration: completedAt.getTime() - startedAt.getTime(),
                signalCount: signals.length,
                narrativeCount: narratives.length,
                ideaCount: totalIdeas,
            },
        };
    }
}

export { NarrativeDetector } from './agents/narrative-detector.js';
export { IdeaGenerator } from './agents/idea-generator.js';
export { createLLMProvider, BaseLLMProvider } from './providers/index.js';
