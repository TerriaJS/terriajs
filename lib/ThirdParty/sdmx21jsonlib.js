// Modified version the below library to suit SDMX JSON v2.1

//   sdmxjsonlib.js 0.5.2
//   http://github.com/airosa/sdmxjsonlib
//   (c) 2013-2014 Sami Airo
//   sdmxjsonlib.js may be freely distributed under the MIT license

// Minor modification to the start and end of this file to use module.exports.
// Also, the Request module section has been commented out, since we don't use it.

"use strict";

var lib = {
  request: {},
  response: {}
};

lib.version = "0.5.2";

var KEY_SEPARATOR = ":";
// var DEFAULT_PROTOCOL = 'https:';
var TIME_DIMENSION = "TIME_PERIOD";
var TIME_ROLE = "time";
// var DATA_RESOURCE = 'data';
// var STRUCTURE_RESOURCE = 'structure';

//==============================================================================

// Request module
// ==============

// URL object for creating SDMX RESTful API data requests
//
// var req = new request.URL();
// req.hostname = 'a-sdw-wsrest.ecb.europa.eu';
// req.path.pathname = 'service';
// req.path.dataFlow.id = 'EXR';
// req.path.dataFlow.key = [ 'M', [ 'USD', 'JPY' ], 'EUR', 'SP00', 'A' ];
// req.query.startPeriod = '2014';
// console.log(req.href());

// lib.request.URL = (function () {
//     function URL() {
//         this.protocol = DEFAULT_PROTOCOL;

//         this.credentials = {
//             login: null,
//             password: null
//         };

//         this.hostname = null;
//         this.port = null;

//         this.path = {
//             pathname: null,
//             resource: DATA_RESOURCE,
//             dataFlow: {
//                 agencyId: null,
//                 id: null,
//                 version: null
//             },
//             key: [],
//             dataProvider: {
//                 agencyId: null,
//                 id: null
//             },
//             agencyId: null,
//             resourceId: null,
//             version: null
//         };

//         this.query = {
//             startPeriod: null,
//             endPeriod: null,
//             firstNObservations: null,
//             lastNObservations: null,
//             dimensionAtObservation: null,
//             updatedAfter: null,
//             detail: null,
//             references: null
//         };
//     }

//     URL.prototype.href = function () {
//         var pushIfDefined = function (array, value, prefix, postfix) {
//             if ((value !== undefined) && (value !== null) && (value !== '')) {
//                 var finalValue = value;
//                 if ((prefix !== undefined) && (prefix !== null)) {
//                     finalValue = prefix + finalValue;
//                 }
//                 if ((postfix !== undefined) && (postfix !== null)) {
//                     finalValue = finalValue + postfix;
//                 }
//                 array.push(finalValue);
//             }
//         };

//         var url = [];

//         pushIfDefined( url, this.protocol, null, '//');
//         pushIfDefined( url, this.credentials.login );
//         pushIfDefined( url, this.credentials.password, ':' );
//         pushIfDefined( url, this.hostname );
//         pushIfDefined( url, this.port, ':' );
//         pushIfDefined( url, this.path.pathname, '/' );
//         pushIfDefined( url, this.path.resource, '/' );

//         if (this.path.resource === DATA_RESOURCE) {
//             var df = [];
//             pushIfDefined( df, this.path.dataFlow.agencyId );
//             pushIfDefined( df, this.path.dataFlow.id );
//             pushIfDefined( df, this.path.dataFlow.version );
//             pushIfDefined( url, df.join(','), '/' );

//             var key = this.path.key.map( function (k) {
//                 if (k === null) return '';
//                 if (k.join !== undefined) {
//                     return k.join('+');
//                 }
//                 return k;
//             });
//             pushIfDefined( url, key.join('.'), '/' );

//             var dp = [];
//             pushIfDefined( dp, this.path.dataProvider.agencyId );
//             pushIfDefined( dp, this.path.dataProvider.id );
//             pushIfDefined( url, dp.join(','), '/' );
//         }

//         if (this.path.resource !== DATA_RESOURCE) {
//             pushIfDefined( url, this.path.agencyId, '/' );
//             pushIfDefined( url, this.path.resourceId, '/' );
//             pushIfDefined( url, this.path.version, '/' );
//         }

//         var params = [];
//         for (var name in this.query) {
//             if ((this.query[name] !== undefined) && (this.query[name] !== null)) {
//                 params.push( name + '=' + this.query[name] );
//             }
//         }
//         pushIfDefined( url, params.join('&'), '?' );

//         return url.join('');
//     };

//     return URL;

// })();

//==============================================================================

// Response module
// ===============

// Calculates the number of observations in the response (either groupped or flat)
lib.response.obsCount = function(msg) {
  var dsObsCount = function(count, ds) {
    if (typeof ds.observations === "object" && ds.observations !== null) {
      return count + Object.keys(ds.observations).length;
    }

    var seriesObsCount = function(count, key) {
      if (
        ds.series[key].observations !== undefined &&
        ds.series[key].observations !== undefined
      ) {
        return count + Object.keys(ds.series[key].observations).length;
      }

      return count;
    };

    if (ds.series !== undefined && ds.series !== null) {
      return count + Object.keys(ds.series).reduce(seriesObsCount, 0);
    }

    return count;
  };

  return msg.data.dataSets.reduce(dsObsCount, 0);
};

//------------------------------------------------------------------------------

// Maps dimensions and attributes. Order is as follows:
// dimensions.dataSet, dimensions.series, dimensions.observation,
// attributes.dataSet, attributes.series, attributes.observation
lib.response._mapComponents = function(msg, iterator, ignoreDatasetLevel) {
  if (ignoreDatasetLevel === undefined || ignoreDatasetLevel === null) {
    ignoreDatasetLevel = false;
  }

  ["dimensions", "attributes"].forEach(function(type) {
    if (
      msg.data.structure[type] === undefined ||
      msg.data.structure[type] === null
    )
      return;

    ["dataSet", "series", "observation"].forEach(function(level) {
      if (level === "dataSet" && ignoreDatasetLevel) return;

      if (
        msg.data.structure[type][level] === undefined ||
        msg.data.structure[type][level] === null
      )
        return;

      msg.data.structure[type][level].forEach(function(c) {
        iterator(c, type, level);
      });
    });
  });
};

// maps dimensions and attributes into an array.
lib.response.mapComponentsToArray = function(
  msg,
  iterator,
  ignoreDatasetLevel,
  context
) {
  var results = [];

  if (msg === undefined || msg === null) return results;

  if (iterator === undefined || iterator === null) {
    iterator = lib.response.identity;
  }

  var iter = function(c, type, level) {
    return results.push(iterator.call(context, c, type, level));
  };

  lib.response._mapComponents(msg, iter, ignoreDatasetLevel);

  return results;
};

// Maps dimensions and attributes in to an object using the _propertyName
// as the key
lib.response.mapComponentsToObject = function(
  msg,
  iterator,
  ignoreDatasetLevel,
  context
) {
  var results = {};

  if (msg === undefined || msg === null) return results;

  if (iterator === undefined || iterator === null) {
    iterator = lib.response.identity;
  }

  var citer = function(c, type, level) {
    results[c._propertyName] = iterator.call(context, c, type, level);
  };

  lib.response._mapComponents(msg, citer, ignoreDatasetLevel);

  return results;
};

//------------------------------------------------------------------------------

// Maps all datasets in the response message to a single array.
lib.response.mapDataSetsToArray = function(
  msg,
  ignoreDatasetLevel,
  iterator,
  context
) {
  var results = [];

  if (msg === undefined || msg === null) return results;

  if (ignoreDatasetLevel === undefined || ignoreDatasetLevel === null) {
    ignoreDatasetLevel = false;
  }

  if (iterator === undefined || iterator === null) {
    iterator = lib.response.obsToStructureSpecific;
  }

  var dims = msg.data.structure.dimensions;
  var attrs = msg.data.structure.attributes;
  var dimCount =
    dims.dataSet.length + dims.series.length + dims.observation.length;
  var dsDimIdx = [],
    dsDimVals = [],
    dsAttrIdx = [],
    dsAttrVals = [];
  var allDims = [].concat(dims.series, dims.observation);
  var allAttrs = [].concat(attrs.series, attrs.observation);
  var seriesKey = new Array(dimCount);
  var obsKey = new Array(dimCount);

  // Returns the position of the dimension in the series/obs key
  var dimPosition = function(d) {
    // return keyPosition if defined
    if (d.keyPosition !== undefined && d.keyPosition !== null)
      return d.keyPosition;
    // check if the dimension is the time dimension. Add it to the end of the key
    if (d.id === TIME_DIMENSION) return dimCount - 1;
    return null;
  };

  // Updates the obsKey array of dimension ids e.g. [ 'M', 'FI', 'P' ]
  // with observation level dimension values.
  // Gets the dimension value index and dimension index as arguments
  var updateObsKey = function(dvi, di) {
    var dim = msg.data.structure.dimensions.observation[di];
    // Calculate the key position for the dimension index
    var pos = dimPosition(dim);
    // Update the obskey with the dimension value
    obsKey[pos] = dim.values[dvi].id;
  };

  // Process observations object and call the iterator function for each
  // observation. Works for both dataset and series level observations.
  // Updates the results array.
  var processObservations = function(observations, seriesKey, dimIdx, attrIdx) {
    if (observations === undefined || observations === null) return;

    // process each observation in object.
    for (var key in observations) {
      // convert key from string to an array of numbers
      var obsDimIdx = key.split(KEY_SEPARATOR).map(Number);
      obsDimIdx.forEach(updateObsKey);

      var value = observations[key];
      if (value === null) continue;

      results.push(
        iterator.call(
          context,
          // String of dimension id values e.g. 'M.FI.P.2000'
          obsKey.join(KEY_SEPARATOR),
          // Same as obsKey but without obs level dims
          seriesKey,
          // observation value
          value[0],
          // Array of dimension indices e.g. [ 0, 4, 5, 18 ]
          dimIdx.concat(obsDimIdx),
          // Array of attribute indices e.g. [ 1, 92, 27 ]
          attrIdx.concat(value.slice(1)),
          // Array of dimension objects
          allDims,
          // Array of attribute objects
          allAttrs
        )
      );
    }
  };

  // Update series and obs keys with a series level dimension value.
  var updateSeriesAndObsKeys = function(dvi, di) {
    var dim = msg.data.structure.dimensions.series[di];
    var pos = dimPosition(dim);
    seriesKey[pos] = obsKey[pos] = dim.values[dvi].id;
  };

  // Call processObservations for each series object
  var processSeries = function(series) {
    if (series === undefined || series === null) return;

    for (var key in series) {
      // Convert key from string into array of numbers
      var serDimIdx = key.split(KEY_SEPARATOR).map(Number);
      // Update series and obs keys
      serDimIdx.forEach(updateSeriesAndObsKeys);

      var value = series[key];
      var serAttrIdx = [];

      if (Array.isArray(value.attributes)) {
        serAttrIdx = value.attributes;
      }

      processObservations(
        value.observations,
        seriesKey.join(KEY_SEPARATOR),
        dsDimIdx.concat(serDimIdx),
        dsAttrIdx.concat(serAttrIdx)
      );
    }
  };

  // Check if need to include data set level dimensions/attributes
  if (!ignoreDatasetLevel) {
    dsDimVals = msg.data.structure.dimensions.dataSet.map(function(d) {
      return d.values[0];
    });

    dsDimIdx = dsDimVals.map(function(d) {
      return 0;
    });

    allDims = msg.data.structure.dimensions.dataSet.concat(allDims);

    dsAttrVals = msg.data.structure.attributes.dataSet.map(function(a) {
      return a.values[0];
    });

    dsAttrIdx = dsAttrVals.map(function(d) {
      return 0;
    });

    allAttrs = msg.data.structure.attributes.dataSet.concat(allAttrs);
  }

  // Include data set level dimension values in the keys always
  msg.data.structure.dimensions.dataSet.forEach(function(d) {
    var pos = dimPosition(d);
    seriesKey[pos] = obsKey[pos] = d.values[0].id;
  });

  msg.data.dataSets.forEach(function(ds) {
    if (ds.series !== undefined) {
      processSeries(ds.series);
    } else {
      processObservations(ds.observations, null, dsDimIdx, dsAttrIdx);
    }
  });

  return results;
};

//------------------------------------------------------------------------------

// Default component mapper
lib.response.identity = function(obj) {
  return obj;
};

// Default observation mapper. Maps observations to objects
lib.response.obsToStructureSpecific = function(
  key,
  seriesKey,
  value,
  dimIdxs,
  attrIdxs,
  dimensions,
  attributes
) {
  var result = {
    _key: key,
    _seriesKey: seriesKey,
    obsValue: value
  };

  dimIdxs.forEach(function(d, i) {
    result[dimensions[i]._propertyName] = dimensions[i].values[d];
  });

  attrIdxs.forEach(function(a, i) {
    result[attributes[i]._propertyName] = attributes[i].values[a];
  });

  return result;
};

//------------------------------------------------------------------------------

// Prepares the response for easier processing
lib.response.prepare = function(msg) {
  var addDefault = function(c, name, value) {
    if (c[name] === undefined || c[name] === null) {
      c[name] = value;
    }
  };

  // Initialise all component arrays with empty arrays if missing
  ["dataSet", "series", "observation"].forEach(function(n) {
    addDefault(msg.data.structure.dimensions, n, []);
    addDefault(msg.data.structure.attributes, n, []);
  });

  lib.response.updateComponentValues(msg, lib.response.addStartAndEndDates);
  lib.response.updateComponentValues(msg, lib.response.addIndex);
  lib.response.updateComponents(msg, lib.response.addPropertyName);
  lib.response.addKeyPositionToDimensions(msg);
};

// Converts existing start and end properties to new date properties
lib.response.addStartAndEndDates = function(v) {
  if (
    v.start === undefined ||
    v.start === null ||
    v.end === undefined ||
    v.end === null
  ) {
    return false;
  }

  v._startDate = new Date(v.start);
  v._endDate = new Date(v.end);

  return true;
};

// Add index property to all component values
lib.response.addIndex = function(v, type, key, i) {
  v._index = i;
  return true;
};

// Converts SDMX id values to lower case camel case.
// e.g. TIME_PERIOD => timePeriod
lib.response.normalizeSdmxIdString = function(id) {
  var normalizeIdPart = function(s, i) {
    if (i === 0) {
      return s;
    } else {
      return s.substr(0, 1).toUpperCase() + s.substr(1);
    }
  };

  return id
    .toLowerCase()
    .split("_")
    .map(normalizeIdPart)
    .join("");
};

// Converts components ids to propetyname properties
lib.response.addPropertyName = function(c) {
  c._propertyName = lib.response.normalizeSdmxIdString(c.id);
  return true;
};

// Adds keyPosition properties to dimensions (except TIME_PERIOD) if
// keyPosition is missing
lib.response.addKeyPositionToDimensions = function(msg) {
  var safeDim = function(a) {
    if (Array.isArray(a)) return a;
    return [];
  };

  var dims = [].concat(
    safeDim(msg.data.structure.dimensions.dataSet),
    safeDim(msg.data.structure.dimensions.series),
    safeDim(msg.data.structure.dimensions.observation)
  );

  var iter = function(d, i) {
    if (d.keyPosition !== undefined && d.keyPosition !== null) return true;
    if (d.id === TIME_DIMENSION) return true;
    d.keyPosition = i;
  };

  dims.forEach(iter);
};

// Applies the iterator function to all components (dimensions & attributes)
lib.response.updateComponents = function(msg, iterator, context) {
  if (msg === undefined || msg === null) {
    return false;
  }
  if (iterator === undefined || iterator === null) {
    return true;
  }

  var failed = 0;

  var siter = function(components, type) {
    if (components === undefined || components === null) return;

    // Applies the iterator function and collects boolean results
    var citer = function(c, i, array) {
      if (c === undefined || c === null) return;
      // c is the component, type is dimension|attribute,
      // level is dataset|series|observation, i is index,
      // array is the component array
      failed += !iterator.call(context, c, type, level, i, array);
    };

    // Loops over named component arrays (dataset, series & observation)
    for (var level in components) {
      components[level].forEach(citer);
    }
  };

  siter(msg.data.structure.dimensions, "dimension");
  siter(msg.data.structure.attributes, "attribute");

  return failed === 0;
};

// Applies the iterator function to all component values
lib.response.updateComponentValues = function(msg, iterator, context) {
  // Component iterator function. Gets the component, type (dimension|attribute),
  // level (dataset|series|observation) as arguments
  var citer = function(c, type, level) {
    if (c.values === undefined || c.values === null) return true;

    var failed = 0;

    // Value iterator function. Gets the value and index as arguments.
    // Collects boolean results.
    var viter = function(v, i) {
      if (v === undefined || v === null) return;
      failed += !iterator.call(context, v, type, level, i);
    };

    c.values.forEach(viter);

    return failed === 0;
  };

  return lib.response.updateComponents(msg, citer, context);
};

//------------------------------------------------------------------------------

lib.response.mapDataSetsForD3 = function(msg) {
  lib.response.prepare(msg);
  return lib.response.mapDataSetsToArray(
    msg,
    false,
    lib.response.obsToStructureSpecific
  );
};

lib.response.mapComponentsForD3 = function(msg) {
  lib.response.prepare(msg);
  return lib.response.mapComponentsToObject(msg, lib.response.identity);
};

//------------------------------------------------------------------------------

lib.response.mapDataSetsToJsonStat = function(msg) {
  var dataSetDimCount = 0,
    seriesDimCount = 0,
    indexSteps = [];

  var dimension = {
    id: [],
    size: [],
    role: {
      time: []
    }
  };

  var result = {};

  var mapDimension = function(d) {
    var result = {
      label: d.name,
      category: {
        label: {}
      }
    };

    var mapLabel = function(v) {
      result.category.label[v.id] = v.name;
    };

    var mapIndex = function(v, i) {
      result.category.index[v.id] = i;
    };

    d.values.forEach(mapLabel);

    if (1 < d.values.length) {
      result.category.index = {};
      d.values.forEach(mapIndex);
    }

    dimension[d.id] = result;
    dimension.id.push(d.id);
    dimension.size.push(d.values.length);

    if (d.role === TIME_ROLE) {
      dimension.role.time.push(d.id);
    }
  };

  var reduceKeyHelper = function(dimPos) {
    return function(prev, cur, index) {
      return prev + cur * indexSteps[dimPos + index];
    };
  };

  var processObservations = function(obs, dataSet, dimPos, initial) {
    var obsKey,
      indexVal,
      reduceKey = reduceKeyHelper(dimPos);

    for (var key in obs) {
      obsKey = key.split(KEY_SEPARATOR).map(Number);
      indexVal = obsKey.reduce(reduceKey, initial);
      dataSet.value[indexVal] = obs[key][0];
    }
  };

  var processSeries = function(series, dataSet) {
    var seriesKey,
      seriesIndexVal,
      reduceKey = reduceKeyHelper(dataSetDimCount);

    for (var key in series) {
      seriesKey = key.split(KEY_SEPARATOR).map(Number);
      seriesIndexVal = seriesKey.reduce(reduceKey, 0);
      processObservations(
        series[key].observations,
        dataSet,
        seriesDimCount,
        seriesIndexVal
      );
    }
  };

  var processDataSet = function(ds, i) {
    var dataSet = {
      value: {},
      dimension: dimension
    };

    if (ds.observations !== null)
      processObservations(ds.observations, dataSet, dataSetDimCount, 0);
    if (ds.series !== null) processSeries(ds.series, dataSet);

    result["dataset_" + i] = dataSet;
  };

  lib.response.prepare(msg);

  if (
    msg.data.structure.dimensions.dataSet !== undefined &&
    msg.data.structure.dimensions.dataSet !== null
  ) {
    dataSetDimCount = msg.data.structure.dimensions.dataSet.length;
    msg.data.structure.dimensions.dataSet.forEach(mapDimension);
  }

  if (
    msg.data.structure.dimensions.series !== undefined &&
    msg.data.structure.dimensions.series !== null
  ) {
    seriesDimCount =
      msg.data.structure.dimensions.series.length + dataSetDimCount;
    msg.data.structure.dimensions.series.forEach(mapDimension);
  }

  if (
    msg.data.structure.dimensions.observation !== undefined &&
    msg.data.structure.dimensions.observation !== null
  ) {
    msg.data.structure.dimensions.observation.forEach(mapDimension);
  }

  var indexSum = 1,
    isFirst = true;
  var calcIndexSteps = function(size, i) {
    var prev = indexSum;
    indexSum = indexSum * size;

    if (size === 1) {
      return 1;
    }

    if (isFirst) {
      isFirst = false;
      return 1;
    }

    return prev;
  };

  indexSteps = dimension.size
    .slice(0)
    .reverse()
    .map(calcIndexSteps)
    .reverse();

  msg.data.dataSets.forEach(processDataSet);

  return result;
};

//==============================================================================

module.exports = lib;
