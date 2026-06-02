export type ScorePair = { home: number | null; away: number | null };

export type GoalEvent = {
  type: 'goal';
  team: 'home' | 'away';
  minute: number;
  addedTime?: number | null;
};

export type CardEvent = {
  type: 'card';
  team: 'home' | 'away';
  minute: number;
  cardType: 'yellow' | 'red';
};

export type FixtureEvent = GoalEvent | CardEvent;

export type FixtureStatistics = {
  homeCorners?: number | null;
  awayCorners?: number | null;
  homeYellow?: number | null;
  awayYellow?: number | null;
  homeRed?: number | null;
  awayRed?: number | null;
  homeCards?: number | null;
  awayCards?: number | null;
};

export type FixtureFactsForm = {
  fixtureStatusShort: string;
  goals: ScorePair;
  halftime: ScorePair;
  fulltime: ScorePair;
  events: FixtureEvent[];
  statistics: FixtureStatistics;
};

function numOrNull(v: string): number | null {
  const t = String(v).trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function pairFrom(obj: { home?: unknown; away?: unknown } | null | undefined): ScorePair {
  const home = obj?.home;
  const away = obj?.away;
  return {
    home: typeof home === 'number' && Number.isFinite(home) ? home : null,
    away: typeof away === 'number' && Number.isFinite(away) ? away : null,
  };
}

export function factsToForm(facts: Record<string, unknown> | null | undefined): FixtureFactsForm {
  const f = facts || {};
  const score = (f.score as Record<string, unknown>) || {};
  const stats = (f.statistics as FixtureStatistics) || {};
  const events: FixtureEvent[] = [];

  for (const raw of (f.events as unknown[]) || []) {
    if (!raw || typeof raw !== 'object') continue;
    const e = raw as Record<string, unknown>;
    if (e.type === 'card') {
      events.push({
        type: 'card',
        team: e.team === 'away' ? 'away' : 'home',
        minute: Number(e.minute) || 0,
        cardType: e.cardType === 'red' ? 'red' : 'yellow',
      });
    } else if (e.type === 'goal' || Number.isFinite(Number(e.minute))) {
      events.push({
        type: 'goal',
        team: e.team === 'away' ? 'away' : 'home',
        minute: Number(e.minute) || 0,
        addedTime: e.addedTime != null ? Number(e.addedTime) : null,
      });
    }
  }

  events.sort((a, b) => a.minute - b.minute);

  return {
    fixtureStatusShort: String(f.fixtureStatusShort || 'NS').toUpperCase(),
    goals: pairFrom(f.goals as ScorePair),
    halftime: pairFrom(score.halftime as ScorePair),
    fulltime: pairFrom(score.fulltime as ScorePair),
    events,
    statistics: {
      homeCorners: stats.homeCorners ?? null,
      awayCorners: stats.awayCorners ?? null,
      homeYellow: stats.homeYellow ?? null,
      awayYellow: stats.awayYellow ?? null,
      homeRed: stats.homeRed ?? null,
      awayRed: stats.awayRed ?? null,
      homeCards: stats.homeCards ?? null,
      awayCards: stats.awayCards ?? null,
    },
  };
}

export function formToFactsPayload(form: FixtureFactsForm): Record<string, unknown> {
  const goals = {
    home: form.goals.home,
    away: form.goals.away,
  };

  const score: Record<string, ScorePair> = {};
  if (form.halftime.home != null || form.halftime.away != null) {
    score.halftime = { home: form.halftime.home, away: form.halftime.away };
  }
  if (form.fulltime.home != null || form.fulltime.away != null) {
    score.fulltime = { home: form.fulltime.home, away: form.fulltime.away };
  }

  const events = form.events
    .filter((e) => Number.isFinite(e.minute))
    .map((e) => {
      if (e.type === 'card') {
        return { type: 'card', team: e.team, minute: e.minute, cardType: e.cardType };
      }
      return {
        type: 'goal',
        team: e.team,
        minute: e.minute,
        ...(e.addedTime != null ? { addedTime: e.addedTime } : {}),
      };
    });

  const s = form.statistics;
  const homeCardsSum = (s.homeYellow ?? 0) + (s.homeRed ?? 0);
  const awayCardsSum = (s.awayYellow ?? 0) + (s.awayRed ?? 0);
  const homeCards = s.homeCards ?? (homeCardsSum > 0 ? homeCardsSum : null);
  const awayCards = s.awayCards ?? (awayCardsSum > 0 ? awayCardsSum : null);

  const statistics: FixtureStatistics = {};
  if (s.homeCorners != null) statistics.homeCorners = s.homeCorners;
  if (s.awayCorners != null) statistics.awayCorners = s.awayCorners;
  if (s.homeYellow != null) statistics.homeYellow = s.homeYellow;
  if (s.awayYellow != null) statistics.awayYellow = s.awayYellow;
  if (s.homeRed != null) statistics.homeRed = s.homeRed;
  if (s.awayRed != null) statistics.awayRed = s.awayRed;
  if (homeCards != null && Number.isFinite(homeCards)) statistics.homeCards = homeCards;
  if (awayCards != null && Number.isFinite(awayCards)) statistics.awayCards = awayCards;

  const payload: Record<string, unknown> = {
    fixtureStatusShort: form.fixtureStatusShort || null,
    goals,
    events,
  };
  if (Object.keys(score).length) payload.score = score;
  if (Object.keys(statistics).length) payload.statistics = statistics;
  return payload;
}

export function parseScoreInput(home: string, away: string): ScorePair {
  return { home: numOrNull(home), away: numOrNull(away) };
}
