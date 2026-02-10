import { BaseCollector, type CollectorResult } from './base-collector.js';
import type { SignalSource } from '@solsniff/shared-types';
import { appConfig } from '@solsniff/config';

const SOLANA_ORGS = [
    'solana-labs', 'solana-foundation', 'coral-xyz', 'metaplex-foundation',
    'jup-ag', 'orca-so', 'marinade-finance', 'helium', 'squads-protocol',
    'drift-labs', 'tensor-hq', 'magiceden-oss', 'clockwork-xyz', 'switchboard-xyz',
    'raydium-io', 'project-serum',
];

const SOLANA_TOPICS = [
    'solana', 'solana-program', 'anchor-framework', 'solana-dapp',
    'solana-nft', 'solana-defi', 'solana-mobile',
];

export class GithubCollector extends BaseCollector {
    source: SignalSource = 'github';
    name = 'GitHub Developer Activity Collector';

    private get headers(): Record<string, string> {
        const h: Record<string, string> = {
            Accept: 'application/vnd.github.v3+json',
        };
        if (appConfig.dataSources.githubToken) {
            h.Authorization = `Bearer ${appConfig.dataSources.githubToken}`;
        }
        return h;
    }

    async collect(): Promise<CollectorResult> {
        const signals: CollectorResult['signals'] = [];
        const rawData: Record<string, any> = {};

        try {
            // 1. Search trending Solana repos
            const trendingRepos = await this.getTrendingRepos();
            signals.push(...trendingRepos.signals);
            rawData.trendingRepos = trendingRepos.raw;

            // 2. Check core org activity
            const orgActivity = await this.getOrgActivity();
            signals.push(...orgActivity.signals);
            rawData.orgActivity = orgActivity.raw;

            // 3. Search for new Solana projects
            const newProjects = await this.getNewProjects();
            signals.push(...newProjects.signals);
            rawData.newProjects = newProjects.raw;

        } catch (error) {
            console.error('GitHub collection error:', error);
        }

        return { signals, rawData };
    }

    private async getTrendingRepos() {
        const signals: CollectorResult['signals'] = [];
        const raw: any[] = [];

        try {
            // Search repos with solana topic, sorted by stars, created in last 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const searchUrl = `https://api.github.com/search/repositories?q=solana+language:rust+language:typescript+created:>${thirtyDaysAgo}&sort=stars&order=desc&per_page=20`;

            const res = await this.fetchWithRetry(searchUrl, { headers: this.headers });
            if (res.ok) {
                const data = await res.json() as any;
                const repos = data.items || [];
                raw.push(...repos.map((r: any) => ({
                    name: r.full_name,
                    description: r.description,
                    stars: r.stargazers_count,
                    forks: r.forks_count,
                    language: r.language,
                    url: r.html_url,
                    created: r.created_at,
                })));

                for (const repo of repos.slice(0, 10)) {
                    const score = Math.min(90, 30 + repo.stargazers_count * 2 + repo.forks_count * 3);
                    signals.push(this.createSignal(
                        `Trending: ${repo.full_name}`,
                        `${repo.description || 'No description'}. ⭐ ${repo.stargazers_count} stars, 🔀 ${repo.forks_count} forks. Language: ${repo.language || 'Mixed'}.`,
                        score,
                        {
                            fullName: repo.full_name,
                            stars: repo.stargazers_count,
                            forks: repo.forks_count,
                            language: repo.language,
                            topics: repo.topics,
                        },
                        repo.html_url
                    ));
                }

                // Overall trend signal
                if (data.total_count) {
                    signals.push(this.createSignal(
                        'New Solana Repositories Created',
                        `${data.total_count} new Solana-related repositories created in the last 30 days, indicating ${data.total_count > 100 ? 'strong' : 'moderate'} developer interest.`,
                        data.total_count > 100 ? 70 : data.total_count > 50 ? 55 : 40,
                        { totalNewRepos: data.total_count, period: '30d' }
                    ));
                }
            }
        } catch (error) {
            console.error('Trending repos error:', error);
        }

        return { signals, raw };
    }

    private async getOrgActivity() {
        const signals: CollectorResult['signals'] = [];
        const raw: any[] = [];

        try {
            // Check recent activity from top 5 orgs
            for (const org of SOLANA_ORGS.slice(0, 6)) {
                try {
                    const res = await this.fetchWithRetry(
                        `https://api.github.com/orgs/${org}/repos?sort=pushed&direction=desc&per_page=5`,
                        { headers: this.headers }
                    );

                    if (res.ok) {
                        const repos = await res.json() as any[];
                        const activeRepos = repos.filter((r: any) => {
                            const pushed = new Date(r.pushed_at);
                            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                            return pushed > weekAgo;
                        });

                        if (activeRepos.length > 0) {
                            raw.push({
                                org,
                                activeRepos: activeRepos.map((r: any) => ({
                                    name: r.name,
                                    pushedAt: r.pushed_at,
                                    stars: r.stargazers_count,
                                })),
                            });

                            signals.push(this.createSignal(
                                `${org} Active Development`,
                                `${activeRepos.length} repos updated in the last week. Most recent: ${activeRepos[0].name} (${activeRepos[0].stargazers_count} ⭐).`,
                                45 + activeRepos.length * 5,
                                { org, activeRepoCount: activeRepos.length, repos: activeRepos.map((r: any) => r.name) },
                                `https://github.com/${org}`
                            ));
                        }
                    }

                    // Small delay to respect rate limits
                    await new Promise(r => setTimeout(r, 200));
                } catch {
                    // Skip failed orgs
                }
            }
        } catch (error) {
            console.error('Org activity error:', error);
        }

        return { signals, raw };
    }

    private async getNewProjects() {
        const signals: CollectorResult['signals'] = [];
        const raw: any[] = [];

        try {
            // Search for repos by topic
            for (const topic of SOLANA_TOPICS.slice(0, 3)) {
                const res = await this.fetchWithRetry(
                    `https://api.github.com/search/repositories?q=topic:${topic}&sort=updated&order=desc&per_page=5`,
                    { headers: this.headers }
                );

                if (res.ok) {
                    const data = await res.json() as any;
                    const repos = data.items || [];
                    raw.push(...repos.map((r: any) => ({
                        topic,
                        name: r.full_name,
                        stars: r.stargazers_count,
                        updated: r.updated_at,
                    })));
                }

                await new Promise(r => setTimeout(r, 500));
            }

            if (raw.length > 0) {
                signals.push(this.createSignal(
                    'Solana Topic Activity on GitHub',
                    `${raw.length} recently updated repos across Solana-related topics (${SOLANA_TOPICS.slice(0, 3).join(', ')}).`,
                    50,
                    { topicRepos: raw.length, topics: SOLANA_TOPICS.slice(0, 3) }
                ));
            }
        } catch (error) {
            console.error('New projects error:', error);
        }

        return { signals, raw };
    }
}
