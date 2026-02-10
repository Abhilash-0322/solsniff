import { BaseCollector, type CollectorResult } from './base-collector.js';
import type { SignalSource } from '@solsniff/shared-types';
import { appConfig } from '@solsniff/config';

const SOLANA_KOLS = [
    { handle: 'aaboronkov_sol', name: 'Akshay BD' },
    { handle: 'aaboronkov', name: 'Mert' },
    { handle: 'rajgokal', name: 'Raj Gokal' },
    { handle: 'aaboronkov', name: 'Toly' },
];

const RSS_FEEDS = [
    { name: 'Solana Blog', url: 'https://solana.com/news/rss.xml', source: 'official' },
    { name: 'Helius Blog', url: 'https://www.helius.dev/blog/rss.xml', source: 'infrastructure' },
    { name: 'Messari', url: 'https://messari.io/rss', source: 'research' },
];

export class SocialCollector extends BaseCollector {
    source: SignalSource = 'social';
    name = 'Social Signals Collector';

    async collect(): Promise<CollectorResult> {
        const signals: CollectorResult['signals'] = [];
        const rawData: Record<string, any> = {};

        try {
            // 1. LunarCrush social data
            if (appConfig.dataSources.lunarCrushApiKey) {
                const lunarData = await this.collectLunarCrush();
                signals.push(...lunarData.signals);
                rawData.lunarcrush = lunarData.raw;
            }

            // 2. CoinGecko trending (free, no API key)
            const cgData = await this.collectCoinGecko();
            signals.push(...cgData.signals);
            rawData.coingecko = cgData.raw;

            // 3. Reddit/forum signals
            const redditData = await this.collectRedditSignals();
            signals.push(...redditData.signals);
            rawData.reddit = redditData.raw;

        } catch (error) {
            console.error('Social collection error:', error);
        }

        return { signals, rawData };
    }

    private async collectLunarCrush() {
        const signals: CollectorResult['signals'] = [];
        const raw: Record<string, any> = {};

        try {
            const apiKey = appConfig.dataSources.lunarCrushApiKey;

            // Get SOL social metrics
            const res = await this.fetchWithRetry(
                `https://lunarcrush.com/api4/public/coins/sol/v1`,
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json() as any;
                raw.sol = data;

                if (data.data) {
                    const d = data.data;
                    signals.push(this.createSignal(
                        'SOL Social Sentiment',
                        `Social volume: ${d.social_volume || 'N/A'}, Sentiment: ${d.sentiment || 'N/A'}/5. Galaxy Score: ${d.galaxy_score || 'N/A'}/100.`,
                        d.galaxy_score || 50,
                        {
                            socialVolume: d.social_volume,
                            sentiment: d.sentiment,
                            galaxyScore: d.galaxy_score,
                            socialDominance: d.social_dominance,
                        },
                        'https://lunarcrush.com/coins/sol'
                    ));
                }
            }

            // Get trending Solana ecosystem tokens
            const trendingRes = await this.fetchWithRetry(
                `https://lunarcrush.com/api4/public/coins/list/v1?sort=social_volume&desc=true&limit=20`,
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                }
            );

            if (trendingRes.ok) {
                const trendingData = await trendingRes.json() as any;
                raw.trending = trendingData;
            }
        } catch (error) {
            console.error('LunarCrush error:', error);
        }

        return { signals, raw };
    }

    private async collectCoinGecko() {
        const signals: CollectorResult['signals'] = [];
        const raw: Record<string, any> = {};

        try {
            // Free CoinGecko API - Solana ecosystem trending
            const res = await this.fetchWithRetry(
                'https://api.coingecko.com/api/v3/search/trending'
            );

            if (res.ok) {
                const data = await res.json() as any;
                raw.trending = data;

                const trendingCoins = data.coins || [];
                const solanaTrending = trendingCoins.filter((c: any) => {
                    const platforms = c.item?.platforms || {};
                    return platforms['solana'] ||
                        (c.item?.name || '').toLowerCase().includes('solana') ||
                        (c.item?.id || '').includes('solana');
                });

                if (solanaTrending.length > 0) {
                    for (const coin of solanaTrending) {
                        signals.push(this.createSignal(
                            `Trending on CoinGecko: ${coin.item.name}`,
                            `${coin.item.name} (${coin.item.symbol}) is trending. Market cap rank: #${coin.item.market_cap_rank || 'N/A'}.`,
                            65,
                            {
                                name: coin.item.name,
                                symbol: coin.item.symbol,
                                marketCapRank: coin.item.market_cap_rank,
                            },
                            `https://www.coingecko.com/en/coins/${coin.item.id}`
                        ));
                    }
                }

                // General trending signal
                signals.push(this.createSignal(
                    'CoinGecko Trending Overview',
                    `${trendingCoins.length} coins currently trending. ${solanaTrending.length} are Solana ecosystem tokens.`,
                    solanaTrending.length > 2 ? 70 : 40,
                    { totalTrending: trendingCoins.length, solanaTrending: solanaTrending.length }
                ));
            }

            // Get SOL market data
            const solRes = await this.fetchWithRetry(
                'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'
            );

            if (solRes.ok) {
                const solData = await solRes.json() as any;
                raw.solPrice = solData;

                if (solData.solana) {
                    const sol = solData.solana;
                    signals.push(this.createSignal(
                        'SOL Market Overview',
                        `SOL price: $${sol.usd?.toFixed(2)}. 24h change: ${sol.usd_24h_change?.toFixed(2)}%. Market cap: $${(sol.usd_market_cap / 1e9)?.toFixed(2)}B. 24h volume: $${(sol.usd_24h_vol / 1e9)?.toFixed(2)}B.`,
                        55,
                        {
                            price: sol.usd,
                            change24h: sol.usd_24h_change,
                            marketCap: sol.usd_market_cap,
                            volume24h: sol.usd_24h_vol,
                        }
                    ));
                }
            }
        } catch (error) {
            console.error('CoinGecko error:', error);
        }

        return { signals, raw };
    }

    private async collectRedditSignals() {
        const signals: CollectorResult['signals'] = [];
        const raw: Record<string, any> = {};

        try {
            // Reddit public JSON API (no auth needed)
            const subreddits = ['solana', 'solanadev'];

            for (const sub of subreddits) {
                try {
                    const res = await this.fetchWithRetry(
                        `https://www.reddit.com/r/${sub}/hot.json?limit=10`,
                        {
                            headers: {
                                'User-Agent': 'SolSniff/1.0',
                            },
                        }
                    );

                    if (res.ok) {
                        const data = await res.json() as any;
                        const posts = data?.data?.children || [];
                        raw[sub] = posts.map((p: any) => ({
                            title: p.data.title,
                            score: p.data.score,
                            comments: p.data.num_comments,
                            url: `https://reddit.com${p.data.permalink}`,
                            created: p.data.created_utc,
                        }));

                        // Find high-engagement posts
                        for (const post of posts.slice(0, 5)) {
                            const d = post.data;
                            if (d.score > 50 || d.num_comments > 20) {
                                signals.push(this.createSignal(
                                    `r/${sub}: ${d.title.substring(0, 80)}`,
                                    `${d.score} upvotes, ${d.num_comments} comments. ${d.selftext ? d.selftext.substring(0, 120) + '...' : ''}`,
                                    Math.min(75, 30 + Math.floor(d.score / 10) + d.num_comments),
                                    {
                                        subreddit: sub,
                                        score: d.score,
                                        comments: d.num_comments,
                                        author: d.author,
                                    },
                                    `https://reddit.com${d.permalink}`
                                ));
                            }
                        }
                    }

                    await new Promise(r => setTimeout(r, 1000));
                } catch {
                    // Skip failed subreddits
                }
            }
        } catch (error) {
            console.error('Reddit error:', error);
        }

        return { signals, raw };
    }
}
