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

export function inferGoalsFromEvents(events: FixtureEvent[]): ScorePair {
  let home = 0;
  let away = 0;
  for (const event of events) {
    if (event.type !== 'goal') continue;
    if (event.team === 'away') away += 1;
    else home += 1;
  }
  return { home, away };
}

export function syncGoalsFromEvents(form: FixtureFactsForm): FixtureFactsForm {
  return { ...form, goals: inferGoalsFromEvents(form.events) };
}

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

function scorePairFilled(pair: ScorePair): boolean {
  return pair.home != null && pair.away != null;
}

/** Match phase / lifecycle only — does not change scores or events. */
export function buildStatusFactsPatch(fixtureStatusShort: string): Record<string, unknown> {
  return { fixtureStatusShort: fixtureStatusShort?.trim() ? fixtureStatusShort.trim().toUpperCase() : null };
}

/** Half-time row only — for HT-period legs while the match may still be live. */
export function buildHalftimeFactsPatch(halftime: ScorePair): Record<string, unknown> {
  return {
    score: {
      halftime: { home: halftime.home, away: halftime.away },
    },
  };
}

/** Full-time row (+ goals). Optionally mark the match finished. */
export function buildFulltimeFactsPatch(
  fulltime: ScorePair,
  options: { markFinished?: boolean } = {},
): Record<string, unknown> {
  const { markFinished = true } = options;
  const payload: Record<string, unknown> = {
    score: {
      fulltime: { home: fulltime.home, away: fulltime.away },
    },
  };
  if (scorePairFilled(fulltime)) {
    payload.goals = { home: fulltime.home, away: fulltime.away };
  }
  if (markFinished) {
    payload.fixtureStatusShort = 'FT';
  }
  return payload;
}

/** Live/current totals when timeline is incomplete — does not touch events or HT/FT rows. */
export function buildLiveGoalsFactsPatch(goals: ScorePair): Record<string, unknown> {
  return {
    goals: { home: goals.home, away: goals.away },
  };
}

function mapEventsForPayload(events: FixtureEvent[]) {
  return events
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
}

/** Goal/card timeline — updates events and goals inferred from goal rows. */
export function buildTimelineFactsPatch(events: FixtureEvent[]): Record<string, unknown> {
  const mapped = mapEventsForPayload(events);
  const payload: Record<string, unknown> = { events: mapped };
  if (mapped.some((e) => e.type === 'goal')) {
    payload.goals = inferGoalsFromEvents(events);
  }
  return payload;
}

/** Corner/card statistics block only. */
export function buildStatisticsFactsPatch(statistics: FixtureStatistics): Record<string, unknown> {
  const s = statistics;
  const homeCardsSum = (s.homeYellow ?? 0) + (s.homeRed ?? 0);
  const awayCardsSum = (s.awayYellow ?? 0) + (s.awayRed ?? 0);
  const homeCards = s.homeCards ?? (homeCardsSum > 0 ? homeCardsSum : null);
  const awayCards = s.awayCards ?? (awayCardsSum > 0 ? awayCardsSum : null);

  const out: FixtureStatistics = {};
  if (s.homeCorners != null) out.homeCorners = s.homeCorners;
  if (s.awayCorners != null) out.awayCorners = s.awayCorners;
  if (s.homeYellow != null) out.homeYellow = s.homeYellow;
  if (s.awayYellow != null) out.awayYellow = s.awayYellow;
  if (s.homeRed != null) out.homeRed = s.homeRed;
  if (s.awayRed != null) out.awayRed = s.awayRed;
  if (homeCards != null && Number.isFinite(homeCards)) out.homeCards = homeCards;
  if (awayCards != null && Number.isFinite(awayCards)) out.awayCards = awayCards;

  return Object.keys(out).length ? { statistics: out } : {};
}

export function formToFactsPayload(form: FixtureFactsForm): Record<string, unknown> {
  const inferredGoals = inferGoalsFromEvents(form.events);
  const hasGoalEvents = form.events.some((e) => e.type === 'goal');
  const goals = hasGoalEvents
    ? inferredGoals
    : {
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

  const events = mapEventsForPayload(form.events);

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
