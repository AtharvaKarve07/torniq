export interface TornUser {
  player_id: number;
  name: string;
  level: number;
  gender: string;
  status: TornStatus;
  last_action: TornLastAction;
  faction: TornFaction | null;
  job: TornJob | null;
  life: TornStat;
  energy: TornStat;
  nerve: TornStat;
  happy: TornStat;
  money_onhand: number;
  networth: number;
  rank: string;
  age: number;
  attacks: TornAttackStats;
  personalstats: TornPersonalStats;
  icons: Record<string, string>;
}

export interface TornStatus {
  description: string;
  details: string;
  state: 'Okay' | 'Hospital' | 'Jail' | 'Traveling' | 'Abroad';
  color: 'green' | 'red' | 'blue' | 'gray';
  until: number;
}

export interface TornLastAction {
  status: 'Online' | 'Idle' | 'Offline';
  timestamp: number;
  relative: string;
}

export interface TornFaction {
  faction_id: number;
  faction_name: string;
  faction_tag: string;
  position: string;
  days_in_faction: number;
}

export interface TornJob {
  job: string;
  position: string;
  company_id: number;
  company_name: string;
  company_type: number;
}

export interface TornStat {
  current: number;
  maximum: number;
  increment: number;
  interval: number;
  ticktime: number;
  fulltime: number;
}

export interface TornAttackStats {
  attackswon: number;
  attackslost: number;
  attacksdraw: number;
  defendswon: number;
  defendslost: number;
  moneymugged: number;
}

// Torn personalstats — all fields available via public API
export interface TornPersonalStats {
  attackswon: number;
  attackslost: number;
  attacksdraw: number;
  bestkillstreak: number;
  currentkillstreak: number;
  defendswon: number;
  defendslost: number;
  defendsstalemated: number;
  elo: number;
  highestbeaten: number;
  moneymugged: number;
  retals: number;
  revives: number;
  revivesreceived: number;
  roundsfired: number;
  timesbeaten: number;
  unarmoredwon: number;
  // Economy
  networth: number;
  bazaarprofit: number;
  bazaarsales: number;
  bazaarcustomers: number;
  itemsbought: number;
  itemssent: number;
  // Activity
  useractivity: number;
  activestreak: number;
  bestactivestreak: number;
  // Stats (total battle stats — only available for own profile)
  totalstats: number;
  // Drugs / consumables
  drugsused: number;
  xantaken: number;
  cantaken: number;
  medicalitemsused: number;
  statenhancersused: number;
  // Travel
  timestraveled: number;
  // Other
  criminaloffenses: number;
  lotterywinnings: number;
  pointsbought: number;
  pointssold: number;
  trainsreceived: number;
}

export interface TornItem {
  name: string;
  description: string;
  type: string;
  weapon_type: string | null;
  buy_price: number;
  sell_price: number;
  market_value: number;
  circulation: number;
  image: string;
}

export interface TornBazaarListing {
  ID: number;
  name: string;
  type: string;
  uid: number;
  cost: number;
  quantity: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface MarketAnalytics {
  itemId: number;
  itemName: string;
  currentPrice: number;
  marketAvg: number;
  ma7: number;
  ma30: number;
  deviation: number;
  signal: 'buy' | 'sell' | 'hold';
  signalStrength: number;
  priceHistory: PricePoint[];
}

export interface AttackTarget {
  tornId: string;
  name: string;
  level: number;
  status: string;
  lastAction: string;
  estimatedStats: number;
  winProbability: number;
  riskScore: number;
  rewardEstimate: number;
  faction?: string;
  reasons: string[];
}

export interface TradeOpportunityDisplay {
  id: string;
  itemId: number;
  itemName: string;
  listedPrice: number;
  marketAvgPrice: number;
  profitAmount: number;
  profitPercent: number;
  sellerName?: string;
  sellerId?: string;
  status: string;
  detectedAt: string;
}

export interface DashboardStats {
  playerName: string;
  level: number;
  networth: number;
  attacks: { won: number; lost: number };
  energyPercent: number;
  nervePercent: number;
  happyPercent: number;
  status: string;
  faction?: string | null;
  activeOpportunities: number;
  recentProfits: number;
}

export interface AttackFinderFilters {
  minLevel: number;
  maxLevel: number;
  minWinProbability: number;
  maxRiskScore: number;
  excludeFaction: boolean;
  statusFilter: ('online' | 'idle' | 'offline')[];
}

export interface MarketFilters {
  minProfitPercent: number;
  itemType: string;
  sortBy: 'profit_percent' | 'profit_amount' | 'price' | 'detected_at';
  sortDir: 'asc' | 'desc';
}
