'use strict';

export function formatDate(d, locale) {
    function pad(s) { return (s < 10) ? '0' + s : s; }

    if (defined(locale)) {
        return d.toLocaleDateString(locale);
    }
    return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join('/');
}

export function formatTime(d, locale) {
    function pad(s) { return (s < 10) ? '0' + s : s; }

    if (defined(locale)) {
        return d.toLocaleTimeString(locale);
    }
    return [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
}

export function formatDateTime(d, locale) {
    return formatDate(d, locale) + ', ' + formatTime(d, locale);
}
