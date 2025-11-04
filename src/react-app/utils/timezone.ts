// Timezone utilities for RIVALVERSO - All times in GMT-6 Ciudad de México
// Provides consistent timezone handling across the entire application

export const MEXICO_CITY_TIMEZONE = 'America/Mexico_City'; // IANA timezone identifier for Ciudad de México (GMT-6)

// Date/Time format options for Ciudad de México
const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false, // 24-hour format
  timeZone: MEXICO_CITY_TIMEZONE,
};

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  timeZone: MEXICO_CITY_TIMEZONE,
};

const timeFormatOptions: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: MEXICO_CITY_TIMEZONE,
};

const shortDateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: MEXICO_CITY_TIMEZONE,
};

/**
 * Formats a date/time ISO string (UTC) or Date object to Ciudad de México timezone (GMT-6).
 * @param dateInput The date/time input (ISO string or Date object).
 * @param formatType 'datetime' | 'date' | 'time' | 'short'
 * @returns Formatted date/time string in Ciudad de México timezone.
 */
export function formatToMexicoCityTime(dateInput: string | Date, formatType: 'datetime' | 'date' | 'time' | 'short' = 'datetime'): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  let options: Intl.DateTimeFormatOptions;
  switch (formatType) {
    case 'date':
      options = dateFormatOptions;
      break;
    case 'time':
      options = timeFormatOptions;
      break;
    case 'short':
      options = shortDateTimeFormatOptions;
      break;
    case 'datetime':
    default:
      options = dateTimeFormatOptions;
      break;
  }

  // Use 'es-MX' locale for proper date format (dd/mm/yyyy)
  return new Intl.DateTimeFormat('es-MX', options).format(date);
}

/**
 * Returns a Date object representing the current time in Ciudad de México timezone.
 * Note: This returns a Date object adjusted to show Mexico City local time.
 */
export function getMexicoCityNow(): Date {
  const now = new Date(); // Current UTC time
  
  // Get the current time in Mexico City timezone
  const mexicoCityTimeStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_CITY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
  
  // Convert to ISO format and create Date object
  const [datePart, timePart] = mexicoCityTimeStr.split(', ');
  const isoString = `${datePart}T${timePart}`;
  
  return new Date(isoString);
}

/**
 * Formats a timestamp to a "time ago" format relative to Ciudad de México time.
 * @param timestamp ISO date/time string (UTC from database).
 * @returns String like "Hace 5m", "Hace 2h", "Hace 3d" or formatted date.
 */
export function formatTimeAgoMexicoCity(timestamp: string): string {
  try {
    const date = new Date(timestamp); // This is UTC from database
    const nowMexicoCity = getMexicoCityNow(); // Current time in Mexico City

    // Calculate difference in milliseconds
    const diffMs = nowMexicoCity.getTime() - date.getTime(); 
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Hace unos segundos";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    // For older dates, show full formatted date in Mexico City time
    return formatToMexicoCityTime(date, 'short');
  } catch {
    return 'N/A';
  }
}

/**
 * Converts a datetime-local input value (Mexico City time) to UTC ISO string for database storage.
 * @param localDateTime String from HTML datetime-local input (Mexico City timezone).
 * @returns UTC ISO string for database storage.
 */
export function convertMexicoCityToUTC(localDateTime: string): string {
  try {
    // The datetime-local input gives us a value like "2025-10-15T10:00"
    // We need to treat this as Mexico City time and convert to UTC
    
    // Parse as if it's Mexico City time
    const [datePart, timePart] = localDateTime.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create a date in Mexico City timezone
    // This is a bit tricky because Date constructor assumes local timezone
    // We'll use a workaround with timezone formatting
    
    const mexicoCityDate = new Date();
    mexicoCityDate.setFullYear(year, month - 1, day); // month is 0-based
    mexicoCityDate.setHours(hour, minute, 0, 0);
    
    // Get the timezone offset for Mexico City
    const mexicoCityOffset = getMexicoCityTimezoneOffset();
    
    // Adjust to UTC by adding the Mexico City offset
    const utcTime = mexicoCityDate.getTime() + (mexicoCityOffset * 60 * 1000);
    
    return new Date(utcTime).toISOString();
  } catch (error) {
    console.error('Error converting Mexico City time to UTC:', error);
    return new Date().toISOString(); // Fallback to current time
  }
}

/**
 * Converts a UTC ISO string to datetime-local format for Ciudad de México timezone.
 * @param utcISOString UTC ISO string from database.
 * @returns String in format for HTML datetime-local input (Mexico City time).
 */
export function convertUTCToMexicoCityLocal(utcISOString: string): string {
  try {
    const date = new Date(utcISOString);
    
    // Format to Mexico City timezone in ISO-like format
    const mexicoCityDateTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: MEXICO_CITY_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
    
    // Convert from "YYYY-MM-DD, HH:mm" to "YYYY-MM-DDTHH:mm"
    const [datePart, timePart] = mexicoCityDateTime.split(', ');
    return `${datePart}T${timePart}`;
  } catch (error) {
    console.error('Error converting UTC to Mexico City local:', error);
    // Return current time in Mexico City as fallback
    const now = new Date();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: MEXICO_CITY_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now).replace(', ', 'T');
  }
}

/**
 * Gets the timezone offset for Mexico City in minutes.
 * @returns Offset in minutes (negative for west of GMT).
 */
function getMexicoCityTimezoneOffset(): number {
  // Mexico City is GMT-6, so offset is -360 minutes
  // However, we need to check for daylight saving time
  const now = new Date();
  
  // Create a date in Mexico City timezone
  const mexicoCityTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_CITY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
  
  // Create a date in UTC
  const utcTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
  
  // Calculate the difference
  const mexicoCityDate = new Date(mexicoCityTime.replace(', ', 'T'));
  const utcDate = new Date(utcTime.replace(', ', 'T'));
  
  const offsetMs = utcDate.getTime() - mexicoCityDate.getTime();
  return Math.round(offsetMs / (1000 * 60)); // Convert to minutes
}

/**
 * Creates a user-friendly date/time display for Ciudad de México.
 * @param dateInput ISO string or Date object.
 * @returns String like "15 Oct 2025 a las 10:30" in Mexico City time.
 */
export function formatUserFriendlyMexicoCity(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_CITY_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date).replace(' a las ', ' a las ');
}

/**
 * Gets the current Mexico City time formatted for display.
 * @returns Current Mexico City time as formatted string.
 */
export function getCurrentMexicoCityTimeString(): string {
  const now = new Date();
  return formatToMexicoCityTime(now, 'datetime');
}

/**
 * Validates if a date is after the competition start date.
 * @param matchTimestamp UTC ISO string of the match.
 * @param competitionStartUTC UTC ISO string of competition start.
 * @returns True if match is valid for competition.
 */
export function isMatchValidForCompetition(matchTimestamp: string, competitionStartUTC: string): boolean {
  try {
    const matchDate = new Date(matchTimestamp);
    const startDate = new Date(competitionStartUTC);
    
    return matchDate >= startDate;
  } catch (error) {
    console.error('Error validating match for competition:', error);
    return false; // If we can't validate, assume invalid for safety
  }
}
