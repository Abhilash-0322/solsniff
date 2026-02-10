const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }

        return await res.json() as T;
    } catch (error) {
        console.error(`API fetch error for ${endpoint}:`, error);
        throw error;
    }
}

export interface APIResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
}

export interface NarrativeListItem {
    id: string;
    title: string;
    slug: string;
    description: string;
    explanation: string;
    status: string;
    confidenceScore: number;
    trendDirection: string;
    tags: string[];
    signalCount: number;
    ideaCount: number;
    detectedAt: string;
    fortnightPeriod: string;
}

export interface NarrativeDetail {
    id: string;
    title: string;
    slug: string;
    description: string;
    explanation: string;
    status: string;
    confidenceScore: number;
    trendDirection: string;
    tags: string[];
    signals: SignalItem[];
    ideas: IdeaItem[];
    detectedAt: string;
    fortnightPeriod: string;
}

export interface IdeaItem {
    id: string;
    title: string;
    slug: string;
    description: string;
    problem: string;
    solution: string;
    targetAudience: string;
    feasibility: string;
    category: string;
    technicalRequirements: string[];
    potentialChallenges: string[];
    score: number;
    narrativeId: string;
    narrativeTitle?: string;
    narrativeSlug?: string;
}

export interface SignalItem {
    source: string;
    title: string;
    description: string;
    url?: string;
    strength: string;
    score: number;
    metadata: Record<string, any>;
    detectedAt: string;
}

export interface AnalysisStatus {
    isAnalyzing: boolean;
    lastAnalyzedAt: string | null;
    metadata: {
        signalCount: number;
        narrativeCount: number;
        ideaCount: number;
        duration: number;
    } | null;
}
