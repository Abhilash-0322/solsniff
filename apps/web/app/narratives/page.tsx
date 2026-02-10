'use client';

import { useEffect, useState } from 'react';
import type { NarrativeListItem } from '../lib/api';
import { Flame, Globe, Sparkles, Rocket, ShieldCheck, Search, Lightbulb, Radio, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function NarrativesPage() {
    const [narratives, setNarratives] = useState<NarrativeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetch(`${API_URL}/api/narratives`)
            .then(r => r.json())
            .then(data => setNarratives(data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filteredNarratives = filter === 'all'
        ? narratives
        : narratives.filter(n => n.status === filter);

    const TrendIcon = ({ dir }: { dir: string }) => {
        switch (dir) {
            case 'up': return <ArrowUp size={14} />;
            case 'down': return <ArrowDown size={14} />;
            default: return <ArrowRight size={14} />;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading narratives...</div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-header">
                <div>
                    <h1 className="section-title" style={{ fontSize: '2rem' }}>
                        <Flame className="text-sol-orange" size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'text-bottom' }} />
                        Detected Narratives
                    </h1>
                    <p className="section-subtitle">
                        All emerging narratives detected across {narratives.length > 0 ? narratives[0].fortnightPeriod : 'the current'} fortnight
                    </p>
                </div>
            </div>

            <div className="filter-bar">
                {['all', 'emerging', 'accelerating', 'established'].map(f => (
                    <button
                        key={f}
                        className={`filter-chip ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? <><Globe size={14} /> All</> :
                            f === 'emerging' ? <><Sparkles size={14} /> Emerging</> :
                                f === 'accelerating' ? <><Rocket size={14} /> Accelerating</> :
                                    <><ShieldCheck size={14} /> Established</>}
                    </button>
                ))}
            </div>

            {filteredNarratives.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Search size={48} className="text-muted" /></div>
                    <h3 className="empty-state-title">No narratives found</h3>
                    <p className="empty-state-text">Run an analysis from the dashboard to detect narratives.</p>
                </div>
            ) : (
                <div className="narratives-grid">
                    {filteredNarratives.map((n, i) => (
                        <a key={n.id} href={`/narratives/${n.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className={`glass-card narrative-card animate-fade-in-delay-${Math.min(i % 3 + 1, 3)}`}>
                                <div className="narrative-card-header">
                                    <h3 className="narrative-card-title">{n.title}</h3>
                                    <span className={`narrative-status-badge status-${n.status}`}>{n.status}</span>
                                </div>
                                <p className="narrative-card-description">{n.description}</p>
                                <div className="tags">
                                    {(n.tags || []).slice(0, 5).map(tag => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                </div>
                                <div className="narrative-card-meta">
                                    <div className="narrative-score">
                                        <span className="confidence-label">{n.confidenceScore}%</span>
                                        <div className="score-bar">
                                            <div className="score-bar-fill" style={{ width: `${n.confidenceScore}%` }}></div>
                                        </div>
                                    </div>
                                    <span className={`narrative-meta-item trend-${n.trendDirection}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <TrendIcon dir={n.trendDirection} /> {n.trendDirection}
                                    </span>
                                    <span className="narrative-meta-item" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Lightbulb size={14} /> {n.ideaCount} ideas</span>
                                    <span className="narrative-meta-item" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Radio size={14} /> {n.signalCount} signals</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
