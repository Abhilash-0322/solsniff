'use client';

import { useEffect, useState } from 'react';
import type { SignalItem } from '../lib/api';
import { Radio, Globe, Link as LinkIcon, Github, MessageSquare, Newspaper, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SOURCES = ['all', 'onchain', 'github', 'social', 'news'];

const SourceIcon = ({ source }: { source: string }) => {
    switch (source) {
        case 'all': return <Globe size={16} />;
        case 'onchain': return <LinkIcon size={16} />;
        case 'github': return <Github size={16} />;
        case 'social': return <MessageSquare size={16} />;
        case 'news': return <Newspaper size={16} />;
        default: return <Radio size={16} />;
    }
};

export default function SignalsPage() {
    const [signals, setSignals] = useState<SignalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 25;

    useEffect(() => {
        setLoading(true);
        const src = filter === 'all' ? '' : `&source=${filter}`;
        fetch(`${API_URL}/api/signals?page=${page}&pageSize=${pageSize}${src}`)
            .then(r => r.json())
            .then(data => {
                setSignals(data.data || []);
                setTotal(data.total || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [filter, page]);

    return (
        <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-header">
                <div>
                    <h1 className="section-title" style={{ fontSize: '2rem' }}>
                        <Radio className="text-sol-blue" size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'text-bottom' }} /> Signal Feed
                    </h1>
                    <p className="section-subtitle">
                        {total} raw signals collected from across the Solana ecosystem
                    </p>
                </div>
            </div>

            <div className="filter-bar">
                {SOURCES.map(src => (
                    <button
                        key={src}
                        className={`filter-chip ${filter === src ? 'active' : ''}`}
                        onClick={() => { setFilter(src); setPage(1); }}
                    >
                        <SourceIcon source={src} /> {src}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Loading signals...</div>
                </div>
            ) : signals.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Radio size={48} className="text-muted" /></div>
                    <h3 className="empty-state-title">No signals found</h3>
                    <p className="empty-state-text">Run an analysis from the dashboard to collect signals.</p>
                </div>
            ) : (
                <>
                    <div className="signals-feed">
                        {signals.map((signal, i) => (
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
                                <div className={`signal-source-badge source-${signal.strength === 'very_strong' || signal.strength === 'strong' ? 'social' : signal.strength === 'moderate' ? 'onchain' : 'news'}`}
                                    style={{ minWidth: 55 }}>
                                    {signal.strength}
                                </div>
                                <div className="signal-score" style={{
                                    color: signal.score >= 60 ? 'var(--sol-green)' : signal.score >= 40 ? 'var(--sol-orange)' : 'var(--text-muted)'
                                }}>
                                    {signal.score}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        ><ChevronLeft size={16} /> Previous</button>
                        <span style={{ padding: '4px 12px', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                            Page {page} of {Math.ceil(total / pageSize) || 1}
                        </span>
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={page >= Math.ceil(total / pageSize)}
                            onClick={() => setPage(p => p + 1)}
                        >Next <ChevronRight size={16} /></button>
                    </div>
                </>
            )}
        </div>
    );
}
