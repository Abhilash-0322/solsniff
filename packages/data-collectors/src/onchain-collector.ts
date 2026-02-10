import { BaseCollector, type CollectorResult } from './base-collector.js';
import type { SignalSource } from '@solsniff/shared-types';
import { appConfig } from '@solsniff/config';

export class OnchainCollector extends BaseCollector {
    source: SignalSource = 'onchain';
    name = 'Solana Onchain Collector';

    async collect(): Promise<CollectorResult> {
        const signals: CollectorResult['signals'] = [];
        const rawData: Record<string, any> = {};

        try {
            // Collect from Helius API if key available
            if (appConfig.dataSources.heliusApiKey) {
                const heliusData = await this.collectHeliusData();
                signals.push(...heliusData.signals);
                rawData.helius = heliusData.raw;
            }

            // Collect from public Solana data endpoints
            const publicData = await this.collectPublicData();
            signals.push(...publicData.signals);
            rawData.public = publicData.raw;

            // Collect DeFi TVL data from DeFiLlama (free, no API key)
            const defiData = await this.collectDeFiLlamaData();
            signals.push(...defiData.signals);
            rawData.defillama = defiData.raw;

        } catch (error) {
            console.error('Onchain collection error:', error);
        }

        return { signals, rawData };
    }

    private async collectHeliusData() {
        const signals: CollectorResult['signals'] = [];
        const raw: Record<string, any> = {};

        try {
            const apiKey = appConfig.dataSources.heliusApiKey;

            // Get recent token creation events (new programs/tokens)
            const url = `https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`;

            // Check network stats for activity spikes
            const statsRes = await this.fetchWithRetry(
                `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'getRecentPerformanceSamples',
                        params: [10],
                    }),
                }
            );

            if (statsRes.ok) {
                const statsData = await statsRes.json() as any;
                raw.performanceSamples = statsData.result;

                if (statsData.result && statsData.result.length > 0) {
                    const samples = statsData.result;
                    const avgTps = samples.reduce((sum: number, s: any) => sum + (s.numTransactions / s.samplePeriodSecs), 0) / samples.length;

                    signals.push(this.createSignal(
                        'Solana Network TPS Activity',
                        `Current average TPS: ${Math.round(avgTps)}. Network is processing transactions at ${avgTps > 3000 ? 'high' : avgTps > 2000 ? 'moderate' : 'normal'} capacity.`,
                        avgTps > 3000 ? 75 : avgTps > 2000 ? 55 : 35,
                        { avgTps: Math.round(avgTps), samples: samples.length },
                        'https://solscan.io'
                    ));
                }
            }

            // Get epoch info
            const epochRes = await this.fetchWithRetry(
                `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'getEpochInfo',
                    }),
                }
            );

            if (epochRes.ok) {
                const epochData = await epochRes.json() as any;
                raw.epoch = epochData.result;

                if (epochData.result) {
                    const epoch = epochData.result;
                    signals.push(this.createSignal(
                        'Solana Epoch Progress',
                        `Current epoch: ${epoch.epoch}, slot height: ${epoch.absoluteSlot}. ${Math.round((epoch.slotIndex / epoch.slotsInEpoch) * 100)}% through current epoch.`,
                        40,
                        { epoch: epoch.epoch, slotHeight: epoch.absoluteSlot },
                        'https://solscan.io'
                    ));
                }
            }
        } catch (error) {
            console.error('Helius data collection error:', error);
        }

        return { signals, raw };
    }

    private async collectPublicData() {
        const signals: CollectorResult['signals'] = [];
        const raw: Record<string, any> = {};

        try {
            // Solana supply info from public RPC
            const supplyRes = await this.fetchWithRetry(
                'https://api.mainnet-beta.solana.com',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'getSupply',
                    }),
                }
            );

            if (supplyRes.ok) {
                const supplyData = await supplyRes.json() as any;
                raw.supply = supplyData.result;

                if (supplyData.result?.value) {
                    const supply = supplyData.result.value;
                    const circulatingSOL = supply.circulating / 1e9;
                    signals.push(this.createSignal(
                        'SOL Supply Metrics',
                        `Circulating supply: ${Math.round(circulatingSOL).toLocaleString()} SOL. Non-circulating: ${Math.round(supply.nonCirculating / 1e9).toLocaleString()} SOL.`,
                        35,
                        { circulatingLamports: supply.circulating, totalLamports: supply.total }
                    ));
                }
            }

            // Get vote accounts to check validator count
            const validatorRes = await this.fetchWithRetry(
                'https://api.mainnet-beta.solana.com',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'getVoteAccounts',
                    }),
                }
            );

            if (validatorRes.ok) {
                const validatorData = await validatorRes.json() as any;
                if (validatorData.result) {
                    const activeValidators = validatorData.result.current?.length || 0;
                    const delinquentValidators = validatorData.result.delinquent?.length || 0;
                    raw.validators = { active: activeValidators, delinquent: delinquentValidators };

                    signals.push(this.createSignal(
                        'Solana Validator Network Health',
                        `${activeValidators} active validators, ${delinquentValidators} delinquent. Network decentralization is ${activeValidators > 2000 ? 'strong' : 'moderate'}.`,
                        activeValidators > 2000 ? 60 : 40,
                        { activeValidators, delinquentValidators },
                        'https://www.validators.app'
                    ));
                }
            }
        } catch (error) {
            console.error('Public data collection error:', error);
        }

        return { signals, raw };
    }

    private async collectDeFiLlamaData() {
        const signals: CollectorResult['signals'] = [];
        const raw: Record<string, any> = {};

        try {
            // Get Solana TVL from DeFiLlama (free API, no key needed)
            const tvlRes = await this.fetchWithRetry('https://api.llama.fi/v2/chains');
            if (tvlRes.ok) {
                const chains = await tvlRes.json() as any[];
                const solana = chains.find((c: any) => c.name === 'Solana');
                if (solana) {
                    raw.tvl = solana;
                    signals.push(this.createSignal(
                        'Solana DeFi TVL',
                        `Current TVL: $${(solana.tvl / 1e9).toFixed(2)}B. Solana ranks among top DeFi chains by total value locked.`,
                        solana.tvl > 5e9 ? 70 : 50,
                        { tvl: solana.tvl, chainId: solana.chainId },
                        'https://defillama.com/chain/Solana'
                    ));
                }
            }

            // Get top Solana protocols
            const protocolsRes = await this.fetchWithRetry('https://api.llama.fi/protocols');
            if (protocolsRes.ok) {
                const protocols = await protocolsRes.json() as any[];
                const solanaProtocols = protocols
                    .filter((p: any) => p.chains && p.chains.includes('Solana'))
                    .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
                    .slice(0, 15);

                raw.topProtocols = solanaProtocols.map((p: any) => ({
                    name: p.name,
                    tvl: p.tvl,
                    category: p.category,
                    change_1d: p.change_1d,
                    change_7d: p.change_7d,
                }));

                // Detect protocols with significant TVL growth
                for (const protocol of solanaProtocols.slice(0, 10)) {
                    if (protocol.change_7d && protocol.change_7d > 20) {
                        signals.push(this.createSignal(
                            `${protocol.name} TVL Surge`,
                            `${protocol.name} (${protocol.category}) saw ${protocol.change_7d.toFixed(1)}% TVL increase in 7 days. Current TVL: $${(protocol.tvl / 1e6).toFixed(1)}M.`,
                            Math.min(90, 50 + protocol.change_7d),
                            { name: protocol.name, category: protocol.category, tvl: protocol.tvl, change7d: protocol.change_7d },
                            protocol.url
                        ));
                    }
                }

                // Category trends
                const categoryMap = new Map<string, number>();
                for (const p of solanaProtocols) {
                    if (p.category) {
                        categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + (p.tvl || 0));
                    }
                }
                const topCategories = Array.from(categoryMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                signals.push(this.createSignal(
                    'Solana DeFi Category Distribution',
                    `Top DeFi categories by TVL: ${topCategories.map(([cat, tvl]) => `${cat}: $${(tvl / 1e6).toFixed(0)}M`).join(', ')}`,
                    55,
                    { categories: Object.fromEntries(topCategories) }
                ));
            }
        } catch (error) {
            console.error('DeFiLlama collection error:', error);
        }

        return { signals, raw };
    }
}
