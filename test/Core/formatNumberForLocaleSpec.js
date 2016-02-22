'use strict';

/*global require,Intl:true*/
var formatNumberForLocale = require('../../lib/Core/formatNumberForLocale');

describe('formatNumberForLocale', function() {

    describe('with Intl', function() {

        var separator = ',';
        if (typeof Intl === 'object') {
            separator = (typeof Intl.NumberFormat === 'function' && Intl.NumberFormat().format(1000)[1]);
        }

        it('returns strings for small integers', function() {
            expect(formatNumberForLocale(0)).toBe('0');
            expect(formatNumberForLocale(1)).toBe('1');
            expect(formatNumberForLocale(123)).toBe('123');
            expect(formatNumberForLocale(-10)).toBe('-10');
        });

        it('handles non-numeric input', function() {
            expect(formatNumberForLocale(null)).toBe('');
            expect(formatNumberForLocale(undefined)).toBe('');
            expect(formatNumberForLocale('NA')).toBe('NA');
            expect(formatNumberForLocale('-')).toBe('-');
        });

        it('does not truncate decimals or group 000s by default', function() {
            expect(formatNumberForLocale(6789123.4567891)).toBe('6789123.4567891');
            expect(formatNumberForLocale(-6789123.4567891)).toBe('-6789123.4567891');
        });

        it('maximumFractionDigits works with rounding', function() {
            expect(formatNumberForLocale(-6789123.45678901, {maximumFractionDigits: 2})).toBe('-6789123.46');
            expect(formatNumberForLocale(-6789123.45678901, {maximumFractionDigits: 2})).toBe('-6789123.46');
            expect(formatNumberForLocale(9.999, {maximumFractionDigits: 2})).toContain('10');  // Accept 10, 10.0 or 10.00
            expect(formatNumberForLocale(-9.999, {maximumFractionDigits: 2})).toContain('-10');
        });

        it('useGrouping works', function() {
            expect(formatNumberForLocale(-6789123.4, {useGrouping: true})).toBe('-6' + separator + '789' + separator + '123.4');
            expect(formatNumberForLocale(-6789123.3678, {useGrouping: true, maximumFractionDigits: 1})).toBe('-6' + separator + '789' + separator + '123.4');
        });

        it('style percent works', function() {
            expect(formatNumberForLocale(0.934, {style: 'percent'})).toBe('93.4%');
            expect(formatNumberForLocale(1.555555, {style: 'percent'})).toBe('155.5555%');
            expect(formatNumberForLocale(-0.4, {style: 'percent'})).toContain('-40'); // Allow either -40% or -40.0%
            expect(formatNumberForLocale(0.93456, {style: 'percent', maximumFractionDigits: 2})).toContain('93.46');  // IE11 produces 93.46 % with a space.
        });

    });

    describe('without Intl', function() {

        var realIntl;

        beforeEach(function() {
            if (typeof Intl === 'object') {
                realIntl = Intl;
                Intl = undefined;
            }
        });

        afterEach(function() {
            if (realIntl) {
                Intl = realIntl;
            }
        });

        var separator = ',';

        it('returns strings for small integers', function() {
            expect(formatNumberForLocale(0)).toBe('0');
            expect(formatNumberForLocale(1)).toBe('1');
            expect(formatNumberForLocale(123)).toBe('123');
            expect(formatNumberForLocale(-10)).toBe('-10');
        });

        it('handles non-numeric input', function() {
            expect(formatNumberForLocale(null)).toBe('');
            expect(formatNumberForLocale(undefined)).toBe('');
            expect(formatNumberForLocale('NA')).toBe('NA');
            expect(formatNumberForLocale('-')).toBe('-');
        });

        it('does not truncate decimals or group 000s by default', function() {
            expect(formatNumberForLocale(6789123.4567891)).toBe('6789123.4567891');
            expect(formatNumberForLocale(-6789123.4567891)).toBe('-6789123.4567891');
        });

        it('maximumFractionDigits works with rounding', function() {
            expect(formatNumberForLocale(-6789123.45678901, {maximumFractionDigits: 2})).toBe('-6789123.46');
            expect(formatNumberForLocale(-6789123.45678901, {maximumFractionDigits: 2})).toBe('-6789123.46');
            expect(formatNumberForLocale(9.999, {maximumFractionDigits: 2})).toContain('10');  // Accept 10, 10.0 or 10.00
            expect(formatNumberForLocale(-9.999, {maximumFractionDigits: 2})).toContain('-10');
        });

        it('useGrouping works', function() {
            expect(formatNumberForLocale(-6789123.4, {useGrouping: true})).toBe('-6' + separator + '789' + separator + '123.4');
            expect(formatNumberForLocale(-6789123.3678, {useGrouping: true, maximumFractionDigits: 1})).toBe('-6' + separator + '789' + separator + '123.4');
        });

        it('style percent works', function() {
            expect(formatNumberForLocale(0.934, {style: 'percent'})).toBe('93.4%');
            expect(formatNumberForLocale(1.555555, {style: 'percent'})).toBe('155.5555%');
            expect(formatNumberForLocale(-0.4, {style: 'percent'})).toContain('-40'); // Allow either -40% or -40.0%
            expect(formatNumberForLocale(0.93456, {style: 'percent', maximumFractionDigits: 2})).toBe('93.46%');
        });

    });

});
