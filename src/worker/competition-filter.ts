// Competition filter utilities
// Handles filtering of match data based on competition start timestamp

export interface FilteredMatchData {
  validMatches: any[];
  invalidMatches: any[];
  totalMatches: number;
  competitionMatches: number;
}

/**
 * Filters match history to only include matches after competition start date.
 * @param matches Array of match objects with timestamp property
 * @param competitionStartUTC UTC ISO string of competition start
 * @returns Filtered match data with statistics
 */
export function filterMatchesForCompetition(matches: any[], competitionStartUTC: string | null): FilteredMatchData {
  if (!competitionStartUTC || !matches || matches.length === 0) {
    return {
      validMatches: matches || [],
      invalidMatches: [],
      totalMatches: matches?.length || 0,
      competitionMatches: matches?.length || 0
    };
  }

  try {
    const startDate = new Date(competitionStartUTC);
    const validMatches: any[] = [];
    const invalidMatches: any[] = [];

    matches.forEach(match => {
      try {
        const matchDate = new Date(match.timestamp || match.match_time_stamp || match.created_at);
        
        if (matchDate >= startDate) {
          validMatches.push(match);
        } else {
          invalidMatches.push(match);
        }
      } catch (error) {
        console.warn('Error processing match timestamp:', error);
        // If we can't parse the timestamp, include it to be safe
        validMatches.push(match);
      }
    });

    return {
      validMatches,
      invalidMatches,
      totalMatches: matches.length,
      competitionMatches: validMatches.length
    };
  } catch (error) {
    console.error('Error filtering matches for competition:', error);
    // If filtering fails, return all matches to avoid data loss
    return {
      validMatches: matches,
      invalidMatches: [],
      totalMatches: matches.length,
      competitionMatches: matches.length
    };
  }
}

/**
 * Calculates aggregated statistics from filtered match history.
 * @param validMatches Array of valid matches for competition
 * @returns Aggregated statistics
 */
export function calculateStatsFromMatches(validMatches: any[]): {
  gamesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDamage: number;
  totalHealing: number;
  timePlayed: number;
  kdRatio: number;
  kdaRatio: number;
  winRate: number;
} {
  if (!validMatches || validMatches.length === 0) {
    return {
      gamesPlayed: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      totalDamage: 0,
      totalHealing: 0,
      timePlayed: 0,
      kdRatio: 0,
      kdaRatio: 0,
      winRate: 0
    };
  }

  const stats = validMatches.reduce((acc, match) => {
    acc.gamesPlayed += 1;
    acc.wins += match.result === 'win' ? 1 : 0;
    acc.kills += Number(match.kills || 0);
    acc.deaths += Number(match.deaths || 0);
    acc.assists += Number(match.assists || 0);
    acc.timePlayed += Number(match.duration || 0);
    // Note: match-level damage/healing may not be available in all APIs
    return acc;
  }, {
    gamesPlayed: 0,
    wins: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    totalDamage: 0,
    totalHealing: 0,
    timePlayed: 0
  });

  const kdRatio = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
  const kdaRatio = stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : (stats.kills + stats.assists);
  const winRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;

  return {
    ...stats,
    kdRatio,
    kdaRatio,
    winRate
  };
}

/**
 * Gets the current competition start timestamp from app configuration.
 * @param db Database instance
 * @returns Competition start timestamp in UTC or null if not set
 */
export async function getCompetitionStartTimestamp(db: any): Promise<string | null> {
  try {
    const result = await db.prepare(`
      SELECT value FROM app_config WHERE key = 'competition_start_timestamp'
    `).first();
    
    return result?.value || null;
  } catch (error) {
    console.error('Error getting competition start timestamp:', error);
    return null;
  }
}

/**
 * Logs competition filtering operation for debugging.
 * @param originalCount Original number of matches
 * @param filteredCount Number of matches after filtering
 * @param competitionStartUTC Competition start timestamp
 */
export function logCompetitionFiltering(originalCount: number, filteredCount: number, competitionStartUTC: string | null): void {
  if (!competitionStartUTC) {
    console.log(`📊 Competition filter: No start date configured, using all ${originalCount} matches`);
    return;
  }

  console.log(`📊 Competition filter applied:`);
  console.log(`   • Total matches from API: ${originalCount}`);
  console.log(`   • Valid for competition: ${filteredCount}`);
  console.log(`   • Filtered out: ${originalCount - filteredCount}`);
  console.log(`   • Competition start: ${competitionStartUTC}`);
  
  if (filteredCount === 0 && originalCount > 0) {
    console.warn(`⚠️ All matches filtered out - competition start date may be too recent or incorrect`);
  }
}
