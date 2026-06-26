/**
 * Date utility helpers for Two Hearts app.
 * Keeps storage dates as ISO 8601 strings and UI displays as DD-MM-YYYY HH:MM.
 */

/**
 * Formats an ISO 8601 string to DD-MM-YYYY HH:MM
 */
export const formatDateTime = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (error) {
    return isoString;
  }
};

/**
 * Formats an ISO string (or YYYY-MM-DD) to DD-MM-YYYY
 */
export const formatDateOnly = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    return dateString;
  }
};

/**
 * Converts a date object to local ISO string format
 */
export const toLocalISOString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Checks if the given event time is older than 14 days from the current time.
 * If older than 14 days, returns true (which locks the event).
 */
export const isOlderThan14Days = (eventIsoString: string): boolean => {
  if (!eventIsoString) return false;
  try {
    const eventTime = new Date(eventIsoString).getTime();
    const currentTime = Date.now();
    const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
    return currentTime - eventTime > fourteenDaysInMs;
  } catch (error) {
    return false;
  }
};

/**
 * Calculates detailed duration from confession day to current time
 */
export interface DurationDetails {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const getDurationSince = (confessionIsoString: string): DurationDetails => {
  const result = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (!confessionIsoString) return result;

  try {
    const confessionTime = new Date(confessionIsoString).getTime();
    const currentTime = Date.now();
    const difference = currentTime - confessionTime;

    if (difference <= 0) return result;

    const msInSecond = 1000;
    const msInMinute = msInSecond * 60;
    const msInHour = msInMinute * 60;
    const msInDay = msInHour * 24;

    result.days = Math.floor(difference / msInDay);
    result.hours = Math.floor((difference % msInDay) / msInHour);
    result.minutes = Math.floor((difference % msInHour) / msInMinute);
    result.seconds = Math.floor((difference % msInMinute) / msInSecond);
  } catch (error) {
    console.error("Error calculating duration:", error);
  }

  return result;
};
