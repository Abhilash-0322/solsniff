'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { NarrativeDetail } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function NarrativeDetailPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [narrative, setNarrative] = useState<NarrativeDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        fetch(`${API_URL}/api/narratives/${slug}`)
            .then(r => r.json())
            .then(data => setNarrative(data.data || null))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [slug]);

    const trendIcon = (dir: string) => dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→';

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading narrative details...</div>
            </div>
        );
    }

    if (!narrative) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3 className="empty-state-title">Narrative not found</h3>
                <p className="empty-state-text">
                    This narrative may not exist yet. <a href="/narratives">Browse all narratives</a>.
                </p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Back link */}
            <a href="/narratives" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-lg)', display: 'inline-block' }}>
                ← Back to Narratives
            </a>

            {/* Header */}
            <div className="narrative-detail-header animate-fade-in">
                <h1 className="narrative-detail-title">{narrative.title}</h1>
                <div className="narrative-detail-meta">
                    <span className={`narrative-status-badge status-${narrative.status}`}>{narrative.status}</span>
                    <div className="confidence-meter">
                        <span className="confidence-label">Confidence: {narrative.confidenceScore}%</span>
                        <div className={`confidence-bar ${narrative.confidenceScore >= 70 ? 'confidence-high' : narrative.confidenceScore >= 40 ? 'confidence-medium' : 'confidence-low'}`}>
                            <div className="confidence-fill" style={{ width: `${narrative.confidenceScore}%` }}></div>
                        </div>
                    </div>
                    <span className={`trend-${narrative.trendDirection}`} style={{ fontWeight: 600 }}>
                        {trendIcon(narrative.trendDirection)} Trend: {narrative.trendDirection}
                    </span>
                </div>
                <div className="tags" style={{ marginBottom: 'var(--space-lg)' }}>
                    {(narrative.tags || []).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                    ))}
                </div>
            </div>

            {/* Explanation */}
            <div className="glass-card animate-fade-in-delay-1" style={{ marginBottom: 'var(--space-2xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1.2rem', fontWeight: 700 }}>📖 Analysis</h3>
                <div className="narrative-explanation" style={{ whiteSpace: 'pre-wrap' }}>
                    {narrative.explanation}
                </div>
            </div>

            {/* Build Ideas */}
            {narrative.ideas && narrative.ideas.length > 0 && (
                <section className="detail-section animate-fade-in-delay-2">
                    <h2 className="detail-section-title">💡 Build Ideas ({narrative.ideas.length})</h2>
                    <div className="ideas-grid">
                        {narrative.ideas.map((idea) => (
                            <div key={idea.id} className="glass-card idea-card">
                                <div className="idea-card-category">{idea.category}</div>
                                <h3 className="idea-card-title">{idea.title}</h3>
                                <p className="idea-card-description">{idea.description}</p>

                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--sol-purple)' }}>Problem</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{idea.problem}</div>
                                </div>

                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--sol-green)' }}>Solution</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{idea.solution}</div>
                                </div>

                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--sol-blue)' }}>Target Audience</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{idea.targetAudience}</div>
                                </div>

                                {idea.technicalRequirements && idea.technicalRequirements.length > 0 && (
                                    <div style={{ marginBottom: 'var(--space-md)' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-muted)' }}>Tech Requirements</div>
                                        <div className="tags">
                                            {idea.technicalRequirements.map((req, i) => (
                                                <span key={i} className="tag">{req}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="idea-card-footer">
                                    <span className={`feasibility-badge feasibility-${idea.feasibility}`}>
                                        {idea.feasibility} feasibility
                                    </span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: idea.score >= 70 ? 'var(--sol-green)' : 'var(--text-secondary)' }}>
                                        Score: {idea.score}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Related Signals */}
            {narrative.signals && narrative.signals.length > 0 && (
                <section className="detail-section animate-fade-in-delay-3">
                    <h2 className="detail-section-title">📡 Supporting Signals ({narrative.signals.length})</h2>
                    <div className="signals-feed">
                        {narrative.signals.map((signal, i) => (
                            <div key={i} className="signal-item">
                                <span className={`signal-source-badge source-${signal.source}`}>{signal.source}</span>
                                <div className="signal-content">
                                    <div className="signal-title">
                                        {signal.url ? (
                                            <a href={signal.url} target="_blank" rel="noopener noreferrer">{signal.title}</a>
                                        ) : signal.title}
                                    </div>
                                    <div className="signal-description">{signal.description}</div>
                                </div>
                                <div className="signal-score" style={{ color: signal.score >= 60 ? 'var(--sol-green)' : signal.score >= 40 ? 'var(--sol-orange)' : 'var(--text-muted)' }}>
                                    {signal.score}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
