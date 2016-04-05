'use strict';

/*global require*/
var CatalogMember = require('../../lib/Models/CatalogMember');
var Terria = require('../../lib/Models/Terria');
var when = require('terriajs-cesium/Source/ThirdParty/when');

describe('CatalogMember', function() {
    var terria;
    var member;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        member = new CatalogMember(terria);
    });

    describe('infoWithoutSources', function() {
        var info;

        beforeEach(function() {
            info = [{
                name: 'Info1'
            }, {
                name: 'Info2'
            }];

            member.info = info.slice();
        });

        it('filters out info items that have been marked as having source info in them', function() {
            member._sourceInfoItemNames = ['Info1'];
            expect(member.infoWithoutSources).toEqual([info[1]]);
        });

        it('returns the same as member.info if no source info items exist', function() {
            expect(member.infoWithoutSources).toEqual(info);
        });
    });
});
