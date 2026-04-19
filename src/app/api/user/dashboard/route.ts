import { NextRequest, NextResponse } from 'next/server';
import { getUserData } from '@/lib/torn';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 401 });
  try {
    const user = await getUserData(apiKey);
    const activeOpportunities = await prisma.tradeOpportunity.count({ where: { status: 'active' } });
    return NextResponse.json({
      success: true,
      data: {
        playerName: user.name,
        level: user.level,
        networth: user.networth ?? 0,
        attacks: { won: user.attacks?.attackswon ?? 0, lost: user.attacks?.attackslost ?? 0 },
        energyPercent: user.energy ? Math.round((user.energy.current / user.energy.maximum) * 100) : 0,
        nervePercent: user.nerve ? Math.round((user.nerve.current / user.nerve.maximum) * 100) : 0,
        happyPercent: user.happy ? Math.round((user.happy.current / user.happy.maximum) * 100) : 0,
        status: user.status?.state ?? 'Okay',
        faction: user.faction?.faction_name ?? undefined,
        activeOpportunities,
        recentProfits: 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
