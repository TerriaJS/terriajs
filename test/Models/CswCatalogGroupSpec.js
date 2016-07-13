'use strict';

/*global require,describe,it,expect*/
var CswCatalogGroup = require('../../lib/Models/CswCatalogGroup');

describe('CswCatalogGroup', function() {
    it('function findLevel is able to sort a hierarchy correctly', function() {
        var metadataGroups = [];

        var keyList = [["Multiple Use", "National"],
                       ["Multiple Use", "Western Australia"],
                       ["Wave Models", "Direction of Maximum Directionally Resolved Wave Power", "Averages"],
                       ["Wave Models", "Maximum Directionally Resolved Wave Power", "Averages"]];
        for (var i=0; i<keyList.length; i++) {
            var keys = keyList[i];
            CswCatalogGroup._findLevel(keys, 0, metadataGroups, " | ", "subject");
        }

        var expectedObj = [
           {
              field: "subject",
              value: "^Multiple Use\\ \\|\\ ",
              regex: true,
              group: "Multiple Use",
              children:[
                 {
                    field: "subject",
                    value: "Multiple Use | National",
                    regex: false,
                    group: "National"
                 },
                 {
                    field: "subject",
                    value: "Multiple Use | Western Australia",
                    regex: false,
                    group: "Western Australia"
                 }
              ]
           },
           {
              field: "subject",
              value: "^Wave Models\\ \\|\\ ",
              regex: true,
              group: "Wave Models",
              children:[
                 {
                    field: "subject",
                    value: "^Wave Models\\ \\|\\ Direction of Maximum Directionally Resolved Wave Power\\ \\|\\ ",
                    regex: true,
                    group: "Direction of Maximum Directionally Resolved Wave Power",
                    children: [
                       {
                          field: "subject",
                          value: "Wave Models | Direction of Maximum Directionally Resolved Wave Power | Averages",
                          regex: false,
                          group: "Averages"
                       }
                    ]
                 },
                 {
                    field: "subject",
                    value: "^Wave Models\\ \\|\\ Maximum Directionally Resolved Wave Power\\ \\|\\ ",
                    regex: true,
                    group: "Maximum Directionally Resolved Wave Power",
                    children: [
                       {
                          field: "subject",
                          value: "Wave Models | Maximum Directionally Resolved Wave Power | Averages",
                          regex: false,
                          group: "Averages"
                       }
                    ]
                 }
              ]
           }
        ];
        // If you're trying to debug this, run it through a json formatter. Then the structure becomes clear.
        var strActual = JSON.stringify(metadataGroups);
        var strExpected = JSON.stringify(expectedObj);
        expect(strActual).toEqual(strExpected);
    });
});
