"use strict";

/*global require*/
var CatalogFunction = require("./CatalogFunction");
var CatalogGroup = require("./CatalogGroup");
var clone = require("terriajs-cesium/Source/Core/clone");
var createParameterFromType = require("./createParameterFromType");
var defined = require("terriajs-cesium/Source/Core/defined");
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties");
var freezeObject = require("terriajs-cesium/Source/Core/freezeObject");
var inherit = require("../Core/inherit");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var ResultPendingCatalogItem = require("./ResultPendingCatalogItem");
var sprintf = require("terriajs-cesium/Source/ThirdParty/sprintf");
var URI = require("urijs");
var Resource = require("terriajs-cesium/Source/Core/Resource");

/**
 * A {@link CatalogFunction} that issues an HTTP GET to a service with a set of query parameters specified by the
 * {@link TerriaJsonCatalogFunction#inputs} property, and expects to receive back TerriaJS catalog/share JSON.
 *
 * When this `CatalogFunction` is added to the catalog, TerriaJS automatically creates a user interface for it
 * based on the inputs. When the user clicks "Run Analysis", it issues an HTTP GET with the user-specified
 * inputs supplied as part of the query string. The returned TerriaJS catalog/share JSON can add items
 * to the workbench, configure the catalog, change the camera view, and more.
 *
 * Example:
 *
 * ```
 * {
 *   "name": "Simple Example",
 *   "type": "terria-json",
 *   "url": "https://putsreq.com/PK2GvS6jHfWhlBmkadrG",
 *   "inputs": [
 *     {
 *       "id": "position",
 *       "type": "point",
 *       "name": "Position",
 *       "description": "The position to pass to the service.",
 *       "formatter": "longitudeCommaLatitude"
 *     },
 *     {
 *       "id": "someOtherParameter",
 *       "type": "string",
 *       "name": "Some Other Parameter",
 *       "description": "This is another parameter that will be passed to the service."
 *     }
 *   ]
 * }
 * ```
 *
 * For this `CatalogFunction` TerriaJS will present a user interface with two elements: a position on the map
 * and a string. When invoked, TerriaJS will GET a URL like:
 * `https://putsreq.com/PK2GvS6jHfWhlBmkadrG?position=151.0%2C-33.0&someOtherParameter=some%20text`
 *
 * The service is expected to return JSON using the `application/json` content type, and have a body
 * with any of the following:
 *
 *    * A single catalog member
 *
 * For example:
 *
 * ```
 * {
 *   "type": "csv",
 *   "data": "POSTCODE,value\n2000,1"
 * }
 * ```
 *
 * The catalog member will be added to the catalog inside a catalog group directly below this
 * `CatalogFunction`. Catalog items will also be added to the workbench unless `isEnabled` is
 * explicitly set to false.
 *
 * If the catalog item does not have a name, as in the above example, its name will be the name of
 * this `CatalogFunction` followed by the date and time it was invoked in ISO8601 format. If the catalog item
 * does not have a description, it will be given a description explaining that this is the result of executing
 * a service and will include the input parameters sent to the service.
 *
 *    * An array of catalog members
 *
 * An array of catalog members as described above.
 *
 * For example:
 *
 * ```
 * [
 *   {
 *     "type": "csv",
 *     "data": "POSTCODE,value\n2000,1"
 *   },
 *   {
 *     "name": "My Result WMS Layer",
 *     "type": "wms",
 *     "url": "http://ereeftds.bom.gov.au/ereefs/tds/wms/ereefs/mwq_gridAgg_P1A",
 *     "layers": "Chl_MIM_mean"
 *   }
 * ]
 * ```
 *
 *    * A catalog file
 *
 * For example:
 *
 * ```
 * {
 *   "catalog": [
 *     {
 *       "name": "National Datasets",
 *       "type": "group",
 *       "items": [
 *         {
 *           "name": "My Result WMS Layer",
 *           "type": "wms",
 *           "url": "http://ereeftds.bom.gov.au/ereefs/tds/wms/ereefs/mwq_gridAgg_P1A",
 *           "layers": "Chl_MIM_mean",
 *           "isEnabled": true
 *         }
 *       ]
 *     }
 *   ],
 *   "initialCamera": {
 *     "west": 141.0,
 *     "south": -26.0,
 *     "east": 157.0,
 *     "north": -9.0
 *   }
 * }
 * ```
 *
 * Please note that in this case, catalog items are _not_ automatically enabled or named.
 * The `name` property is required. If `isEnabled` is not set to `true`, the catalog item
 * will not appear on the workbench.
 *
 *    * Share data
 *
 * Similar to the above except that it allows multiple init sources (catalog files) and has a
 * version property for backward compatibility. For example:
 *
 * ```
 * {
 *   "version": "0.0.05",
 *   "initSources": [
 *     {
 *       "catalog": [
 *         {
 *           "name": "National Datasets",
 *           "type": "group",
 *           "items": [
 *             {
 *               "name": "My Result WMS Layer",
 *               "type": "wms",
 *               "url": "http://ereeftds.bom.gov.au/ereefs/tds/wms/ereefs/mwq_gridAgg_P1A",
 *               "layers": "Chl_MIM_mean",
 *               "isEnabled": true
 *             }
 *           ]
 *         }
 *       ],
 *     },
 *     {
 *       "initialCamera": {
 *         "west": 141.0,
 *         "south": -26.0,
 *         "east": 157.0,
 *         "north": -9.0
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @alias TerriaJsonCatalogFunction
 * @constructor
 * @extends CatalogFunction
 *
 * @param {Terria} terria The Terria instance.
 */
function TerriaJsonCatalogFunction(terria) {
  CatalogFunction.call(this, terria);

  /**
   * Gets or sets the URL of the REST server.  This property is observable.
   * @type {String}
   */
  this.url = undefined;

  /*
   * Gets or sets the part of a HTTP 202 response to poll again for content.
   * A HTTP 202 response is returned as an object with 
   * {
   *   status: 202
   *   headers: responseHeaders
   *   respone: responseBody
   * }
   * where
   * responseHeaders is an object with key-value pairs of all HTTP response 
   * 	headers
   * responseBody is the unaltered XMLHttpRequest.response
   * If you were to supply a 202 response with the url as a location header,
   * acceptedUrl can be specified as "headers.location" to poll it again
   * after acceptedDelay
   * If you were to supply a 202 response with the url as a property of a
   * JSON object in the response body, for example
   * {
   *   prop1: {
   *     prop2: "something",
   *     prop3: url
   *   }
   * }
   * acceptedUrl can be specified as response.prop1.prop3
   * If you were to supply a 202 response with the url as plain text in the 
   * response body, acceptedUrl can be specified as response (i think)
   * If you were to supply a 202 response with the url as a property of some 
   * other mime type/format, eg. XML, YAML
   * This is open source software, add the code yourself.
   * @type {String}
   */
  this.acceptedUrl = undefined;

  /*
   * Gets or sets the time in milliseconds to wait before polling a 
   * HTTP 202 response acceptedUrl
   * default 10 seconds
   * @type {Number}
   */
  this.acceptedDelay = 10000;

  /**
   * Gets or sets the input parameters to the service.
   * @type {FunctionParameter[]}
   */
  this.inputs = [];

  knockout.track(this, ["url", "acceptedUrl", "aceptedDelay", "inputs"]);
}

inherit(CatalogFunction, TerriaJsonCatalogFunction);

defineProperties(TerriaJsonCatalogFunction.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf TerriaJSONCatalogFunction.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "terria-json";
    }
  },

  /**acceptedUrl
   * Gets a human-readable name for this type of data source, 'Terria JSON Catalog Function'.
   * @memberOf TerriaJSONCatalogFunction.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "Terria JSON Catalog Function";
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf WebMapServiceCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return TerriaJsonCatalogFunction.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf WebMapServiceCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return TerriaJsonCatalogFunction.defaultSerializers;
    }
  },

  /**
   * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
   * for a share link.
   * @memberOf WebMapServiceCatalogItem.prototype
   * @type {String[]}
   */
  propertiesForSharing: {
    get: function() {
      return TerriaJsonCatalogFunction.defaultPropertiesForSharing;
    }
  },

  /**
   * Gets the parameters used to {@link CatalogFunction#invoke} to this process.
   * @memberOf CatalogFunction
   * @type {CatalogFunctionParameters[]}
   */
  parameters: {
    get: function() {
      return this.inputs;
    }
  }
});

TerriaJsonCatalogFunction.defaultUpdaters = clone(
  CatalogFunction.defaultUpdaters
);

TerriaJsonCatalogFunction.defaultUpdaters.inputs = function(
  catalogFunction,
  json,
  propertyName,
  options
) {
  if (!json.inputs) {
    return;
  }

  catalogFunction.inputs = json.inputs.map(parameterJson => {
    const parameter = createParameterFromType(parameterJson.type, {
      terria: catalogFunction.terria,
      catalogFunction: catalogFunction,
      id: parameterJson.id
    });
    parameter.updateFromJson(parameterJson);
    return parameter;
  });
};

freezeObject(TerriaJsonCatalogFunction.defaultUpdaters);

TerriaJsonCatalogFunction.defaultSerializers = clone(
  CatalogFunction.defaultSerializers
);

TerriaJsonCatalogFunction.defaultSerializers.inputs = function(
  catalogFunction,
  json,
  propertyName,
  options
) {
  if (!catalogFunction.inputs) {
    return;
  }

  json[propertyName] = catalogFunction.inputs.map(parameter =>
    parameter.serializeToJson()
  );
};

freezeObject(TerriaJsonCatalogFunction.defaultSerializers);

TerriaJsonCatalogFunction.defaultPropertiesForSharing = clone(
  CatalogFunction.defaultPropertiesForSharing
);

TerriaJsonCatalogFunction.prototype._load = function() {};

/**
 * Invoke the REST function with the provided parameterValues.
 * @return {Promise}
 */
TerriaJsonCatalogFunction.prototype.invoke = function() {
  var now = new Date();
  var timestamp = sprintf(
    "%04d-%02d-%02dT%02d:%02d:%02d",
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );

  var asyncResult = new ResultPendingCatalogItem(this.terria);
  asyncResult.name = this.name + " " + timestamp;
  asyncResult.description =
    "This is the result of invoking the " +
    this.name +
    " process or service at " +
    timestamp +
    " with the input parameters below.\n\n" +
    '<table class="cesium-infoBox-defaultTable">' +
    (this.parameters || []).reduce(function(previousValue, parameter) {
      return (
        previousValue +
        "<tr>" +
        '<td style="vertical-align: middle">' +
        parameter.name +
        "</td>" +
        "<td>" +
        parameter.formatValueAsString(parameter.value) +
        "</td>" +
        "</tr>"
      );
    }, "") +
    "</table>";

  const queryParameters = {};

  this.parameters.forEach(parameter => {
    if (!defined(parameter.value) || parameter.value === "") {
      return;
    }

    queryParameters[parameter.id] = parameter.formatForService();
  });
  const uri = new URI(this.url).addQuery(queryParameters);
  const proxiedUrl = proxyCatalogItemUrl(this, uri.toString(), "1d");
  const promise = Resource.fetchXHR({
      url: proxiedUrl,
      responseType: "text",
      headers: {
        Accept: "application/json,*/*;q=0.01"
      },
      returnType: "XHRJSONHEADERS"
    }).then(all => this._handleHttp202(all)).then(json => {
    asyncResult.isEnabled = false;

    // JSON response may be:
    // 1. A single catalog member; it will be added to the workbench.
    // 2. An array of catalog members; they'll all be added to the workbench.
    // 3. A TerriaJS init source (catalog file); it will be merged into the catalogue.
    // 4. A TerriaJS "share data" object, which may contain multiple init sources.

    if (json.version && json.initSources) {
      // Case #4
      return this.terria.updateFromStartData(json);
    } else if (Array.isArray(json.catalog)) {
      // Case #3
      return this.terria.addInitSource(json);
    }

    // Case #1 or #2
    const items = Array.isArray(json) ? json : [json];
    items.forEach(function(item) {
      // Make sure it shows up on the workbench, unless explicitly told not to.
      if (!defined(item.isEnabled)) {
        item.isEnabled = true;
      }

      item.name = item.name || asyncResult.name;
      item.description = item.description || asyncResult.description;
    });

    // Create a group in the catalog to hold the results
    const resultsGroupId = this.uniqueId + "-results";
    let resultsGroup = this.terria.catalog.shareKeyIndex[resultsGroupId];

    if (!resultsGroup) {
      const parent =
        this.parent && this.parent.items
          ? this.parent
          : this.terria.catalog.group;
      let index = parent.items.indexOf(this);
      if (index >= 0) {
        ++index;
      } else {
        index = parent.items.length;
      }

      resultsGroup = new CatalogGroup(this.terria);
      resultsGroup.id = resultsGroupId;
      resultsGroup.name = this.name + " Results";
      parent.items.splice(index, 0, resultsGroup);
    }

    return CatalogGroup.updateItems(
      items,
      {
        isUserSupplied: true
      },
      resultsGroup
    );
  });

  asyncResult.loadPromise = promise;
  asyncResult.isEnabled = true;

  return promise;
};

// private method split into function to make it recursive
TerriaJsonCatalogFunction.prototype._handleHttp202 = function(all) {
    //  A HTTP 202 response to try and get the data from polling acceptedUrl 
    //    after a delay of acceptedDelay || 10 seconds
    if (all.status !== undefined && all.status === 202) {
    // else not a 202 response, all is text from Resource.fetch
    // and it does not have a status property
      if (this.acceptedUrl === undefined || 
        typeof this.acceptedUrl !== "string") {
          console.log("fill in the init file");
          return {};
          // replace this with a proper error return
          // service not configured for TerriaJsonCatalogFunction HTTP 202
      }
     
      // JSON-ify the body here, used Resorce.fetch, so body must be text
      var jsonBody;
      if (all.response !== undefined && typeof all.response === "string" &&
          all.response !== "") {
          jsonBody = JSON.parse(all.response);
      }
      if (typeof jsonBody === "object") {
          all.response = jsonBody;
      } else {
        // add support for 202 bodies that are not json here if desired
        // not returning here because acceptedUrl might not reference Body
        // and this is not an error condition
        all.response = {};
      }
      var newResourceOpts = {
        url: "",
        responseType: "text",
        headers: {
          Accept: "application/json,*/*;q=0.01"
        },
        returnType: "XHRJSONHEADERS"
      };
      // ability to handle Accepted URL locations like first.second
      // or Headers.location or Body.prop1.prop2.whatever.etc
      // cant be a static input and 
      // needs to be called to re-initialise the first next value,
      var referenceIterator = this.acceptedUrl.split('.')[Symbol.iterator]();
      var iteratorCurrent = referenceIterator.next().value;
      // want to copy the all object because the copy will get modified
      var iteratorAll = all;
      while (iteratorCurrent !== undefined) {
        iteratorAll = iteratorAll[iteratorCurrent];
        iteratorCurrent = referenceIterator.next().value;
      }
      // is proxying this a good idea?
      // newResourceOpts.url = iteratorAll;
      newResourceOpts.url = proxyCatalogItemUrl(this, iteratorAll, "1d");

      // waitms is a function because i think it is a little easier to read
      var waitms = function(inputs) {
        return new Promise((resolve => {
          setTimeout (() => {
            resolve(inputs.callback(inputs.terria));
          }, inputs.delay);
        }));
      };
      // prefer not to copy terria object as this will recursively consume 
      // stack memory, unless terria is defined as a reference of an object 
      // where the reference is passed by value
      var that = new Proxy(this, {});
      // wait for acceptedDelay before polling 202 link specified by 
      // 202 reponse and acceptedUrl
      return waitms({
        delay: this.acceptedDelay,
        terria: that,
        callback: function(terria) {
          return Resource.fetchXHR(newResourceOpts).then(
            all => terria._handleHttp202(all)
          );}
      });
    } else {
      var json;
      // shold now have the promised JSON
      if (all.status !== undefined && all.status === 200) {
        json = JSON.parse(all.response);
        if (typeof json === "object") {
            return json; 
        } else {
          console.log("request failed");
          console.log("typeof all is " + typeof(all));
          console.log(all);
          return {};
          // replace this with a proper error return
          // "TerriaJsonCatalogFunction was supposed to receive JSON, received "
          // + all;
        }
      } else {
        //maybe f you get a HTTP 204
        console.log("got HTTP status "+all.status.toString());
        return {};
      }
    }
};

module.exports = TerriaJsonCatalogFunction;
