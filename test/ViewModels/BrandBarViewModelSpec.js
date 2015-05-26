'use strict';

/*global require,describe,it,expect,beforeEach,afterEach*/
var BrandBarViewModel = require('../../lib/ViewModels/BrandBarViewModel');
var Terria = require('../../lib/Models/Terria');

describe('BrandBarViewModel', function() {
    var terria;
    var brandBar;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
    });

    afterEach(function() {
        brandBar.destroy();
        brandBar = undefined;
    });

    it('to allow no elements', function() {
        brandBar = new BrandBarViewModel({
            terria: terria
        });
        expect(brandBar.elements.length).toBe(0);
    });


    it('to add elements from options', function() {
        brandBar = new BrandBarViewModel({
            terria: terria,
            elements: ['<p>Mine</p>', '<p>Theirs</p>']
        });
        expect(brandBar.elements.length).toBe(2);
    });

});
