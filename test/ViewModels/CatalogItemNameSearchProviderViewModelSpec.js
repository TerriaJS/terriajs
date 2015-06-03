'use strict';

/*global require,describe,it,expect,beforeEach*/
var CatalogGroup = require('../../lib/Models/CatalogGroup');
var CatalogItem = require('../../lib/Models/CatalogItem');
var CatalogItemNameSearchProviderViewModel = require('../../lib/ViewModels/CatalogItemNameSearchProviderViewModel');
var inherit = require('../../lib/Core/inherit');
var runLater = require('../../lib/Core/runLater');
var Terria = require('../../lib/Models/Terria');

describe('CatalogItemNameSearchProviderViewModel', function() {
    var terria;
    var searchProvider;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });

        searchProvider = new CatalogItemNameSearchProviderViewModel({
            terria: terria
        });
    });

    it('finds catalog items in a case-insensitive manner', function(done) {
        var catalogGroup = terria.catalog.group;

        var item = new CatalogItem(terria);
        item.name = 'Thing to find';
        catalogGroup.add(item);

        searchProvider.search('thing').then(function() {
            expect(searchProvider.searchResults.length).toBe(1);
            expect(searchProvider.searchResults[0].name).toBe('Thing to find');
            done();
        });
    });


    it('finds catalog groups in a case-insensitive manner', function(done) {
        var catalogGroup = terria.catalog.group;

        var item = new CatalogGroup(terria);
        item.name = 'Group to find';
        catalogGroup.add(item);

        searchProvider.search('to').then(function() {
            expect(searchProvider.searchResults.length).toBe(1);
            expect(searchProvider.searchResults[0].name).toBe('Group to find');
            done();
        });
    });

    it('does not find catalog items if they do not match', function(done) {
        var catalogGroup = terria.catalog.group;

        var item = new CatalogItem(terria);
        item.name = 'Thing to find';
        catalogGroup.add(item);

        searchProvider.search('foo').then(function() {
            expect(searchProvider.searchResults.length).toBe(0);
            done();
        });
    });

    it('finds items in asynchronously-loaded groups', function(done) {
        var DelayedGroup = function() {
            CatalogGroup.call(this, terria);

            this.name = 'Delayed Group';
            this._load = function() {
                var that = this;
                return runLater(function() {
                    var item = new CatalogItem(terria);
                    item.name = 'Thing to find';
                    that.add(item);
                });
            };
        };
        inherit(CatalogGroup, DelayedGroup);

        terria.catalog.group.add(new DelayedGroup());
        searchProvider.search('thing').then(function() {
            expect(searchProvider.searchResults.length).toBe(1);
            expect(searchProvider.searchResults[0].name).toBe('Thing to find');
            done();
        });
    });

    it('stops searching after the specified number of items', function(done) {
        var catalogGroup = terria.catalog.group;

        var maxResults = 9;

        // Add items matching the query.
        for (var i = 0; i < maxResults; ++i) {
            var item = new CatalogItem(terria);
            item.name = 'Thing to find ' + i;
            catalogGroup.add(item);
        }

        // Add an 11th item that will flip out if asked to load.
        var FlipOutGroup = function() {
            CatalogGroup.call(this, terria);

            this.name = 'Flip Out Group';
            this._load = function() {
                done.fail('This item should not be asked to load.');
            };
        };
        inherit(CatalogGroup, FlipOutGroup);

        searchProvider.maxResults = maxResults;
        searchProvider.search('thing').then(function() {
            expect(searchProvider.searchResults.length).toBe(maxResults);
            done();
        });
    });
});