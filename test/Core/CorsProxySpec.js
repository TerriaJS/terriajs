'use strict';

/*global require*/
var CorsProxy = require('../../lib/Core/CorsProxy');
var when = require('when');

describe('CorsProxy', function() {
    var corsProxy, loadDeferred, loadJson;
    var originalPageIsHttps, originalAlwaysUseProxy;

    beforeEach(function() {
        loadDeferred = when.defer();
        loadJson = jasmine.createSpy('loadJson').and.returnValue(loadDeferred.promise);
        corsProxy = new CorsProxy(loadJson);

        originalPageIsHttps = corsProxy.pageIsHttps;
        originalAlwaysUseProxy = corsProxy.alwaysUseProxy;
        corsProxy.pageIsHttps = false;
        corsProxy.alwaysUseProxy = false;
    });

    afterEach(function() {
        corsProxy.pageIsHttps = originalPageIsHttps;
        corsProxy.alwaysUseProxy = originalAlwaysUseProxy;
        corsProxy.proxyDomains.length = 0;
        corsProxy.corsDomains.length = 0;
    });

    describe('init', function() {

        it('should use baseProxyUrl for subsequent proxy calls', function() {
            corsProxy.init('', 'proxy2/', {});

            expect(corsProxy.getURL('example')).toBe('proxy2/example');
        });

        it('should use the passed proxyDomains', function() {
            corsProxy.init(undefined, undefined, ['example.com']);

            expect(corsProxy.shouldUseProxy('http://example.com')).toBe(true);
            expect(corsProxy.shouldUseProxy('http://example2.com')).toBe(false);
        });

        it('should ignore the passed proxyDomains if also provided a serverconfig list', function() {
            corsProxy.init({ allowProxyFor: [ 'example2.com' ] }, undefined, ['example.com']);

            expect(corsProxy.shouldUseProxy('http://example.com')).toBe(false);
            expect(corsProxy.shouldUseProxy('http://example2.com')).toBe(true);
            expect(corsProxy.shouldUseProxy('http://example3.com')).toBe(false);
        });

        it('should honour proxyAllDomains being returned in proxyableDomains json by proxying all domains', function() {
            corsProxy.init({ allowProxyFor: [ 'example2.com' ], proxyAllDomains: true }, undefined, ['example.com']);

            expect(corsProxy.shouldUseProxy('http://example.com')).toBe(true);
            expect(corsProxy.shouldUseProxy('http://example2.com')).toBe(true);
            expect(corsProxy.shouldUseProxy('http://example3.com')).toBe(true);
            
        });
    });

    describe('getURL', function() {
        beforeEach(function() {
            corsProxy.init(undefined, undefined, ['example.com']);
        });

        it('converts URLs in the proxyableDomains list', function() {
            expect(corsProxy.getURL('http://example.com/blah')).toBe('proxy/http://example.com/blah');
        });

        it('converts URLs outside the proxyableDomains list', function() {
            expect(corsProxy.getURL('http://example2.com/blah')).toBe('proxy/http://example2.com/blah');
        });

        it('adds a proxy flag if specified', function() {
            expect(corsProxy.getURL('http://example.com/blah', '2d')).toBe('proxy/_2d/http://example.com/blah');
        });
    });

    describe('getURLProxyIfNecessary', function() {
        beforeEach(function() {
            corsProxy.init(undefined, undefined, ['example.com']);
        });

        it('converts URLs that should be proxied', function() {
            expect(corsProxy.getURLProxyIfNecessary('http://example.com/blah')).toBe('proxy/http://example.com/blah');
        });

        it('doesn\'t converts URLs that should not be proxied', function() {
            expect(corsProxy.getURLProxyIfNecessary('http://example2.com/blah')).toBe('http://example2.com/blah');
        });
    });

    describe('shouldUseProxy', function() {
        beforeEach(function() {
            corsProxy.init();
        });

        it('returns false for an undefined input', function() {
            expect(corsProxy.shouldUseProxy()).toBe(false);
        });

        it('returns false for a relative path', function() {
            expect(corsProxy.shouldUseProxy('path')).toBe(false);
        });

        it('returns false for an absolute local path', function() {
            expect(corsProxy.shouldUseProxy('/path')).toBe(false);
        });

        it('proxies all domains if an open proxy', function() {
            corsProxy.proxyDomains.push('example.com');
            corsProxy.isOpenProxy = true;
            expect(corsProxy.shouldUseProxy('http://www.example.com/foo')).toBe(true);
            expect(corsProxy.shouldUseProxy('http://www.example2.com/foo')).toBe(true);
        });

        describe('for a URL to a CORS-capable domain', function() {
            it('does not proxy under usual conditions', function() {
                corsProxy.proxyDomains.push('example.com');
                corsProxy.corsDomains.push('example.com');
                expect(corsProxy.shouldUseProxy('http://www.example.com/foo')).toBe(false);
            });

            it('are proxied for http requests on https sites', function() {
                corsProxy.pageIsHttps = true;
                corsProxy.proxyDomains.push('example.com');
                corsProxy.corsDomains.push('example.com');
                expect(corsProxy.shouldUseProxy('http://www.example.com/foo')).toBe(true);
            });
        });

        describe('for a URL to a non-CORS capable domain', function() {
            it('proxies to domains in proxyableDomains', function() {
                corsProxy.proxyDomains.push('example.com');
                expect(corsProxy.shouldUseProxy('http://www.example.com/foo')).toBe(true);
            });

            it('does not proxy requests to domains not in proxyableDomains', function() {
                corsProxy.proxyDomains.push('example.com');
                expect(corsProxy.shouldUseProxy('http://www.example2.com/foo')).toBe(false);
            });
        });

        describe('if alwaysUseProxy is true', function() {
            beforeEach(function() {
                corsProxy.alwaysUseProxy = true;
                corsProxy.proxyDomains.push('example.com');
            });

            it('should still block domains outside proxyabledomains', function() {
                expect(corsProxy.shouldUseProxy('http://www.example2.com/foo')).toBe(false);
            });

            it('should proxy for domain in list even when calling http -> http', function() {
                expect(corsProxy.shouldUseProxy('http://www.example.com/foo')).toBe(true);
            });

            it('should proxy for domain in list even when in CORS list', function() {
                corsProxy.corsDomains.push('example.com');
                expect(corsProxy.shouldUseProxy('http://www.example.com/foo')).toBe(true);
            });
        });
    });
});
