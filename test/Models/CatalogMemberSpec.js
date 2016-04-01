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
        beforeEach(function() {
            spyOn(terria, 'disclaimerListener');
            member._load = function() {
               return when.resolve(); // make the implementation-specific _load method return instantly, it's not on trial here.
            };
        });

        it('alters isLoading', function(done) {
            member.load().then(function() {
                expect(member.isLoading).toBe(false);
                done();
            }).otherwise(done.fail);
        });

        it('returns a promise that allows otherwise to be chained', function(done) {
            member._load = function() {
                return when.reject();
            };
            expect(true).toBe(true); // stop it whinging about no expectations.

            member.load().then(done.fail).otherwise(done);
        });
    });
});
