'use strict';

/*
    The ABS ITT format available at http://stat.abs.gov.au/itt/query.jsp provides the following methods:
        method=GetDatasetConcepts & datasetid=...               & format=json
        method=GetCodeListValue   & datasetid=... & concept=... & format=json
        method=GetGenericData     & datasetid=... & and=<CONCEPT_NAME>.<CONCEPT_VALUE>,<CONCEPT2_NAME>.<CONCEPT2_VALUE>,... & or=REGION & format=csv

    GetDatasetConcepts gives us the available concepts to use in GetCodeListValue.
    However, we should ignore STATE, FREQUENCY, and whatever the regionConcept is (defaults to "REGION", or "region_id" if datasetId=="FILE").

    GetCodeListValue gives us the list of the possible values for a concept, which may be in a tree.

    E.g. Here are the URLs requested for the 'Age' catalog item:

    non-FILE
    http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetConcepts&datasetid=ABS_CENSUS2011_B04&format=json
        {
            concepts: ["FREQUENCY", "STATE", "AGE", "REGIONTYPE", "MEASURE", "REGION"],
            copyright: "ABS (c) copyright Commonwealth of Australia 2016. Retrieved on 15/01/2016 at 9:24"
        }

    via loadFunc
    http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B04&concept=AGE&format=json
    http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B04&concept=REGIONTYPE&format=json
    http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B04&concept=MEASURE&format=json

        {
            codes: Array[102],
            copyright: "ABS (c) copyright Commonwealth of Australia 2015. Retrieved on 29/06/2015 at 15:53"
        }

        For AGE, codes is an Array[102] like:
        {
            code: "0" / "1" / "2" / "3" / "4" / etc
            description: "0" / "1" / "2" / "3" / "4"
            parentCode: "A04"
            parentDescription: "0-4 years"
        },
        {
            code: "TT",
            description: "Total all ages",
            parentCode: "",
            parentDescription: ""
        },
        {
            code: "A04" / "A59" / etc
            description: "0-4 years" / "5-9 years"
            parentCode: ""
            parentDescription: ""
        }

        For REGIONTYPE, codes is an Array[5] of:
        {
            code: "AUS" / "STE" / "SA2" / "SA3" / "SA4"
            description: "Australia" / "States and Territories" / etc
            parentCode: ""
            parentDescription: ""
        }

        For MEASURE, codes is an Array[3] of:
        {
            code: "2" / "1" / "3"
            description: "Females" / "Males" / "Persons"
            parentCode: "3"
            parentDescription: "Persons"
        }

    http://stat.abs.gov.au/itt/query.jsp?method=GetGenericData&datasetid=ABS_CENSUS2011_B04&and=REGIONTYPE.SA4%2CAGE.A04%2CMEASURE.3&or=REGION&format=csv
    http://stat.abs.gov.au/itt/query.jsp?method=GetGenericData&datasetid=ABS_CENSUS2011_B04&and=REGIONTYPE.SA4%2CAGE.A59%2CMEASURE.3&or=REGION&format=csv
    http://stat.abs.gov.au/itt/query.jsp?method=GetGenericData&datasetid=ABS_CENSUS2011_B04&and=REGIONTYPE.SA4%2CAGE.A10%2CMEASURE.3&or=REGION&format=csv
    http://stat.abs.gov.au/itt/query.jsp?method=GetGenericData&datasetid=ABS_CENSUS2011_B04&and=REGIONTYPE.SA4%2CAGE.A15%2CMEASURE.3&or=REGION&format=csv

    The first is a csv file with 107 lines, eg.
    Time    Value   REGION  Description
    2011    12005   101 Capital Region
    2011    19003   102 Central Coast
    2011    13009   103 Central West
    ...

    We also provide the file data/abs_names.json for human-readable names:
        {
            AGE: "Age", ANCP: "Ancestry", BPLP: "Country of Birth", BPPP: "Birthplace of Parents", FPENG: "Proficiency in English/Female Parent" …
        }

    To convert the csv file above into a table consistent with the csv-geo-au format, we would want, for each region type:
    sa1_code_2011 Description "Region Percentage" "0-4 years Males"  -- adding a column for each selected age.

        with Description and "Region Percentage" not shown in the Now Viewing,
        and the selected ages shown in a different way to normal csvs:
        - potentially in a tree
        - with the ability to select more than one
        - with ages shown that are not in the csv yet, but could be added.

 */


/*global require*/
var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var CsvCatalogItem = require('./CsvCatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var readText = require('../Core/readText');
var TableDataSource = require('../Models/TableDataSource');
var TableStyle = require('../Models/TableStyle');

/**
 * A {@link CatalogItem} representing region-mapped data obtained from the Australia Bureau of Statistics
 * (ABS) ITT query interface.  Documentation for the query interface is found here: http://stat.abs.gov.au/itt/r.jsp?api
 *
 * @alias AbsIttCatalogItem
 * @constructor
 * @extends CsvCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The base URL from which to retrieve the data.
 */
var AbsIttCatalogItem = function(terria, url) {
    CsvCatalogItem.call(this, terria, url);

    /**
     * Gets or sets the ID of the ABS dataset.  You can obtain a list of all datasets by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetList (or equivalent).  This property
     * is observable.
     * @type {String}
     */
    this.datasetId = undefined;

    /**
     * Gets or sets whether to show percentages or raw values.  This property is observable.
     * @type {Boolean}
     * @default true
     */
    this.displayPercent = true;

    /**
     * Gets or sets the ABS region-type concept used with the region code to set the region type, eg. 'REGIONTYPE'.
     * This property is observable.
     * @type {String}
     */
    this.regionTypeConcept = undefined;

    /**
     * Gets or sets the ABS region concept, eg. 'REGION'.
     * This property is observable.
     * @type {String}
     */
    this.regionConcept = undefined;

    // TODO: can't have filter, tableStyle or _absDataset here - they don't exist
    knockout.track(this, ['datasetId', 'regionTypeConcept', 'regionConcept', 'filter', 'tableStyle', '_absDataset', 'opacity', 'displayPercent']);

    overrideProperty(this, 'concepts', {
        get: function() {
            if (defined(this._dataSource) && defined(this._dataSource.tableStructure)) {
                return [this._dataSource.tableStructure];
            } else {
                return [];
            }
        }
    });

    knockout.defineProperty(this, 'dataSetID', {
        // TODO: remove getter. just to make sure I don't accidentally refer to dataSetID instead of datasetId.
        get : function() {
            throw new ModelError({sender: this, title: 'replace dataSetID with datasetId', message: 'Getter: Replace dataSetID with datasetId'});
        },
        set : function(value) {
            deprecationWarning('dataSetID', 'dataSetID is deprecated.  Please use datasetId instead');
            this.datasetId = value;
        }
    });

};

inherit(CsvCatalogItem, AbsIttCatalogItem);

defineProperties(AbsIttCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf AbsIttCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'abs-itt';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf AbsIttCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'ABS.Stat';
        }
    }
});


function loadTable(csvItem, text) {
    var dataSource = csvItem._dataSource;
    dataSource.load(text, csvItem._tableStyle);
}


AbsIttCatalogItem.prototype._load = function() {

    if (defined(this._dataSource)) {
        this._dataSource.destroy();
    }

    this._dataSource = new TableDataSource(this);

    var that = this;

    if (defined(this.data)) {
        // TODO: do we need to load abs itt from this.data?
        console.log('Yes, we need to load abs itt from this.data', this.data);
    } else if (defined(that.url)) {

        console.log('loading abs itt from', that.url, '?');

        // return loadText(proxyCatalogItemUrl(that, that.url)).then(function(text) {
        //     return loadTable(that, text);
        // }).otherwise(function(e) {
        //     throw new ModelError({
        //         sender: that,
        //         title: 'Unable to load CSV file',
        //         message: 'See the <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">csv-geo-au</a> specification for supported CSV formats.\n\n' + (e.message || e.response)
        //     });
        // });
    }
};

module.exports = AbsIttCatalogItem;