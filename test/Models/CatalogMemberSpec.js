'use strict';

/*global require*/
var CatalogMember = require('../../lib/Models/CatalogMember');
var Terria = require('../../lib/Models/Terria');
var when = require('terriajs-cesium/Source/ThirdParty/when');

describe('CatalogMember', function () {
    var terria;
    var member;

    beforeEach(function () {
        terria = new Terria({
            baseUrl: './'
        });
        member = new CatalogMember(terria);
    });

    describe('triggering load()', function() {
        var loadPromise;

        beforeEach(function() {
            spyOn(terria.disclaimerEvent, 'raiseEvent');
            member._load = function() {
               return when.resolve(); // make the implementation-specific _load method return instantly, it's not on trial here.
            };
        });

        describe('when item has a disclaimer', function() {
            beforeEach(function() {
                member.initialMessage = {};
                loadPromise = member.load();
            });

            it('doesn\'t finish loading until the disclaimer is accepted', function() {
                expect(member.isLoading).toBe(true);
            });

            it('triggers a disclaimerEvent', function() {
                expect(terria.disclaimerEvent.raiseEvent.calls.argsFor(0)[0]).toBe(member);
            });

            it('marks loading as finished after callback passed to disclaimerEvent is executed', function(done) {
                terria.disclaimerEvent.raiseEvent.calls.argsFor(0)[1]();

                loadPromise.then(function() {
                    expect(member.isLoading).toBe(false);
                    done();
                }).otherwise(done.fail);
            });
        });

        describe('when item has no disclaimer', function() {
            beforeEach(function() {
                loadPromise = member.load();
            });

            it('immediately takes effect', function(done) {
                loadPromise.then(function() {
                    expect(member.isLoading).toBe(false);
                    done();
                }).otherwise(done.fail);
            });

            it('triggers no disclaimerEvent', function() {
                expect(terria.disclaimerEvent.raiseEvent).not.toHaveBeenCalled();
            });
        });

        it('returns a promise that allows otherwise to be chained', function(done) {
            member._load = function() {
                return when.reject();
            };
            expect(true).toBe(true); // stop it whinging about no expectations.

            loadPromise = member.load().then(done.fail).otherwise(done);
        });
    });
});
