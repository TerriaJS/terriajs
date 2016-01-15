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
            AGE: "Age",
            ANCP: "Ancestry",
            BPLP: "Country of Birth", …
            "MEASURE" : {
                "Persons" : "Sex",
                "85 years and over" : "Age",
                "*" : "Measure"
            }
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
var URI = require('urijs');
var naturalSort = require('javascript-natural-sort');
naturalSort.insensitive = true;

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var objectToQuery = require('terriajs-cesium/Source/Core/objectToQuery');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var AbsCode = require('./AbsCode');
var AbsConcept = require('./AbsConcept');
var CsvCatalogItem = require('./CsvCatalogItem');
var inherit = require('../Core/inherit');
var ModelError = require('./ModelError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var TableDataSource = require('../Models/TableDataSource');

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
     * Gets or sets the ABS region-type concept used with the region code to set the region type.
     * Usually defaults to 'REGIONTYPE'.
     * This property is observable.
     * @type {String}
     */
    this.regionTypeConcept = undefined;

    /**
     * Gets or sets the ABS region concept. Defaults to 'REGION'.
     * This property is observable.
     * @type {String}
     */
    this.regionConcept = undefined;

    /**
     * Gets or sets the URL of a JSON file containing human-readable names of Australian Bureau of Statistics concept codes.
     * @type {String}
     */
    this.conceptNamesUrl = undefined;

    /**
     * Gets the list of initial concepts and codes on which to filter the data.  You can obtain a list of all available
     * concepts for a dataset by querying http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetConcepts&datasetid=ABS_CENSUS2011_B25
     * (or equivalent) and a list of the possible values for a concept by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B25&concept=MEASURE&format=json.
     * @type {Array}
     */
    this.filter = [];

    /**
     * Gets or sets the array of concept ids which should not be loaded.
     * Defaults to 'STATE', 'FREQUENCY' and the region concept (which defaults to 'REGION').
     * @type {[type]}
     */
    this.conceptsNotToLoad = undefined;

    // These contain raw downloaded data used during the loading process.
    this._conceptIds = undefined;
    this._conceptNamesMap = undefined;
    this._conceptCodes = [];

    // The array of AbsConcepts to display in the NowViewing panel.
    this._concepts = undefined;

    // TODO: can't have tableStyle or _absDataset here - they don't exist
    knockout.track(this, ['datasetId', 'regionTypeConcept', 'regionConcept', 'filter', 'tableStyle', '_absDataset', 'opacity', 'displayPercent', '_concepts']);

    overrideProperty(this, 'concepts', {
        get: function() {
            return this._concepts;
        }
    });

    knockout.defineProperty(this, 'dataSetID', {
        // TODO: remove getter. just to make sure I don't accidentally refer to dataSetID instead of datasetId.
        get: function() {
            throw new ModelError({sender: this, title: 'replace dataSetID with datasetId', message: 'Getter: Replace dataSetID with datasetId'});
        },
        set: function(value) {
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
    type: {
        get: function() {
            return 'abs-itt';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf AbsIttCatalogItem.prototype
     * @type {String}
     */
    typeName: {
        get: function() {
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

    // Set some defaults.
    this.conceptNamesUrl = defaultValue(this.conceptNamesUrl, 'data/abs_names.json');
    this.regionTypeConcept = defaultValue(this.regionTypeConcept, 'REGIONTYPE');
    this.regionConcept = defaultValue(this.regionConcept, this.datasetId === 'FILE' ? 'region_id' : 'REGION');
    this.conceptsNotToLoad = ['STATE', 'FREQUENCY', this.regionConcept];  // Nicer to make this an updateable parameter.

    var item = this;
    loadConceptIdsAndConceptNameMap(this).then(function() {
        loadConcepts(item);
    });
};

function throwGetCodeListValueError() {
    throw new ModelError({
        sender: that,
        title: 'Item is not available',
        message: '\
An error occurred while invoking GetCodeListValue on the ABS ITT server.  \
<p>This error may indicate that the item you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:' + that.terria.supportEmail + '">' + that.terria.supportEmail + '</a>.</p>'
    });
}

/**
 * Returns a promise which, when resolved, indicates that item._conceptIds and item._conceptNamesMap are loaded.
 *
 * @param  {AbsIttCatalogItem} item This catalog item.
 * @return {Promise} Promise which, when resolved, indicates that item._conceptIds and item._conceptNamesMap are loaded.
 */
function loadConceptIdsAndConceptNameMap(item) {
    var baseUrl = cleanAndProxyUrl(item, item.url);

    if (defined(item.data)) {
        // TODO: do we need to load abs itt from item.data?
        console.log('Yes, we need to load ABS ITT from item.data', item.data);
        return when();

    } else if (defined(item.url)) {

        console.log('loading ABS ITT from', item.url, '?');
        if (item.datasetId === 'FILE') {
            // TODO: do we need to handle this case?
            console.log('Yes, we need to handle datasetId == FILE');
        }

        var parameters = {
            method: 'GetDatasetConcepts',
            datasetid: item.datasetId,
            format: 'json'
        };
        var datasetConceptsUrl = baseUrl + '?' + objectToQuery(parameters);
        var loadDatasetConceptsPromise = loadJson(datasetConceptsUrl).then(function(json) {
            item._conceptIds = json.concepts;
        }).otherwise(throwGetCodeListValueError);
        var loadConceptNamesPromise = loadJson(item.conceptNamesUrl).then(function(json) {
            item._conceptNamesMap = json;
        });

        return when.all([loadConceptNamesPromise, loadDatasetConceptsPromise]);
        // item.concepts and item.conceptNameMap are now defined with the results.
    }
}

function absCodeUpdate() {
    console.log('absCodeUpdate called');
}

function buildConceptTree(filter, conceptCode, parent, codes) {
    // Use natural sort for fields with included ages or incomes.
    codes.sort(function(a, b) {
        return naturalSort(a.description.replace(',', ''), b.description.replace(',', ''));
    } );

    for (var i = 0; i < codes.length; ++i) {
        var parentCode = (parent instanceof AbsCode) ? parent.code : '';
        if (codes[i].parentCode === parentCode) {
            var absCode = new AbsCode(codes[i].code, codes[i].description);
            var codeFilter = conceptCode + '.' + absCode.code;
            if (filter.indexOf(codeFilter) !== -1) {
                absCode.isActive = true;
            }
            if (parentCode === '' && codes.length < 50) {
                absCode.isOpen = true;
            }
            absCode.parent = parent;
            absCode.updateFunction = absCodeUpdate;
            parent.items.push(absCode);
            buildConceptTree(filter, conceptCode, absCode, codes);
        }
    }
}

/**
 * Turn a concept id and its codes into an AbsConcept, which contains a tree of AbsCodes.
 * @param  {AbsIttCatalogItem} item The AbsIttCatalogItem instance.
 * @param  {String} conceptId The raw concept name, eg. 'ANCP'.
 * @param  {Object[]} codes The codes objects, eg. [{code: '01_02', description: 'Negative/Nil Income', parentCode: 'TOT', parentDescription: 'Total'}].
 * @return {AbsConcept} The new AbsConcept.
 */
function createAbsConcept(item, conceptId, codes) {
    var concept = new AbsConcept(conceptId);
    if (conceptId === item.regionTypeConcept) {
        // Can only select one region type at a time. All others, can select multiple.
        concept.isUnique = true;
    }
    // TODO: In the old code, there was something about codeGroups here - do we need it? (seems to be only when url = "FILE")
    buildConceptTree(item.filter, concept.code, concept, codes);
    // Give the concept its human-readable name.
    concept.name = getHumanReadableConceptName(item._conceptNamesMap, concept);
    console.log('built tree for', conceptId, concept);
    return concept;
}

/**
 * Loads concept codes.
 * As they are loaded, each is processed into a tree of AbsCodes under an AbsConcept.
 * Returns a promise which, when resolved, indicates that item._concepts is complete.
 *
 * @param  {AbsIttCatalogItem} item This catalog item.
 * @return {Promise} Promise.
 */
function loadConcepts(item) {
    var baseUrl = cleanAndProxyUrl(item, item.url);
    var absConcepts = [];

    var promises = item._conceptIds.filter(function(conceptId) {
        return (item.conceptsNotToLoad.indexOf(conceptId) === -1);
    }).map(function(conceptId) {
        var parameters = {
            method: 'GetCodeListValue',
            datasetid: item.datasetId,
            concept: conceptId,
            format: 'json'
        };
        var conceptCodesUrl = baseUrl + '?' + objectToQuery(parameters);
        console.log('now loading', conceptId, conceptCodesUrl);
        return loadJson(conceptCodesUrl).then(function(json) {
            absConcepts.push(createAbsConcept(item, conceptId, json.codes));
        });
    });
    return when.all(promises).then(function() {
        // All the AbsConcept objects have been created, we just need to order them correctly and save them.
        // Put the region type concept first.
        var makeFirst = item.regionTypeConcept;
        absConcepts.sort(function(a, b) {
            return (a.code === makeFirst) ? -1 : ((b.code === makeFirst) ? 1 : (a.name > b.name ? 1 : -1));
        });
        item._concepts = absConcepts;
    });
}





/**
 * Given a concept object with name and possibly items properties, return its human-readable version.
 *
 * @param  {Object} conceptNameMap An object whose keys are the concept.names, eg. "ANCP".
 *         Values may be Strings (eg. "Ancestry"), or
 *         a 'code map' (eg. "MEASURE" : {"Persons": "Sex", "85 years and over": "Age", "*": "Measure"}.
 * @param  {AbsConcept} concept An object with a name property and, if a codemap is to be used, an items array of objects with a name property.
 *         In that case, it finds the first of those names to appear as a key in the code map. The value of this property is returned. (Phew!)
 * @return {String} Human-readable concept name.
 */
function getHumanReadableConceptName(conceptNameMap, concept) {
    if (!defined(conceptNameMap[concept.name])) {
        return;
    }
    if (typeof conceptNameMap[concept.name] === 'string') {
        return conceptNameMap[concept.name];
    }
    else {
        var codeMap = conceptNameMap[concept.name];
        for (var j = 0; j < concept.items.length; j++) {
            if (defined(codeMap[concept.items[j].name])) {
                return codeMap[concept.items[j].name];
            }
        }
    }
}


// cleanAndProxyUrl appears in a few catalog items - we should split it into its own Core file.

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function cleanAndProxyUrl(catalogItem, url) {
    return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}



        // return loadText(proxyCatalogItemUrl(that, that.url)).then(function(text) {
        //     return loadTable(that, text);
        // }).otherwise(function(e) {
        //     throw new ModelError({
        //         sender: that,
        //         title: 'Unable to load CSV file',
        //         message: 'See the <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">csv-geo-au</a> specification for supported CSV formats.\n\n' + (e.message || e.response)
        //     });
        // });

module.exports = AbsIttCatalogItem;