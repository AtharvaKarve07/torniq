import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ITEMS = [
  { id: 206, name: 'Xanax', basePrice: 750_000 },
  { id: 367, name: 'Erinium Ore', basePrice: 4_500 },
  { id: 258, name: 'Small First Aid Kit', basePrice: 1_200 },
  { id: 680, name: 'Morphine', basePrice: 85_000 },
  { id: 77, name: 'Kevlar Vest', basePrice: 220_000 },
  { id: 59, name: 'Blood Bag', basePrice: 15_000 },
  { id: 142, name: 'Lock Pick', basePrice: 3_200 },
];

const PLAYERS = [
  { tornId: '100001', name: 'Streetrat42', level: 22, status: 'offline', totalStats: 800_000 },
  { tornId: '100002', name: 'QuietMouse', level: 28, status: 'online', totalStats: 1_200_000 },
  { tornId: '100003', name: 'BlindFury', level: 35, status: 'Hospital', totalStats: 500_000 },
  { tornId: '100004', name: 'Wanderer99', level: 31, status: 'idle', totalStats: 2_000_000 },
  { tornId: '100005', name: 'GhostWalker', level: 40, status: 'offline', totalStats: 3_500_000 },
];

function randomWalk(base: number, days: number): number[] {
  const prices = [base];
  for (let i = 1; i < days; i++) {
    const change = (Math.random() - 0.48) * 0.06;
    const rev = (base - prices[i - 1]) * 0.02;
    prices.push(Math.max(1, Math.round(prices[i - 1] * (1 + change) + rev)));
  }
  return prices;
}

async function main() {
  console.log('Seeding...');
  await prisma.itemPriceHistory.deleteMany();
  await prisma.tradeOpportunity.deleteMany();
  await prisma.cachedPlayerData.deleteMany();

  const now = new Date();
  const priceRecords = [];
  for (const item of ITEMS) {
    const prices = randomWalk(item.basePrice, 30);
    for (let d = 29; d >= 0; d--) {
      const at = new Date(now.getTime() - d * 86400000);
      priceRecords.push({ itemId: item.id, itemName: item.name, price: BigInt(prices[29 - d]), recordedAt: at });
    }
  }
  for (let i = 0; i < priceRecords.length; i += 100) {
    await prisma.itemPriceHistory.createMany({ data: priceRecords.slice(i, i + 100) });
  }

  for (const p of PLAYERS) {
    const winProb = 1 / (1 + Math.exp(-4 * (1_500_000 / p.totalStats - 1)));
    await prisma.cachedPlayerData.upsert({
      where: { tornId: p.tornId },
      create: {
        tornId: p.tornId, name: p.name, level: p.level, status: p.status,
        lastAction: p.status === 'online' ? '3 minutes ago' : '8 hours ago',
        totalStats: BigInt(p.totalStats), winProbability: winProb,
        riskScore: Math.max(0, Math.min(1, 1 - winProb + Math.random() * 0.2)),
        rewardEstimate: BigInt(Math.round(p.level * 400_000 * Math.random())),
      },
      update: {},
    });
  }

  const sellers = ['DealMaker', 'QuickSell99', 'BazaarKing'];
  for (const item of ITEMS) {
    const discount = 0.60 + Math.random() * 0.30;
    const listed = Math.round(item.basePrice * discount);
    const profit = item.basePrice - listed;
    const pct = (profit / listed) * 100;
    if (pct < 10) continue;
    await prisma.tradeOpportunity.create({
      data: {
        itemId: item.id, itemName: item.name,
        listedPrice: BigInt(listed), marketAvgPrice: BigInt(item.basePrice),
        profitAmount: BigInt(profit), profitPercent: pct,
        sellerName: sellers[Math.floor(Math.random() * sellers.length)],
        sellerId: String(200000 + Math.floor(Math.random() * 100000)),
        status: 'active',
      },
    });
  }
  console.log('Seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
