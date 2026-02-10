'use client';

import { useEffect, useState } from 'react';
import type { IdeaItem } from '../lib/api';
import { Globe, Coins, Palette, Wrench, MessageCircle, Gamepad2, CreditCard, Landmark, Bot, Box, Lightbulb, Target, Users, Cpu, AlertTriangle, Activity } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const CATEGORIES = ['all', 'defi', 'nft', 'infrastructure', 'tooling', 'social', 'gaming', 'payments', 'dao', 'ai', 'other'];

const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
        case 'all': return <Globe size={16} />;
        case 'defi': return <Coins size={16} />;
        case 'nft': return <Palette size={16} />;
        case 'infrastructure': return <Landmark size={16} />;
        case 'tooling': return <Wrench size={16} />;
        case 'social': return <MessageCircle size={16} />;
        case 'gaming': return <Gamepad2 size={16} />;
        case 'payments': return <CreditCard size={16} />;
        case 'dao': return <Users size={16} />;
        case 'ai': return <Bot size={16} />;
        default: return <Box size={16} />;
    }
};

export default function IdeasPage() {
    const [ideas, setIdeas] = useState<IdeaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/api/ideas`)
            .then(r => r.json())
            .then(data => setIdeas(data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filteredIdeas = filter === 'all'
        ? ideas
        : ideas.filter(i => i.category === filter);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading build ideas...</div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-header">
                <div>
                    <h1 className="section-title" style={{ fontSize: '2rem' }}>
                        <Lightbulb className="text-sol-yellow" size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'text-bottom' }} /> Build Ideas
                    </h1>
                    <p className="section-subtitle">
                        {ideas.length} actionable product concepts generated from detected narratives
                    </p>
                </div>
            </div>

            <div className="filter-bar">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`filter-chip ${filter === cat ? 'active' : ''}`}
                        onClick={() => setFilter(cat)}
                    >
                        <CategoryIcon category={cat} /> {cat}
                    </button>
                ))}
            </div>

            {filteredIdeas.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Lightbulb size={48} className="text-muted" /></div>
                    <h3 className="empty-state-title">No ideas in this category</h3>
                    <p className="empty-state-text">Try selecting a different category or run a new analysis.</p>
                </div>
            ) : (
                <div className="ideas-grid">
                    {filteredIdeas.map((idea) => (
                        <div
                            key={idea.id}
                            className="glass-card idea-card"
                            onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="idea-card-category">
                                <CategoryIcon category={idea.category} /> {idea.category}
                            </div>
                            <h3 className="idea-card-title">{idea.title}</h3>
                            <p className="idea-card-description">{idea.description}</p>

                            {expandedId === idea.id && (
                                <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
                                    <div style={{ marginBottom: 'var(--space-md)' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sol-purple)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Target size={14} /> Problem</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{idea.problem}</div>
                                    </div>
                                    <div style={{ marginBottom: 'var(--space-md)' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sol-green)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Lightbulb size={14} /> Solution</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{idea.solution}</div>
                                    </div>
                                    <div style={{ marginBottom: 'var(--space-md)' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sol-blue)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> Target Audience</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{idea.targetAudience}</div>
                                    </div>
                                    {idea.technicalRequirements && idea.technicalRequirements.length > 0 && (
                                        <div style={{ marginBottom: 'var(--space-md)' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Cpu size={14} /> Tech Stack</div>
                                            <div className="tags">
                                                {idea.technicalRequirements.map((req, i) => (
                                                    <span key={i} className="tag">{req}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {idea.potentialChallenges && idea.potentialChallenges.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sol-pink)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={14} /> Challenges</div>
                                            <div className="tags">
                                                {idea.potentialChallenges.map((ch, i) => (
                                                    <span key={i} className="tag" style={{ borderColor: 'rgba(255,107,157,0.2)', background: 'rgba(255,107,157,0.08)' }}>{ch}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="idea-card-footer">
                                <span className={`feasibility-badge feasibility-${idea.feasibility}`}>
                                    {idea.feasibility} feasibility
                                </span>
                                {idea.narrativeTitle && (
                                    <a
                                        href={`/narratives/${idea.narrativeSlug}`}
                                        className="idea-narrative-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Activity size={12} style={{ marginRight: 4 }} /> {idea.narrativeTitle}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
