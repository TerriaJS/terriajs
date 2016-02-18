'use strict';

/*global require,Intl:true*/
var formatNumberForLocale = require('../../lib/Core/formatNumberForLocale');

describe('formatNumberForLocale', function() {

    describe('with Intl', function() {

        var separator = (Intl && typeof Intl.NumberFormat === 'function' && Intl.NumberFormat().format(1000)[1]) || ',';

        it('returns strings for small integers', function() {
            expect(formatNumberForLocale(0)).toBe('0');
            expect(formatNumberForLocale(1)).toBe('1');
            expect(formatNumberForLocale(123)).toBe('123');
            expect(formatNumberForLocale(-10)).toBe('-10');
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

    });

    describe('without Intl', function() {

        var realIntl;

        beforeEach(function() {
            realIntl = Intl;
            Intl = undefined;
        });

        afterEach(function() {
            Intl = realIntl;
        });

        var separator = (Intl && typeof Intl.NumberFormat === 'function' && Intl.NumberFormat().format(1000)[1]) || ',';

        it('returns strings for small integers', function() {
            expect(formatNumberForLocale(0)).toBe('0');
            expect(formatNumberForLocale(1)).toBe('1');
            expect(formatNumberForLocale(123)).toBe('123');
            expect(formatNumberForLocale(-10)).toBe('-10');
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

    });

});
