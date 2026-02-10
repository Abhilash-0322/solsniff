'use client';

import { useEffect, useState } from 'react';
import type { NarrativeListItem, IdeaItem, SignalItem, AnalysisStatus } from './lib/api';
import { Activity, Zap, Layers, Radio, ArrowUp, ArrowRight, ArrowDown, Lightbulb, Search, Flame, Loader2, Sparkles, TrendingUp } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Dashboard() {
  const [narratives, setNarratives] = useState<NarrativeListItem[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [narrativesRes, ideasRes, signalsRes, statusRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/narratives`).then(r => r.json()),
        fetch(`${API_URL}/api/ideas`).then(r => r.json()),
        fetch(`${API_URL}/api/signals?pageSize=10`).then(r => r.json()),
        fetch(`${API_URL}/api/analysis/status`).then(r => r.json()),
      ]);

      if (narrativesRes.status === 'fulfilled') setNarratives(narrativesRes.value.data || []);
      if (ideasRes.status === 'fulfilled') setIdeas(ideasRes.value.data || []);
      if (signalsRes.status === 'fulfilled') setSignals(signalsRes.value.data || []);
      if (statusRes.status === 'fulfilled') {
        setStatus(statusRes.value.data);
        setAnalyzing(statusRes.value.data?.isAnalyzing || false);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function triggerAnalysis() {
    setAnalyzing(true);
    try {
      await fetch(`${API_URL}/api/analyze`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to trigger analysis:', e);
    }
  }

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
        <div className="loading-text">Initializing SolSniff AI Agent...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title animate-fade-in">
          Detecting <span className="gradient-text">Emerging Narratives</span>
          <br /> in the Solana Ecosystem
        </h1>
        <p className="hero-subtitle animate-fade-in-delay-1">
          AI-powered signal detection across on-chain data, developer activity, social sentiment, and news — refreshed fortnightly.
        </p>
        <div className="hero-stats animate-fade-in-delay-2">
          <div className="hero-stat">
            <div className="hero-stat-value">{narratives.length}</div>
            <div className="hero-stat-label">Narratives Detected</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{ideas.length}</div>
            <div className="hero-stat-label">Build Ideas</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{signals.length}+</div>
            <div className="hero-stat-label">Signals Analyzed</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">4</div>
            <div className="hero-stat-label">Data Sources</div>
          </div>
        </div>
      </section>

      {/* Analyze Button */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }} className="animate-fade-in-delay-3">
        <button
          className={`btn btn-primary ${analyzing ? 'analyzing' : ''}`}
          onClick={triggerAnalysis}
          disabled={analyzing}
          style={{ padding: '12px 32px', fontSize: '1rem' }}
        >
          {analyzing ? (
            <>
              <Loader2 className="animate-spin" size={18} style={{ marginRight: 8 }} />
              Analyzing Solana Ecosystem...
            </>
          ) : (
            <><Zap size={16} style={{ marginRight: 8 }} /> Run Fresh Analysis</>
          )}
        </button>
        {status?.lastAnalyzedAt && (
          <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Last analyzed: {new Date(status.lastAnalyzedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Top Narratives */}
      {narratives.length > 0 && (
        <section className="animate-fade-in-delay-2" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="section-header">
            <div>
              <h2 className="section-title"><Flame className="text-sol-orange" size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Emerging Narratives</h2>
              <p className="section-subtitle">AI-detected trends shaping the Solana ecosystem right now</p>
            </div>
            <a href="/narratives" className="btn btn-ghost btn-sm">View All →</a>
          </div>
          <div className="narratives-grid">
            {narratives.slice(0, 4).map((n, i) => (
              <a key={n.id} href={`/narratives/${n.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={`glass-card narrative-card animate-fade-in-delay-${Math.min(i + 1, 3)}`}>
                  <div className="narrative-card-header">
                    <h3 className="narrative-card-title">{n.title}</h3>
                    <span className={`narrative-status-badge status-${n.status}`}>{n.status}</span>
                  </div>
                  <p className="narrative-card-description">{n.description}</p>
                  <div className="tags">
                    {(n.tags || []).slice(0, 4).map(tag => (
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
        </section>
      )}

      {/* Top Ideas */}
      {ideas.length > 0 && (
        <section className="animate-fade-in-delay-3" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="section-header">
            <div>
              <h2 className="section-title"><Lightbulb className="text-sol-yellow" size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Top Build Ideas</h2>
              <p className="section-subtitle">Actionable product concepts tied to emerging narratives</p>
            </div>
            <a href="/ideas" className="btn btn-ghost btn-sm">View All →</a>
          </div>
          <div className="ideas-grid">
            {ideas.slice(0, 6).map((idea) => (
              <div key={idea.id} className="glass-card idea-card">
                <div className="idea-card-category">{idea.category}</div>
                <h3 className="idea-card-title">{idea.title}</h3>
                <p className="idea-card-description">{idea.description}</p>
                <div className="idea-card-footer">
                  <span className={`feasibility-badge feasibility-${idea.feasibility}`}>
                    {idea.feasibility} feasibility
                  </span>
                  {idea.narrativeTitle && (
                    <span className="idea-narrative-link">
                      <Activity size={12} style={{ marginRight: 4 }} /> {idea.narrativeTitle}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Signals */}
      {signals.length > 0 && (
        <section className="animate-fade-in-delay-3">
          <div className="section-header">
            <div>
              <h2 className="section-title"><Radio className="text-sol-blue" size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Recent Signals</h2>
              <p className="section-subtitle">Raw data points from on-chain, GitHub, social, and news sources</p>
            </div>
            <a href="/signals" className="btn btn-ghost btn-sm">View All →</a>
          </div>
          <div className="signals-feed">
            {signals.slice(0, 8).map((signal, i) => (
              <div key={i} className="signal-item">
                <span className={`signal-source-badge source-${signal.source}`}>{signal.source}</span>
                <div className="signal-content">
                  <div className="signal-title">{signal.title}</div>
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

      {/* Empty State */}
      {narratives.length === 0 && !analyzing && (
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon"><Search size={48} className="text-muted" /></div>
          <h3 className="empty-state-title">No narratives detected yet</h3>
          <p className="empty-state-text">
            Click &quot;Run Fresh Analysis&quot; to scan the Solana ecosystem for emerging trends and generate build ideas.
          </p>
        </div>
      )}
    </div>
  );
}
