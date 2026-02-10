import { BaseCollector, type CollectorResult } from './base-collector.js';
import type { SignalSource } from '@solsniff/shared-types';

interface RSSItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    source: string;
}

const NEWS_SOURCES = [
    {
        name: 'CoinDesk',
        url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
        searchTerms: ['solana', 'SOL', 'phantom', 'jupiter', 'jito'],
    },
    {
        name: 'The Block',
        url: 'https://www.theblock.co/rss.xml',
        searchTerms: ['solana', 'SOL'],
    },
    {
        name: 'Decrypt',
        url: 'https://decrypt.co/feed',
        searchTerms: ['solana', 'SOL', 'phantom'],
    },
];

export class NewsCollector extends BaseCollector {
    source: SignalSource = 'news';
    name = 'News & Research Collector';

    async collect(): Promise<CollectorResult> {
        const signals: CollectorResult['signals'] = [];
        const rawData: Record<string, any> = {};

        try {
            // 1. Crypto news aggregation
            const newsData = await this.collectCryptoNews();
            signals.push(...newsData.signals);
            rawData.news = newsData.raw;

            // 2. Ecosystem announcements and updates
            const ecosystemData = await this.collectEcosystemUpdates();
            signals.push(...ecosystemData.signals);
            rawData.ecosystem = ecosystemData.raw;

        } catch (error) {
            console.error('News collection error:', error);
        }

        return { signals, rawData };
    }

    private async collectCryptoNews() {
        const signals: CollectorResult['signals'] = [];
        const raw: RSSItem[] = [];

        try {
            // Use CryptoPanic (free tier - aggregates multiple news sources)
            const res = await this.fetchWithRetry(
                'https://cryptopanic.com/api/free/v1/posts/?auth_token=free&currencies=SOL&kind=news&filter=hot'
            );

            if (res.ok) {
                const data = await res.json() as any;
                const posts = data.results || [];

                for (const post of posts.slice(0, 15)) {
                    raw.push({
                        title: post.title,
                        link: post.url,
                        description: post.title,
                        pubDate: post.published_at,
                        source: post.source?.title || 'Unknown',
                    });

                    const score = this.calculateNewsScore(post);
                    if (score > 30) {
                        signals.push(this.createSignal(
                            post.title.substring(0, 100),
                            `Source: ${post.source?.title || 'Unknown'}. ${post.votes ? `Votes: 👍${post.votes.positive || 0} 👎${post.votes.negative || 0}` : ''}`,
                            score,
                            {
                                source: post.source?.title,
                                votes: post.votes,
                                publishedAt: post.published_at,
                                kind: post.kind,
                            },
                            post.url
                        ));
                    }
                }
            }
        } catch (error) {
            console.error('Crypto news error:', error);
            // Fallback: generate general market awareness signal
            signals.push(this.createSignal(
                'Solana Ecosystem News Monitoring',
                'Monitoring crypto news sources for Solana-related developments and narratives.',
                30,
                { status: 'active', sources: NEWS_SOURCES.map(s => s.name) }
            ));
        }

        return { signals, raw };
    }

    private async collectEcosystemUpdates() {
        const signals: CollectorResult['signals'] = [];
        const raw: any[] = [];

        try {
            // Solana ecosystem specific feeds
            // Solana Beach API (public data)
            const validatorRes = await this.fetchWithRetry(
                'https://api.coingecko.com/api/v3/coins/solana?localization=false&tickers=false&community_data=true&developer_data=true'
            );

            if (validatorRes.ok) {
                const data = await validatorRes.json() as any;
                raw.push({ source: 'coingecko_detail', data });

                // Community data signals
                if (data.community_data) {
                    const cd = data.community_data;
                    signals.push(this.createSignal(
                        'Solana Community Growth Metrics',
                        `Twitter followers: ${(cd.twitter_followers || 0).toLocaleString()}, Reddit subscribers: ${(cd.reddit_subscribers || 0).toLocaleString()}, Reddit active: ${(cd.reddit_accounts_active_48h || 0).toLocaleString()}.`,
                        50,
                        {
                            twitterFollowers: cd.twitter_followers,
                            redditSubscribers: cd.reddit_subscribers,
                            redditActive48h: cd.reddit_accounts_active_48h,
                        }
                    ));
                }

                // Developer data signals
                if (data.developer_data) {
                    const dd = data.developer_data;
                    signals.push(this.createSignal(
                        'Solana Core Developer Activity',
                        `GitHub stars: ${(dd.stars || 0).toLocaleString()}, Forks: ${(dd.forks || 0).toLocaleString()}, Subscribers: ${(dd.subscribers || 0).toLocaleString()}. Code additions (4w): ${dd.code_additions_deletions_4_weeks?.additions?.toLocaleString() || 'N/A'}.`,
                        55,
                        {
                            stars: dd.stars,
                            forks: dd.forks,
                            subscribers: dd.subscribers,
                            codeChanges4w: dd.code_additions_deletions_4_weeks,
                            commitCount4w: dd.commit_count_4_weeks,
                        },
                        'https://github.com/solana-labs/solana'
                    ));
                }

                // Market sentiment from CoinGecko
                if (data.sentiment_votes_up_percentage) {
                    signals.push(this.createSignal(
                        'SOL Community Sentiment',
                        `Bullish: ${data.sentiment_votes_up_percentage?.toFixed(1)}%, Bearish: ${data.sentiment_votes_down_percentage?.toFixed(1)}%.`,
                        data.sentiment_votes_up_percentage > 70 ? 65 : 45,
                        {
                            bullish: data.sentiment_votes_up_percentage,
                            bearish: data.sentiment_votes_down_percentage,
                        }
                    ));
                }
            }
        } catch (error) {
            console.error('Ecosystem updates error:', error);
        }

        return { signals, raw };
    }

    private calculateNewsScore(post: any): number {
        let score = 30; // base score

        // Boost for votes
        if (post.votes) {
            score += (post.votes.positive || 0) * 3;
            score -= (post.votes.negative || 0) * 2;
        }

        // Boost for recency (last 24h)
        if (post.published_at) {
            const hoursAgo = (Date.now() - new Date(post.published_at).getTime()) / (1000 * 60 * 60);
            if (hoursAgo < 6) score += 20;
            else if (hoursAgo < 24) score += 10;
        }

        // Boost for important sources
        const importantSources = ['coindesk', 'theblock', 'decrypt', 'cointelegraph'];
        if (post.source?.title && importantSources.some(s => post.source.title.toLowerCase().includes(s))) {
            score += 10;
        }

        return Math.min(95, Math.max(0, score));
    }
}
