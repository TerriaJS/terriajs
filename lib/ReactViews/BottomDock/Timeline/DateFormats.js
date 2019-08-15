"use strict";

import defined from "terriajs-cesium/Source/Core/defined";

/**
 * Formats a date according to the locale if provided, otherwise in a dd/mm/yyyy format.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted date.
 */
export function formatDate(d, locale) {
  if (defined(locale)) {
    return d.toLocaleDateString(locale);
  }
  return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join("/");
}

/**
 * Formats the time according to the locale if provided, otherwise in a hh:mm:ss format.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted time.
 */
export function formatTime(d, locale) {
  if (defined(locale)) {
    return d.toLocaleTimeString(locale);
  }
  return [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(
    ":"
  );
}

/**
 * Combines {@link #formatDate} and {@link #formatTime}.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted date and time with a comma separating them.
 */
export function formatDateTime(d, locale) {
  return formatDate(d, locale) + ", " + formatTime(d, locale);
}

/**
 * Puts a leading 0 in front of a number of it's less than 10.
 *
 * @param {number} s A number to pad
 * @returns {string} A string representing a two-digit number.
 */
function pad(s) {
  return s < 10 ? "0" + s : `${s}`;
}
