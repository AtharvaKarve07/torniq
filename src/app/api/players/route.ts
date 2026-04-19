import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserData } from '@/lib/torn';
import { estimateWinProbability, calculateRiskScore, estimateReward } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const minLevel = parseInt(searchParams.get('minLevel') ?? '1');
  const maxLevel = parseInt(searchParams.get('maxLevel') ?? '100');
  const minWin = parseFloat(searchParams.get('minWin') ?? '0.5');
  const maxRisk = parseFloat(searchParams.get('maxRisk') ?? '0.7');

  try {
    const userData = await getUserData(apiKey);
    const userTotalStats = userData.personalstats?.totalstats ?? 1_000_000;
    const candidates = await prisma.cachedPlayerData.findMany({
      where: { level: { gte: minLevel, lte: maxLevel }, winProbability: { gte: minWin }, riskScore: { lte: maxRisk } },
      orderBy: [{ winProbability: 'desc' }, { riskScore: 'asc' }],
      take: 50,
    });

    if (candidates.length === 0) {
      const demos = [
        { tornId: '100001', name: 'Streetrat42', level: 22, status: 'Hospital', stats: 600_000 },
        { tornId: '100002', name: 'QuietMouse', level: 28, status: 'idle', stats: 1_100_000 },
        { tornId: '100003', name: 'BlindFury', level: 35, status: 'Hospital', stats: 500_000 },
        { tornId: '100004', name: 'Wanderer99', level: 31, status: 'online', stats: 1_800_000 },
        { tornId: '100005', name: 'GhostWalker', level: 40, status: 'offline', stats: 3_200_000 },
        { tornId: '100006', name: 'IronCurtain', level: 18, status: 'online', stats: 380_000 },
        { tornId: '100007', name: 'ShadowFist', level: 25, status: 'Hospital', stats: 900_000 },
        { tornId: '100008', name: 'NightHawk', level: 29, status: 'idle', stats: 1_600_000 },
      ];
      return NextResponse.json({
        success: true,
        data: demos.map((d) => {
          const winProb = estimateWinProbability(userTotalStats, d.stats);
          const riskScore = calculateRiskScore(winProb, d.status);
          const reasons: string[] = [];
          if (d.status === 'Hospital') reasons.push('Currently hospitalized');
          if (winProb > 0.7) reasons.push(`${Math.round(winProb * 100)}% win chance`);
          return { tornId: d.tornId, name: d.name, level: d.level, status: d.status, lastAction: d.status === 'online' ? '3 minutes ago' : d.status === 'idle' ? '45 minutes ago' : '6 hours ago', estimatedStats: d.stats, winProbability: winProb, riskScore, rewardEstimate: estimateReward(d.level, d.stats * 10), reasons };
        }).sort((a, b) => b.winProbability - a.winProbability),
        demo: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: candidates.map((p) => {
        const targetStats = Number(p.totalStats ?? 500_000);
        const winProb = estimateWinProbability(userTotalStats, targetStats);
        const reasons: string[] = [];
        if (p.status === 'Hospital') reasons.push('Currently hospitalized');
        if (winProb > 0.7) reasons.push(`${Math.round(winProb * 100)}% win chance`);
        return { tornId: p.tornId, name: p.name, level: p.level, status: p.status, lastAction: p.lastAction ?? 'Unknown', estimatedStats: targetStats, winProbability: winProb, riskScore: Number(p.riskScore), rewardEstimate: Number(p.rewardEstimate), faction: p.faction ?? undefined, reasons };
      }),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
