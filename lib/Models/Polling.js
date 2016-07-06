'use strict';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';

import serializeToJson from '../Core/serializeToJson';
import updateFromJson from '../Core/updateFromJson';

/**
 * Represents polling information for a Catalog Item.
 *
 * @alias Polling
 * @constructor
 *
 * @param {Object} [options] The values of the properties of the new instance.
 * @param {String|Number} [options.seconds] The number of seconds to wait before polling for new data.
 * @param {String} [options.url] The URL from which to poll for new data.
 * @param {Boolean} [options.replaceData] Should the newly polled data replace the existing data (true), or update it (false)?
 * @param {String[]} [options.idColumns] The column identifiers (names or indices), so we can identify individual features.
 */
var Polling = function(options) {

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    /**
     * Gets or sets the number of seconds to wait before polling for new data.
     * If this.pollUrl is defined, it polls this.pollUrl and adds the data received to the existing TableStructure.
     * If this.pollUrl is undefined, it polls this.url and replaces its TableStructure with the new one.
     * If undefined (the default) or 0, no polling occurs.
     * @type {Number}
     * @default undefined
     */
    this.seconds = options.seconds;

    /**
     * Gets or sets the URL from which to poll for new data.
     * If defined, the data received is added to the existing TableStructure. Otherwise, it replaces the TableStructure.
     * @type {String}
     * @default undefined
     */
    this.url = options.url;

    /**
     * Gets or sets a flag which says whether polled data should replace the existing data, or update it.
     * If defined, the data received is added to the existing TableStructure. Otherwise, it replaces the TableStructure.
     * @type {Boolean}
     * @default false
     */
    this.replaceData = options.replaceData;

    /**
     * Gets or sets the column identifiers (names or indices), so we can identify individual features
     * across multiple polled lat/lon files. For polled lat/lon files, this must be set explicitly.
     * Eg. ['lat', 'lon'] for immobile features, or ['identifier'] if a unique identifier is provided
     * (where these are column names in the csv file).
     * For region-mapped files, the region identifier is used instead.
     * For non-spatial files, the x-column is used instead.
     * @type {String[]}
     * @default undefined
     */
    this.idColumns = options.idColumns;
};

Polling.prototype.updateFromJson = function(json, options) {
    return updateFromJson(this, json, options);
};

Polling.prototype.serializeToJson = function(options) {
    return serializeToJson(this, undefined, options);
};

module.exports = Polling;
