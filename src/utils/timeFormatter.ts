/**
 * Formats 24-hour time string (e.g., "09:00", "14:30", "23:00") into 12-hour AM/PM format (e.g., "09:00 AM", "02:30 PM", "11:00 PM").
 */
export const formatTo12Hour = (timeStr?: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  // If already contains AM/PM, return normalized
  if (/am|pm/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);

  if (isNaN(hours)) return trimmed;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${formattedHours}:${minutes} ${ampm}`;
};

/**
 * Formats a start and end time range with AM/PM (e.g. "09:00 AM - 11:00 AM").
 */
export const formatTimeRange = (startTime?: string, endTime?: string): string => {
  const start = formatTo12Hour(startTime);
  const end = formatTo12Hour(endTime);
  if (!start && !end) return '';
  if (!end) return start;
  if (!start) return end;
  return `${start} - ${end}`;
};
