export type AdminHealthDetail = {
  ok: boolean;
  mongo: { configured: boolean; ok?: boolean; error?: string };
  ws: {
    connections: number;
    deliveryPending: number;
    oldestPendingRequestId: string | null;
    oldestPendingSince: string | null;
  };
  timestamp: string;
};

export type AdminStats = {
  sessions: number;
  archivedMatches: number;
  openRequests: number;
  deliveryPending: number;
  wsConnections: number;
  gatewayConnections: number;
  workersRunning: number;
  timestamp: string;
};

export type SessionSummary = {
  appId: string;
  matchKey: string;
  sessionStatus?: string;
  phase?: string;
  homeTeam?: string;
  awayTeam?: string;
  kickoffUtc?: string;
  requestCount: number;
  activeRequestCount: number;
  workerRunning: boolean;
  nextScheduledAtUtc: string | null;
  cursor: number;
  updatedAt?: string;
};

export type SessionsListResponse = {
  items: SessionSummary[];
  total?: number;
  limit?: number;
  offset?: number;
};

export type OpenRequestRow = {
  appId: string;
  matchKey: string;
  phase?: string;
  kickoffUtc?: string;
  homeTeam?: string;
  awayTeam?: string;
  requestId: string;
  settlerSessionId?: string;
  sourceMatchId?: string;
  marketType?: string;
  line?: number | null;
  outcomeKey?: string;
  registeredAt?: string;
  lastUpdateSentAt?: string | null;
  lastUpdateCursor?: number | null;
};

export type DeliveryPendingRow = {
  requestId: string;
  appId: string;
  matchKey: string;
  settlerSessionId?: string;
  sentAt: string;
  firstSentAt: string;
  retries: number;
};

export type WsConnectionRow = {
  appId?: string;
  settlerSessionId?: string;
  scrapperConnectionId?: string;
  requestIds?: string[];
};

export type FixtureListRow = {
  appId: string;
  matchKey: string;
  source: 'session' | 'archived';
  homeTeam?: string;
  awayTeam?: string;
  kickoffUtc?: string;
  tournamentName?: string;
  phase?: string;
  sessionStatus?: string;
  activeRequestCount: number;
  requestCount: number;
  cursor: number;
  workerRunning: boolean;
  fixtureStatusShort: string | null;
  goals: { home?: number; away?: number } | null;
  score?: {
    halftime?: { home?: number; away?: number };
    fulltime?: { home?: number; away?: number };
  } | null;
  eventCount: number;
  hasStatistics: boolean;
  dataStatus: string;
  dataStatusTags: string[];
  updatedAt?: string;
};

export type FixturesListResponse = {
  items: FixtureListRow[];
  total: number;
  limit: number;
  dataStatus: string | null;
  dataStatusFilters?: string[];
};

export type MatchSessionDoc = {
  appId: string;
  matchKey: string;
  fixtureBook?: {
    homeTeam?: string;
    awayTeam?: string;
    kickoffUtc?: string;
    tournamentName?: string;
  };
  lastMergedSnapshot?: Record<string, unknown>;
  facts?: Record<string, unknown>;
  requests?: unknown[];
  adminEdits?: unknown[];
  cursor?: number;
  phase?: string;
};

export type ArchivedMatchDoc = {
  appId: string;
  matchKey: string;
  fixtureBook?: MatchSessionDoc['fixtureBook'];
  facts?: Record<string, unknown>;
  adminEdits?: unknown[];
};

export type ConnectionsResponse = {
  settler: WsConnectionRow[];
  gateway: WsConnectionRow[];
  items: WsConnectionRow[];
};
