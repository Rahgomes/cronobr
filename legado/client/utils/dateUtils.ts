/**
 * Utility functions for date and time formatting
 */

import { Language, translations } from "@/lib/i18n";

/**
 * Formats a timestamp to a short date/time format
 * @param timestamp - ISO 8601 timestamp string
 * @param language - Language code for formatting
 * @returns Formatted string like "16 jan, 19:14" (PT-BR) or "Jan 16, 7:14 PM" (EN)
 */
export function formatDate(timestamp: string, language: Language): string {
  const date = new Date(timestamp);
  const months = translations[language].months.short as string[];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // English uses 12-hour format with AM/PM for short dates too
  if (language === "en") {
    const hours12 = date.getHours() % 12 || 12;
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    return `${month} ${day}, ${hours12}:${minutes} ${ampm}`;
  }

  // Other languages use 24-hour format
  return `${day} ${month}, ${hours}:${minutes}`;
}

/**
 * Formats a timestamp to a full date/time format
 * @param timestamp - ISO 8601 timestamp string
 * @param language - Language code for formatting
 * @returns Formatted string like "16 de janeiro de 2026, 19:14" (PT-BR) or "January 16, 2026, 7:14 PM" (EN)
 */
export function formatDateFull(timestamp: string, language: Language): string {
  const date = new Date(timestamp);
  const months = translations[language].months.long as string[];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // Language-specific formatting
  switch (language) {
    case "en":
      // "January 16, 2026, 7:14 PM"
      const hours12 = date.getHours() % 12 || 12;
      const ampm = date.getHours() >= 12 ? "PM" : "AM";
      return `${month} ${day}, ${year}, ${hours12}:${minutes} ${ampm}`;

    case "fr":
      // "16 janvier 2026, 19:14"
      return `${day} ${month} ${year}, ${hours}:${minutes}`;

    case "pt-BR":
    case "es":
    default:
      // "16 de janeiro de 2026, 19:14" or "16 de enero de 2026, 19:14"
      return `${day} de ${month} de ${year}, ${hours}:${minutes}`;
  }
}

/**
 * Formats duration in seconds to mm:ss format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "15:30"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats duration in seconds to a human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "15min 30s" or "45s"
 */
export function formatDurationHuman(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) {
    return `${secs}s`;
  }

  if (secs === 0) {
    return `${mins}min`;
  }

  return `${mins}min ${secs}s`;
}

/**
 * Gets relative time description
 * @param timestamp - ISO 8601 timestamp string
 * @param language - Language code for formatting
 * @returns Relative time string like "Hoje" (PT-BR), "Today" (EN), etc.
 */
export function getRelativeTime(timestamp: string, language: Language): string {
  const date = new Date(timestamp);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const relativeTime = translations[language].relativeTime as Record<string, string>;

  // Helper function to replace {{count}} placeholder
  const replacePlaceholder = (template: string, count: number): string => {
    return template.replace("{{count}}", String(count));
  };

  if (diffDays === 0) {
    return relativeTime.today;
  } else if (diffDays === 1) {
    return relativeTime.yesterday;
  } else if (diffDays < 7) {
    return replacePlaceholder(relativeTime.daysAgo, diffDays);
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1
      ? relativeTime.weeksAgo_one
      : replacePlaceholder(relativeTime.weeksAgo_other, weeks);
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1
      ? relativeTime.monthsAgo_one
      : replacePlaceholder(relativeTime.monthsAgo_other, months);
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1
      ? relativeTime.yearsAgo_one
      : replacePlaceholder(relativeTime.yearsAgo_other, years);
  }
}
