'use strict';

/*global require,describe,it,expect*/
var UserDrawing = require('../../lib/Map/UserDrawing');
var Terria = require('../../lib/Models/Terria');

describe('UserDrawing', function() {
    var terria;

    beforeEach(function () {
        terria = new Terria({
            baseUrl: './'
        });
    });

    it('will use default options if options are not specified', function() {
        var userDrawing = new UserDrawing(terria);

        expect(userDrawing._getDialogMessage()).toEqual("<strong>Draw on Map</strong></br><i>Click to add a point</i>");
    });
});
