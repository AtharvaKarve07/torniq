import { NextRequest, NextResponse } from 'next/server';
import { getUserData } from '@/lib/torn';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 401 });

  try {
    const user = await getUserData(apiKey);

    // Debug log to see what Torn actually returns
    console.log('Torn user data:', JSON.stringify({
      name: user.name,
      level: user.level,
      networth: user.networth,
      status: user.status,
      energy: user.energy,
      nerve: user.nerve,
      happy: user.happy,
      attacks: user.attacks,
      personalstats_sample: user.personalstats ? {
        attackswon: user.personalstats.attackswon,
        networth: user.personalstats.networth,
      } : null,
    }, null, 2));

    // Energy, nerve, happy come from profile selection
    const energyPct = user.energy?.maximum
      ? Math.round((user.energy.current / user.energy.maximum) * 100)
      : 0;
    const nervePct = user.nerve?.maximum
      ? Math.round((user.nerve.current / user.nerve.maximum) * 100)
      : 0;
    const happyPct = user.happy?.maximum
      ? Math.round((user.happy.current / user.happy.maximum) * 100)
      : 0;

    // Attacks come from personalstats
    const attacksWon = user.personalstats?.attackswon ?? user.attacks?.attackswon ?? 0;
    const attacksLost = user.personalstats?.attackslost ?? user.attacks?.attackslost ?? 0;

    // Networth from personalstats
    const networth = user.personalstats?.networth ?? user.networth ?? 0;

    const activeOpportunities = await prisma.tradeOpportunity.count({
      where: { status: 'active' },
    });

    return NextResponse.json({
      success: true,
      data: {
        playerName: user.name ?? 'Unknown',
        level: user.level ?? 0,
        networth,
        attacks: { won: attacksWon, lost: attacksLost },
        energyPercent: energyPct,
        nervePercent: nervePct,
        happyPercent: happyPct,
        status: user.status?.state ?? 'Okay',
        faction: user.faction?.faction_name ?? null,
        activeOpportunities,
        recentProfits: 0,
      },
    });
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
