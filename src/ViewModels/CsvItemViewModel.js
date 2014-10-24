'use strict';

/*global require,L,URI,Document*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var Color = require('../../third_party/cesium/Source/Core/Color');
var ColorMaterialProperty = require('../../third_party/cesium/Source/DataSources/ColorMaterialProperty');
var combine = require('../../third_party/cesium/Source/Core/combine');
var ConstantProperty = require('../../third_party/cesium/Source/DataSources/ConstantProperty');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var TableDataSource = require('../TableDataSource');

var corsProxy = require('../corsProxy');
var MetadataViewModel = require('./MetadataViewModel');
var MetadataItemViewModel = require('./MetadataItemViewModel');
var ViewModelError = require('./ViewModelError');
var CatalogItemViewModel = require('./CatalogItemViewModel');
var ImageryLayerItemViewModel = require('./ImageryLayerItemViewModel');
var inherit = require('../inherit');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');
var readText = require('../readText');
var runLater = require('../runLater');

/**
 * A {@link CatalogItemViewModel} representing CSV data.
 *
 * @alias CsvItemViewModel
 * @constructor
 * @extends CatalogItemViewModel
 * 
 * @param {ApplicationViewModel} context The context for the group.
 * @param {String} [url] The URL from which to retrieve the CSV data.
 */
var CsvItemViewModel = function(context, url) {
    CatalogItemViewModel.call(this, context);

    this._tableDataSource = undefined;

    /**
     * Gets or sets the URL from which to retrieve GeoJSON data.  This property is ignored if
     * {@link GeoJsonItemViewModel#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the CSV data, represented as a binary Blob, a string, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|String|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link CsvItemViewModel#data} was obtained.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    /**
     * Gets or sets a value indicating whether this data source is currently loading.  This property is observable.
     * @type {Boolean}
     */
    this.isLoading = false;

    knockout.track(this, ['url', 'data', 'dataSourceUrl', 'isLoading']);
};

CsvItemViewModel.prototype = inherit(CatalogItemViewModel.prototype);

defineProperties(CsvItemViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CsvItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'csv';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CSV'.
     * @memberOf CsvItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Comma-Separated Values (CSV)';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CsvItemViewModel.prototype
     * @type {MetadataViewModel}
     */
    metadata : {
        get : function() {
            var result = new MetadataViewModel();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

/**
 * Processes the CSV data supplied via the {@link CsvItemViewModel#data} property.  If
 * {@link CsvItemViewModel#data} is undefined, this method downloads CSV data from 
 * {@link CsvItemViewModel#url} and processes that.  It is safe to call this method multiple times.
 * It is called automatically when the data source is enabled.
 */
CsvItemViewModel.prototype.load = function() {
    if ((this.url === this._loadedUrl && this.data === this._loadedData) || this.isLoading === true) {
        return;
    }

    this.isLoading = true;

    if (defined(this._tableDataSource)) {
        this._tableDataSource.destroy();
    }

    this._tableDataSource = new TableDataSource();

    var that = this;
    runLater(function() {
        that._loadedUrl = that.url;
        that._loadedData = that.data;

        if (defined(that.data)) {
            when(that.data, function(data) {
                if (data instanceof Blob) {
                    readText(data).then(function(text) {
                        loadTable(that, text);
                    });
                } else if (data instanceof String) {
                    loadTable(that, data);
                } else {
                    that.context.error.raiseEvent(new ViewModelError({
                        sender: that,
                        title: 'Unexpected type of CSV data',
                        message: '\
    CsvItemViewModel.data is expected to be a Blob, File, or String, but it was not any of these. \
    This may indicate a bug in National Map or incorrect use of the National Map API. \
    If you believe it is a bug in National Map, please report it by emailing \
    <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
                    }));
                }
            }).otherwise(function() {
                that.isLoading = false;
            });
        } else if (defined(that.url)) {
            loadText(proxyUrl(that, that.url)).then(function(text) {
                loadTable(that, text);
            }).otherwise(function(e) {
                that.isLoading = false;
                that.context.error.raiseEvent(new GeoDataCatalogError({
                    sender: that,
                    title: 'Could not load CSV file',
                    message: '\
An error occurred while retrieving CSV data from the provided link.'
                }));
                that.isEnabled = false;
                that._loadedUrl = undefined;
                that._loadedData = undefined;
            });
        }
    });
};

CsvItemViewModel.prototype._enableInCesium = function() {
};

CsvItemViewModel.prototype._disableInCesium = function() {
};

CsvItemViewModel.prototype._showInCesium = function() {
    //TODO: add wms stuff for region layer
    var dataSources = this.context.dataSources;
    if (dataSources.contains(this._tableDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._tableDataSource);
};

CsvItemViewModel.prototype._hideInCesium = function() {
    //TODO: add wms stuff for region layer
    var dataSources = this.context.dataSources;
    if (!dataSources.contains(this._tableDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._tableDataSource, false);
};

CsvItemViewModel.prototype._enableInLeaflet = function() {
};

CsvItemViewModel.prototype._disableInLeaflet = function() {
};

CsvItemViewModel.prototype._showInLeaflet = function() {
    //TODO: add wms stuff for region layer
    this._showInCesium();
};

CsvItemViewModel.prototype._hideInLeaflet = function() {
    //TODO: add wms stuff for region layer
    this._hideInCesium();
};

function proxyUrl(context, url) {
    if (defined(context.corsProxy) && context.corsProxy.shouldUseProxy(url)) {
        return context.corsProxy.getURL(url);
    }

    return url;
}



//////////////////////////////////////////////////////////////////////////

function loadTable(viewModel, text) {
    viewModel._tableDataSource.loadText(text);

    if (!viewModel._tableDataSource.dataset.hasLocationData()) {
        console.log('No locaton date found in csv file - trying to match based on region');
        addRegionMap(that);
    }
    else {
        viewModel.clock = that._tableDataSource.clock;
        viewModel.rectangle = that._tableDataSource.dataset.getExtent();

        viewModel.isLoading = false;
    }
}


//////////////////////////////////////////////////////////////////////////

//Recolor an image using a color function
function recolorImage(image, colorFunc) {
    var length = image.data.length;  //pixel count * 4
    for (var i = 0; i < length; i += 4) {
        if (image.data[i+3] < 255) {
            continue;
        }
        if (image.data[i] === 0) {
            var idx = image.data[i+1] * 0x100 + image.data[i+2];
            var clr = colorFunc(idx);
            if (defined(clr)) {
                for (var j = 0; j < 4; j++) {
                    image.data[i+j] = clr[j];
                }
            }
            else {
                image.data[i+3] = 0;
            }
        }
    }
    return image;
}

//Recolor an image using 2d canvas
function recolorImageWithCanvas(img, colorFunc) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    var image = context.getImageData(0, 0, canvas.width, canvas.height);
    
    image = recolorImage(image, colorFunc);
    
    context.putImageData(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
}


var regionServer = 'http://geoserver.research.nicta.com.au/region_map/ows';
var regionWmsMap = {
    'STE': {
        "Name":"region_map:FID_STE_2011_AUST",
        "regionProp": "STE_CODE11",
        "aliases": ['state', 'ste']
    },
    'CED': {
        "Name":"region_map:FID_CED_2011_AUST",
        "regionProp": "CED_CODE",
        "aliases": ['ced']
    },
    'SED': {
        "Name":"region_map:FID_SED_2011_AUST",
        "regionProp": "SED_CODE",
        "aliases": ['sed']
    },
    'POA': {
        "Name":"region_map:FID_POA_2011_AUST",
        "regionProp": "POA_CODE",
        "aliases": ['poa', 'postcode']
    },
    'LGA': {
        "Name":"region_map:FID_LGA_2011_AUST",
        "regionProp": "LGA_CODE11",
        "aliases": ['lga']
    },
    'SCC': {
        "Name":"region_map:FID_SCC_2011_AUST",
        "regionProp": "SCC_CODE",
        "aliases": ['scc', 'suburb']
    },
    'SA4': {
        "Name":"region_map:FID_SA4_2011_AUST",
        "regionProp": "SA4_CODE11",
        "aliases": ['sa4']
    },
    'SA3': {
        "Name":"region_map:FID_SA3_2011_AUST",
        "regionProp": "SA3_CODE11",
        "aliases": ['sa3']
    },
    'SA2': {
        "Name":"region_map:FID_SA2_2011_AUST",
        "regionProp": "SA2_MAIN11",
        "aliases": ['sa2']
    },
    'SA1': {
        "Name":"region_map:FID_SA1_2011_AUST",
         "regionProp": "SA1_7DIG11",
        "aliases": ['sa1']
    }
};

//TODO: if we add enum capability and then can work with any unique field
//TODO: need way to support a progress display on slow loads
function loadRegionIDs(description, succeed, fail) {
    var url = regionServer + '?service=wfs&version=2.0&request=getPropertyValue';
    url += '&typeNames=' + description.Name;
    url += '&valueReference=' + description.regionProp;
    loadText(url).then(function (text) { 
        var obj = $.xml2json(text);

        if (!defined(obj.member)) {
            return;
        }

        var idMap = [];
            //for now this turns ids into numbers since they are that way in table data
            //btw: since javascript uses doubles this is not a problem for the numerical ids
        for (var i = 0; i < obj.member.length; i++) {
            idMap.push(parseInt(obj.member[i][description.regionProp],10));
        }
        description.idMap = idMap;
        succeed();
    }, function(err) {
        loadErrorResponse(err);
        fail();
    });
}

function determineRegionVar(vars, aliases) {
    for (var i = 0; i < vars.length; i++) {
        var varName = vars[i].toLowerCase();
        for (var j = 0; j < aliases.length; j++) {
            if (varName.substring(0,aliases[j].length) === aliases[j]) {
                return i;
            }
        }
    }
    return -1;
}

function createRegionLookupFunc(viewModel) {
    if (!defined(viewModel) || !defined(viewModel._cesiumDataSource) || !defined(viewModel._cesiumDataSource.dataset)) {
        return;
    }
    var dataSource = viewModel._cesiumDataSource;
    var dataset = dataSource.dataset;
    var vars = dataset.getVarList();
    var description = regionWmsMap[viewModel.regionType];
 
    var codes = dataset.getDataValues(viewModel.regionVar);
    var ids = description.idMap;
    var vals = dataset.getDataValues(dataset.getCurrentVariable());
    var lookup = new Array(ids.length);
    for (var i = 0; i < codes.length; i++) {
        var id = ids.indexOf(codes[i]);
        lookup[id] = vals[i];
    }
    // set color for each code
    var colors = [];
    for (var idx = dataset.getMinVal(); idx <= dataset.getMaxVal(); idx++) {
        colors[idx] = dataSource._mapValue2Color(idx);
    }
    //   create colorFunc used by the region mapper
    viewModel.colorFunc = function(id) {
        return colors[lookup[id]];
    };
    // can be used to get point data
    viewModel.valFunc = function(code) {
        var rowIndex = codes.indexOf(code);
        return vals[rowIndex];
    };
    viewModel.rowProperties = function(code) {
        var rowIndex = codes.indexOf(code);
        return dataset.getDataRow(rowIndex);
    };
};

function setRegionVariable(viewModel, regionVar, regionType) {
    if (viewModel.regionVar === regionVar && viewModel.regionType === regionType) {
        return;
    }

    viewModel.regionVar = regionVar;
    var description = regionWmsMap[regionType];
    if (viewModel.regionType !== regionType) {
            //TODO: set these params correctly
        viewModel.regionType = regionType;
        description.type = 'WMS';
        description.base_url = regionServer;

        viewModel.url = getOGCFeatureURL(description);  //TODO: figure out where this lives
        viewModel.regionProp = description.regionProp;
    }
    console.log('Region type:', viewModel.regionType, ', Region var:', viewModel.regionVar);
        
    var succeed = function() {
         createRegionLookupFunc(viewModel);

        //TODO: need to remove layer and start from scratch with new tiles

        //that._viewMap(layer.url, layer);  can finally enable map

        viewModel.isLoading = false;
    };
    var fail = function () {
        console.log('failed to load region ids from server');
    };

    if (!defined(description.idMap)) {
        loadRegionIDs(description, succeed, fail);
    }
    else {
        succeed();
    }
};

function setRegionDataVariable(viewModel, newVar) {
    if (!(viewModel._cesiumDataSource instanceof TableDataSource)) {
        return;
    }

    var dataSource = viewModel._cesiumDataSource;
    var dataset = dataSource.dataset;
    if (dataset.getCurrentVariable() === newVar) {
        return;
    }
    dataset.setCurrentVariable({ variable: newVar}); 
    createRegionLookupFunc(viewModel);
    
    console.log('Var set to:', newVar);

    //TODO: figure out how to flush wms layer and redraw
};

function setRegionColorMap(viewModel, dataColorMap) {
     if (!(viewModel._cesiumDataSource instanceof TableDataSource)) {
        return;
    }

    viewModel._cesiumDataSource.setColorGradient(dataColorMap);
    createRegionLookupFunc(viewModel);

    //TODO: figure out how to flush wms layer and redraw

};

function addRegionMap(viewModel) {
    if (!(viewModel._cesiumDataSource instanceof TableDataSource) || !defined(viewModel._readyData)) {
        return;
    }
    //see if we can do region mapping
    var dataSource = viewModel._cesiumDataSource;
    var dataset = dataSource.dataset;
    var vars = dataset.getVarList();

    //if viewModel includes style/var info then use that
    if (!defined(viewModel.style) || !defined(viewModel.style.table)) {
        var regionType;
        var idx = -1;
        for (regionType in regionWmsMap) {
            if (regionWmsMap.hasOwnProperty(regionType)) {
                idx = determineRegionVar(vars, regionWmsMap[regionType].aliases);
                if (idx !== -1) {
                    break;
                }
            }
        }
        
        if (idx === -1) {
            return;
        }

            //change current var if necessary
        var dataVar = dataset.getCurrentVariable();
        if (dataVar === vars[idx]) {
            dataVar = vars[idx+1];
        }
        
        var style = {line: {}, point: {}, polygon: {}, table: {}};
        style.table.lat = undefined;
        style.table.lon = undefined;
        style.table.alt = undefined;
        style.table.region = vars[idx];
        style.table.regionType = regionType;
        style.table.time = dataset.getVarID(VarType.TIME);
        style.table.data = dataVar;
        style.table.colorMap = [
            {offset: 0.0, color: 'rgba(200,0,0,1.00)'},
            {offset: 0.5, color: 'rgba(200,200,200,1.0)'},
            {offset: 0.5, color: 'rgba(200,200,200,1.0)'},
            {offset: 1.0, color: 'rgba(0,0,200,1.0)'}
        ];
        viewModel.style = style;
    }

    if (defined(viewModel.style.table.colorMap)) {
        dataSource.setColorGradient(viewModel.style.table.colorMap);
    }
    dataSource.setCurrentVariable(viewModel.style.table.data);
    
    //TODO: figure out how sharing works or doesn't
    
    setRegionVariable(viewModel, viewModel.style.table.region, viewModel.style.table.regionType);
};



module.exports = CsvItemViewModel;
