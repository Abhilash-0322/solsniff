// ===== Signal Types =====
export type SignalSource = 'onchain' | 'github' | 'social' | 'news' | 'report';
export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'very_strong';

export interface Signal {
    id: string;
    source: SignalSource;
    title: string;
    description: string;
    url?: string;
    strength: SignalStrength;
    score: number; // 0-100
    metadata: Record<string, any>;
    detectedAt: Date;
    createdAt: Date;
}

// ===== Narrative Types =====
export type NarrativeStatus = 'emerging' | 'accelerating' | 'established' | 'fading';

export interface Narrative {
    id: string;
    title: string;
    slug: string;
    description: string;
    explanation: string; // Detailed explanation of the narrative
    status: NarrativeStatus;
    confidenceScore: number; // 0-100
    trendDirection: 'up' | 'down' | 'stable';
    signals: Signal[];
    ideas: BuildIdea[];
    tags: string[];
    detectedAt: Date;
    updatedAt: Date;
    fortnightPeriod: string; // e.g., "2026-02-01_2026-02-14"
}

// ===== Build Idea Types =====
export type FeasibilityLevel = 'low' | 'medium' | 'high';
export type IdeaCategory = 'defi' | 'nft' | 'infrastructure' | 'tooling' | 'social' | 'gaming' | 'payments' | 'dao' | 'ai' | 'other';

export interface BuildIdea {
    id: string;
    title: string;
    slug: string;
    description: string;
    problem: string;
    solution: string;
    targetAudience: string;
    feasibility: FeasibilityLevel;
    category: IdeaCategory;
    technicalRequirements: string[];
    potentialChallenges: string[];
    narrativeId: string;
    score: number; // 0-100
    createdAt: Date;
}

// ===== Analysis Report =====
export interface AnalysisReport {
    id: string;
    period: string;
    startDate: Date;
    endDate: Date;
    narratives: Narrative[];
    topIdeas: BuildIdea[];
    signalSummary: {
        totalSignals: number;
        bySource: Record<SignalSource, number>;
        avgStrength: number;
    };
    generatedAt: Date;
}

// ===== Data Source Types =====
export interface OnchainMetrics {
    newPrograms: number;
    activeWallets: number;
    transactionVolume: number;
    tvlChange: number;
    topProtocols: { name: string; tvl: number; change: number }[];
    timestamp: Date;
}

export interface GithubMetrics {
    trendingRepos: {
        name: string;
        fullName: string;
        description: string;
        stars: number;
        forks: number;
        recentCommits: number;
        language: string;
        url: string;
    }[];
    totalDevs: number;
    newRepos: number;
    timestamp: Date;
}

export interface SocialMetrics {
    trendingTopics: {
        topic: string;
        volume: number;
        sentiment: number; // -1 to 1
        change24h: number;
    }[];
    influencerMentions: {
        author: string;
        content: string;
        engagement: number;
        url: string;
    }[];
    overallSentiment: number;
    timestamp: Date;
}

// ===== LLM Provider Types =====
export type LLMProviderType = 'groq' | 'openai' | 'anthropic';

export interface LLMConfig {
    provider: LLMProviderType;
    model: string;
    temperature: number;
    maxTokens: number;
    apiKey: string;
}

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

// ===== API Response Types =====
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number;
    page: number;
    pageSize: number;
}
