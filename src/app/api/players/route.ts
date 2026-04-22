import { NextRequest, NextResponse } from 'next/server';
import { getUserData, getAttackHistory, getPlayerData } from '@/lib/torn';
import { estimateWinProbability, calculateRiskScore, estimateReward } from '@/lib/analytics';
import type { TornUser } from '@/types/torn';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const minLevel = parseInt(searchParams.get('minLevel') ?? '1');
  const maxLevel = parseInt(searchParams.get('maxLevel') ?? '100');
  const minWin = parseFloat(searchParams.get('minWin') ?? '0.4');
  const maxRisk = parseFloat(searchParams.get('maxRisk') ?? '0.8');

  try {
    // Get the authenticated user's stats for comparison
    const userData = await getUserData(apiKey);
    const myLevel = userData.level ?? 1;
    const myTotalStats = userData.personalstats?.totalstats ?? 0;
    const myAttacksWon = userData.personalstats?.attackswon ?? 0;
    const myAttacksLost = userData.personalstats?.attackslost ?? 0;

    // Estimate user's battle stats from win rate and level
    // Torn doesn't expose exact stats publicly, so we estimate
    const winRate = myAttacksWon / Math.max(1, myAttacksWon + myAttacksLost);
    const estimatedMyStats = myTotalStats > 0 ? myTotalStats : myLevel * 500_000 * (1 + winRate);

    // Fetch real attack history to find actual players
    const attackHistory = await getAttackHistory(apiKey);
    const attacks = Object.values(attackHistory);

    if (attacks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No attack history found. You need to have attacked or been attacked by players for the Attack Finder to suggest targets. Your attack history will populate over time.',
        noHistory: true,
      });
    }

    // Extract unique player IDs from attack history (both attackers and defenders)
    const myTornId = userData.player_id;
    const seenIds = new Set<number>();
    const candidateIds: number[] = [];

    for (const attack of attacks) {
      // Get the opponent (not us)
      const opponentId = attack.attacker_id === myTornId
        ? attack.defender_id
        : attack.attacker_id;

      if (opponentId && opponentId !== myTornId && !seenIds.has(opponentId)) {
        seenIds.add(opponentId);
        candidateIds.push(opponentId);
      }
      if (candidateIds.length >= 20) break; // Cap at 20 lookups
    }

    // Fetch profiles for each candidate (in parallel, max 10 at a time)
    const batchSize = 10;
    const profiles: Partial<TornUser>[] = [];

    for (let i = 0; i < candidateIds.length; i += batchSize) {
      const batch = candidateIds.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((id) => getPlayerData(apiKey, id))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') profiles.push(r.value);
      }
    }

    // Score and filter candidates
    const targets = profiles
      .filter((p) => {
        const lvl = p.level ?? 0;
        return lvl >= minLevel && lvl <= maxLevel;
      })
      .map((p) => {
        // Estimate target stats from their level (Torn doesn't expose them publicly)
        const targetLevel = p.level ?? 1;
        // Use their personal stats if available, otherwise estimate from level
        const targetStats = (p.personalstats?.totalstats ?? 0) > 0
          ? (p.personalstats?.totalstats ?? 0)
          : targetLevel * 400_000;

        const winProb = estimateWinProbability(estimatedMyStats, targetStats);
        const status = p.status?.state ?? 'Okay';
        const riskScore = calculateRiskScore(winProb, status);
        const reward = estimateReward(targetLevel, targetStats * 10);

        // Build reason list
        const reasons: string[] = [];
        if (status === 'Hospital') reasons.push('Currently hospitalized — cannot retaliate');
        if (status === 'Jail') reasons.push('Currently jailed');
        if (winProb >= 0.8) reasons.push(`~${Math.round(winProb * 100)}% estimated win chance`);
        if (riskScore < 0.3) reasons.push('Low retaliation risk');
        if (p.last_action?.status === 'Offline') reasons.push('Currently offline');

        // Get last action from attack history for this player
        const relevantAttack = attacks.find(
          (a) => a.attacker_id === p.player_id || a.defender_id === p.player_id
        );

        return {
          tornId: String(p.player_id),
          name: p.name ?? 'Unknown',
          level: targetLevel,
          status: status === 'Okay' ? (p.last_action?.status?.toLowerCase() ?? 'offline') : status,
          lastAction: p.last_action?.relative ?? (relevantAttack ? 'Recent attack' : 'Unknown'),
          estimatedStats: targetStats,
          winProbability: winProb,
          riskScore,
          rewardEstimate: reward,
          faction: p.faction?.faction_name ?? undefined,
          reasons,
        };
      })
      .filter((t) => t.winProbability >= minWin && t.riskScore <= maxRisk)
      .sort((a, b) => b.winProbability - a.winProbability);

    return NextResponse.json({
      success: true,
      data: targets,
      totalScanned: profiles.length,
      fromAttackHistory: true,
    });
  } catch (err) {
    console.error('Players API error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
