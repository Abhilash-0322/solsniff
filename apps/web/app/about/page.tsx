export default function AboutPage() {
    return (
        <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-header">
                <div>
                    <h1 className="section-title" style={{ fontSize: '2rem' }}>🔬 About SolSniff</h1>
                    <p className="section-subtitle">
                        How we detect narratives and generate build ideas for the Solana ecosystem
                    </p>
                </div>
            </div>

            {/* Data Sources */}
            <section className="detail-section animate-fade-in">
                <h2 className="detail-section-title">📡 Data Sources</h2>
                <div className="about-grid">
                    <div className="glass-card">
                        <div className="about-card-icon">⛓️</div>
                        <h3 className="about-card-title">On-Chain Data</h3>
                        <p className="about-card-text">
                            Real-time Solana blockchain data including TPS metrics, validator network health, epoch progress, SOL supply, and DeFi TVL from Helius RPC, public Solana RPC, and DeFiLlama APIs. We track protocol-level TVL changes to detect DeFi narrative shifts.
                        </p>
                    </div>
                    <div className="glass-card">
                        <div className="about-card-icon">💻</div>
                        <h3 className="about-card-title">Developer Activity</h3>
                        <p className="about-card-text">
                            GitHub API tracking of trending Solana repositories (stars, forks, commits), core organization activity (solana-labs, coral-xyz, metaplex-foundation, jup-ag, etc.), and new project creation across Solana-related topics and frameworks.
                        </p>
                    </div>
                    <div className="glass-card">
                        <div className="about-card-icon">📱</div>
                        <h3 className="about-card-title">Social Signals</h3>
                        <p className="about-card-text">
                            Social sentiment from LunarCrush (social volume, Galaxy Score), CoinGecko (trending tokens, market data), and Reddit (r/solana, r/solanadev hot posts). We track influencer mentions, community engagement, and sentiment shifts.
                        </p>
                    </div>
                    <div className="glass-card">
                        <div className="about-card-icon">📰</div>
                        <h3 className="about-card-title">News & Research</h3>
                        <p className="about-card-text">
                            Aggregated crypto news from CryptoPanic, community growth metrics from CoinGecko (Twitter followers, Reddit activity), developer data (core repo stars, code changes), and community sentiment voting.
                        </p>
                    </div>
                </div>
            </section>

            {/* Methodology */}
            <section className="detail-section animate-fade-in-delay-1">
                <h2 className="detail-section-title">🧠 Signal Detection & Ranking</h2>
                <div className="glass-card">
                    <div className="methodology-steps">
                        <div className="method-step">
                            <h4 className="method-step-title">1. Parallel Data Collection</h4>
                            <p className="method-step-text">
                                Four specialized collectors run simultaneously, gathering signals from on-chain sources, GitHub, social platforms, and news outlets. Each collector implements retry logic and rate limiting for reliability.
                            </p>
                        </div>
                        <div className="method-step">
                            <h4 className="method-step-title">2. Signal Scoring (0-100)</h4>
                            <p className="method-step-text">
                                Each signal is scored based on source-specific metrics: on-chain signals use TPS deviation and TVL changes; GitHub uses star/fork velocity; social uses engagement and sentiment; news uses recency and source authority.
                            </p>
                        </div>
                        <div className="method-step">
                            <h4 className="method-step-title">3. AI Narrative Clustering</h4>
                            <p className="method-step-text">
                                A Groq-powered LLM (Llama 3.3 70B) analyzes the top-scored signals across all sources, identifying coherent themes and clustering them into 4-7 distinct narratives. The AI prioritizes novelty, cross-source validation, and actionability.
                            </p>
                        </div>
                        <div className="method-step">
                            <h4 className="method-step-title">4. Idea Generation</h4>
                            <p className="method-step-text">
                                For each detected narrative, the AI generates 3-5 concrete product ideas with feasibility analysis, technical requirements, target audiences, and potential challenges. Ideas are scored on viability and scored 0-100.
                            </p>
                        </div>
                        <div className="method-step">
                            <h4 className="method-step-title">5. Fortnightly Refresh</h4>
                            <p className="method-step-text">
                                The entire pipeline can be triggered manually or runs on a scheduled basis every 14 days to detect new and evolving narratives, ensuring the analysis stays current and relevant.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Architecture */}
            <section className="detail-section animate-fade-in-delay-2">
                <h2 className="detail-section-title">🏗️ Architecture</h2>
                <div className="about-grid">
                    <div className="glass-card">
                        <div className="about-card-icon">📦</div>
                        <h3 className="about-card-title">Turborepo Monorepo</h3>
                        <p className="about-card-text">
                            Production-ready monorepo with shared packages: types, config, database, data-collectors, and AI engine. Parallel builds with caching for maximum development efficiency.
                        </p>
                    </div>
                    <div className="glass-card">
                        <div className="about-card-icon">🤖</div>
                        <h3 className="about-card-title">AI Agent System</h3>
                        <p className="about-card-text">
                            Switchable LLM provider architecture (Groq/OpenAI/Anthropic). Narrative Detector and Idea Generator agents with structured JSON output parsing and automatic retry/fallback handling.
                        </p>
                    </div>
                    <div className="glass-card">
                        <div className="about-card-icon">⚡</div>
                        <h3 className="about-card-title">Real-Time Pipeline</h3>
                        <p className="about-card-text">
                            Express API server with React Server Components frontend. In-memory caching, auto-analysis on startup, and configurable refresh schedules for always-fresh data.
                        </p>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="detail-section animate-fade-in-delay-3">
                <h2 className="detail-section-title">⚙️ Tech Stack</h2>
                <div className="glass-card">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
                        {[
                            { label: 'Monorepo', value: 'Turborepo' },
                            { label: 'Frontend', value: 'Next.js 14 (App Router)' },
                            { label: 'Backend', value: 'Express.js' },
                            { label: 'AI/LLM', value: 'Groq (switchable)' },
                            { label: 'Model', value: 'Llama 3.3 70B' },
                            { label: 'Language', value: 'TypeScript' },
                            { label: 'On-Chain', value: 'Helius + Solana RPC' },
                            { label: 'DeFi Data', value: 'DeFiLlama API' },
                            { label: 'Social', value: 'LunarCrush + CoinGecko' },
                            { label: 'News', value: 'CryptoPanic' },
                            { label: 'Dev Data', value: 'GitHub API' },
                            { label: 'Styling', value: 'Vanilla CSS (Custom)' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
