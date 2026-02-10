import express from 'express';
import cors from 'cors';
import { appConfig } from '@solsniff/config';
import { AnalysisPipeline, type AnalysisPipelineResult } from '@solsniff/ai-engine';
import type { Narrative, BuildIdea, Signal } from '@solsniff/shared-types';
import { prisma } from '@solsniff/database';

const app = express();
app.use(cors({ origin: appConfig.api.corsOrigin }));
app.use(express.json());

// In-memory cache for analysis results
let cachedResult: AnalysisPipelineResult | null = null;
let isAnalyzing = false;
let lastAnalyzedAt: Date | null = null;

// ===== Health Check =====
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            version: '1.0.0',
            lastAnalyzedAt: lastAnalyzedAt?.toISOString() || null,
            cachedNarratives: cachedResult?.narratives.length || 0,
            isAnalyzing,
        },
        timestamp: new Date().toISOString(),
    });
});

// ===== Get All Narratives =====
app.get('/api/narratives', (_req, res) => {
    if (!cachedResult) {
        return res.json({
            success: true,
            data: [],
            timestamp: new Date().toISOString(),
        });
    }

    const narratives = cachedResult.narratives.map(n => ({
        ...n,
        signals: undefined, // Don't include full signals in list view
        // Use loaded counts if available (from DB load), otherwise calculate
        signalCount: n.signals?.length || 0,
        ideaCount: n.ideas?.length || 0,
    }));

    res.json({
        success: true,
        data: narratives,
        timestamp: new Date().toISOString(),
    });
});

// ===== Get Single Narrative =====
app.get('/api/narratives/:slug', (req, res) => {
    if (!cachedResult) {
        return res.status(404).json({ success: false, error: 'No analysis data available' });
    }

    const narrative = cachedResult.narratives.find(n => n.slug === req.params.slug || n.id === req.params.slug);
    if (!narrative) {
        return res.status(404).json({ success: false, error: 'Narrative not found' });
    }

    res.json({
        success: true,
        data: narrative,
        timestamp: new Date().toISOString(),
    });
});

// ===== Get All Ideas =====
app.get('/api/ideas', (req, res) => {
    if (!cachedResult) {
        return res.json({ success: true, data: [], timestamp: new Date().toISOString() });
    }

    let ideas = cachedResult.narratives.flatMap(n =>
        (n.ideas || []).map(idea => ({
            ...idea,
            narrativeTitle: n.title,
            narrativeSlug: n.slug,
        }))
    );

    // Filter by category if specified
    const category = req.query.category as string;
    if (category) {
        ideas = ideas.filter(i => i.category === category);
    }

    // Sort by score
    ideas.sort((a, b) => b.score - a.score);

    res.json({
        success: true,
        data: ideas,
        timestamp: new Date().toISOString(),
    });
});

// ===== Get Signals =====
app.get('/api/signals', (req, res) => {
    if (!cachedResult) {
        return res.json({ success: true, data: [], timestamp: new Date().toISOString() });
    }

    let signals = [...(cachedResult.allSignals || [])];

    // Filter by source
    const source = req.query.source as string;
    if (source) {
        signals = signals.filter(s => s.source === source);
    }

    // Paginate
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const start = (page - 1) * pageSize;
    const paginatedSignals = signals.slice(start, start + pageSize);

    res.json({
        success: true,
        data: paginatedSignals,
        total: signals.length,
        page,
        pageSize,
        timestamp: new Date().toISOString(),
    });
});

// ===== Get Analysis Metadata =====
app.get('/api/analysis/status', (_req, res) => {
    res.json({
        success: true,
        data: {
            isAnalyzing,
            lastAnalyzedAt: lastAnalyzedAt?.toISOString() || null,
            metadata: cachedResult?.metadata || null,
        },
        timestamp: new Date().toISOString(),
    });
});

// ===== Trigger Manual Analysis =====
app.post('/api/analyze', async (_req, res) => {
    if (isAnalyzing) {
        return res.status(409).json({
            success: false,
            error: 'Analysis already in progress',
        });
    }

    // Start analysis in background
    res.json({
        success: true,
        data: { message: 'Analysis started' },
        timestamp: new Date().toISOString(),
    });

    runAnalysis();
});

// ===== Database Persistence =====

async function saveToDatabase(result: AnalysisPipelineResult) {
    console.log(`\n💾 SAVING TO DATABASE...`);
    console.log(`   URL: ${process.env.DATABASE_URL || 'NOT SET'}`);
    console.log(`   Config URL: ${appConfig.database.url}`);

    try {
        // 1. Create AnalysisReport
        const report = await prisma.analysisReport.create({
            data: {
                period: new Date().toISOString(), // Unique per run roughly
                startDate: result.metadata.startedAt,
                endDate: result.metadata.completedAt,
                summary: `Analysis of ${result.metadata.signalCount} signals identifying ${result.metadata.narrativeCount} narratives.`,
                totalSignals: result.metadata.signalCount,
                signalBreakdown: JSON.stringify({}), // simplified for now
            }
        });

        // 2. Save Signals
        // We do this in a transaction or minimal batch to avoid collisions if re-running
        // Ideally we check de-duplication, but for this MVP we'll just insert
        // Note: Real world would use upsert based on unique source ID/hash

        // 3. Save Narratives recursively with Ideas and linking Signals
        for (const n of result.narratives) {
            await prisma.narrative.create({
                data: {
                    title: n.title,
                    slug: n.slug + '-' + Math.random().toString(36).substring(7), // Ensure unique slug for historical runs
                    description: n.description,
                    explanation: n.explanation,
                    status: n.status,
                    confidenceScore: n.confidenceScore,
                    trendDirection: n.trendDirection,
                    tags: JSON.stringify(n.tags),
                    fortnightPeriod: n.fortnightPeriod,
                    reportId: report.id,

                    ideas: {
                        create: n.ideas.map(i => ({
                            title: i.title,
                            slug: i.slug + '-' + Math.random().toString(36).substring(7),
                            description: i.description,
                            problem: i.problem,
                            solution: i.solution,
                            targetAudience: i.targetAudience,
                            feasibility: i.feasibility,
                            category: i.category,
                            technicalRequirements: JSON.stringify(i.technicalRequirements),
                            potentialChallenges: JSON.stringify(i.potentialChallenges),
                            score: i.score
                        }))
                    }
                    // We skip signal linking in DB for this MVP to avoid complex relation logic with existing signals
                    // or just save them as new records if they are transient
                }
            });
        }

        console.log('✅ Saved to database successfully.');
    } catch (error) {
        console.error('❌ Failed to save to database:', error);
    }
}

async function loadFromDatabase() {
    console.log('🔍 Attempting to load latest analysis from database...');
    try {
        const lastReport = await prisma.analysisReport.findFirst({
            orderBy: { generatedAt: 'desc' },
            include: {
                narratives: {
                    include: {
                        ideas: true
                    }
                }
            }
        });

        if (lastReport && lastReport.narratives.length > 0) {
            console.log(`✅ Loaded report from ${lastReport.generatedAt.toISOString()}`);

            // Reconstruct AnalysisPipelineResult structure
            // Note: We might be missing raw signals if we didn't save them fully linked,
            // but we can reconstruct a partial result for display

            const narratives: Narrative[] = lastReport.narratives.map(n => ({
                id: n.id,
                title: n.title,
                slug: n.slug.split('-').slice(0, -1).join('-'), // Remove random suffix if added
                description: n.description,
                explanation: n.explanation,
                status: n.status as any,
                confidenceScore: n.confidenceScore,
                trendDirection: n.trendDirection as any,
                tags: JSON.parse(n.tags),
                detectedAt: n.detectedAt,
                updatedAt: n.updatedAt,
                fortnightPeriod: n.fortnightPeriod,
                signals: [], // Signals not fully persisted in this simplified MVP flow yet
                ideas: n.ideas.map(i => ({
                    id: i.id,
                    title: i.title,
                    slug: i.slug.split('-').slice(0, -1).join('-'),
                    description: i.description,
                    problem: i.problem,
                    solution: i.solution,
                    targetAudience: i.targetAudience,
                    feasibility: i.feasibility as any,
                    category: i.category as any,
                    technicalRequirements: JSON.parse(i.technicalRequirements),
                    potentialChallenges: JSON.parse(i.potentialChallenges),
                    score: i.score,
                    narrativeId: n.id,
                    createdAt: i.createdAt
                }))
            }));

            cachedResult = {
                narratives,
                allSignals: [], // We accept this is empty on restore for now
                errors: [],
                metadata: {
                    startedAt: lastReport.startDate,
                    completedAt: lastReport.endDate,
                    duration: 0,
                    signalCount: lastReport.totalSignals,
                    narrativeCount: narratives.length,
                    ideaCount: narratives.reduce((acc, n) => acc + n.ideas.length, 0)
                }
            };

            lastAnalyzedAt = lastReport.generatedAt;
            return true;
        }
    } catch (error) {
        console.error('⚠️ Could not load from database:', error);
    }
    return false;
}

// ===== Analysis Runner =====
async function runAnalysis() {
    if (isAnalyzing) return;
    isAnalyzing = true;

    try {
        console.log('\n' + '='.repeat(60));
        console.log('🔬 Running SolSniff Analysis Pipeline...');
        console.log('='.repeat(60) + '\n');

        const pipeline = new AnalysisPipeline();
        cachedResult = await pipeline.run();
        lastAnalyzedAt = new Date();

        console.log('\n' + '='.repeat(60));
        console.log('✅ Analysis complete and cached!');
        console.log('='.repeat(60) + '\n');

        // Save to DB
        await saveToDatabase(cachedResult);

    } catch (error) {
        console.error('❌ Analysis failed:', error);
    } finally {
        isAnalyzing = false;
    }
}

// ===== Start Server =====
const PORT = appConfig.api.port;
app.listen(PORT, async () => {
    console.log(`\n🚀 SolSniff API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Narratives: http://localhost:${PORT}/api/narratives`);
    console.log(`   Ideas: http://localhost:${PORT}/api/ideas`);
    console.log(`   Signals: http://localhost:${PORT}/api/signals`);
    console.log(`\n   Trigger analysis: POST http://localhost:${PORT}/api/analyze\n`);

    // Try load from DB first
    const loaded = await loadFromDatabase();
    if (!loaded) {
        console.log('🔄 No existing data found. Running initial analysis...\n');
        runAnalysis();
    } else {
        console.log('💾 Loaded past analysis data from database. Ready to serve.');
    }
});
