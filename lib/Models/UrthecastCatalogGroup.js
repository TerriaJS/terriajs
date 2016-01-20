'use strict';

/*global require*/
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var TerriaError = require('../Core/TerriaError');
var CatalogGroup = require('./CatalogGroup');
var inherit = require('../Core/inherit');
var UrthecastCatalogItem = require('./UrthecastCatalogItem');
var urthecastClient = require('urthecast');

/**
 * A {@link CatalogGroup} representing a collection of avalible Urthecast sensor platforms.
 *
 * @alias UrthecastCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var UrthecastCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria);

    /**
     * Gets or sets a hash of names of blacklisted data layers.  A layer that appears in this hash
     * will not be shown to the user.  In this hash, the keys should be the Title of the layers to blacklist,
     * and the values should be "true".  This property is observable.
     * @type {Object}
     */
    this.blacklist = undefined;

    knockout.track(this, ['blacklist']);
};

inherit(CatalogGroup, UrthecastCatalogGroup);

defineProperties(UrthecastCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf UrthecastCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'urthecast-group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Urthcast Sensor Platforms'.
     * @memberOf UrthecastCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Urthcast Sensor Platforms';
        }
    },
});

UrthecastCatalogGroup.prototype._load = function() {
    var catalogGroup = this;
    var deferred = when.defer();
    var apiKey = catalogGroup.terria.configParameters.urthecastApiKey;
    var apiSecret = catalogGroup.terria.configParameters.urthecastApiSecret;

    if (!apiKey || !apiSecret) {
        deferred.reject(createTerriaError(
                catalogGroup.terria,
                'Please Provide an Urthecast API Key and Secret',
                'Visit [developers.urthecast.com](https://developers.urthecast.com) to obatin your Urthecast API key and secret. If you already have an API key and secret and are having trouble please visit [support.urthecast.com](https://support.urthecast.com) for more information.'
            )
        );

        return deferred.promise;
    }

    urthecastClient(apiKey, apiSecret).v1.satellite_tracker('/sensor_platforms', {}, function(err, res) {
        if (err) {
            deferred.reject(createTerriaError(catalogGroup.terria, res.body.messages[0]));

            return;
        }

        createSensorPlatformsGroup(catalogGroup, res.body.payload);
        deferred.resolve();
    });

    return deferred.promise;
};

function createSensorPlatformsGroup(catalogGroup, sensorPlatforms) {
    var sensorPlatformsGroup = new CatalogGroup(catalogGroup.terria);

    sensorPlatformsGroup.name = 'Sensor Platforms';

    for (var i = 0; i < sensorPlatforms.length; i++) {
        var sensor = sensorPlatforms[i];

        if (catalogGroup.blacklist && catalogGroup.blacklist[sensor.name]) {
            console.log('Provider Feedback: Filtering out ' + sensor.name + ' because it is blacklisted.');
        } else {
            var result = new CatalogGroup(catalogGroup.terria);

            result.name = sensor.name;
            sensorPlatformsGroup.items.push(result);

            createCatalogItem(result, sensor);
        }
    }

    catalogGroup.items.push(sensorPlatformsGroup);
}

function createCatalogItem(catalogGroup, sensor) {
    // NOTE there is no Urthecast API that returns available renderers.
    // See https://developers.urthecast.com/docs/map-tiles#service-url for renderer list.
    var renderers = [
      { name: 'True RGB', id: 'rgb' },
      { name: 'Normalized Difference Vegetation Index (NDVI)', id: 'ndvi' },
      { name: 'Enhanced Vegetation Index (EVI)', id: 'evi' },
      { name: 'Normalized Difference Water Index (NDWI)', id: 'ndwi' },
      { name: 'False-color NIR', id: 'false-color-nir' },
    ];

    for (var i = 0; i < renderers.length; i++ ) {
        var item = new UrthecastCatalogItem(catalogGroup.terria);

        item.name = renderers[i].name;
        item.platform = sensor.key;
        item.renderer = renderers[i].id;
        item.description = true;

        catalogGroup.items.push(item);
    }
}

function createTerriaError(terria, title, message) {
    if (!message) {
        message = getDefaultErrorMessage(terria);
    }

    return new TerriaError({
        title: title,
        message: message
    });
}

function getDefaultErrorMessage(terria) {
    var message = '<p>';

    message += 'This error may indicate that the group you opened is temporarily unavailable or there is a problem with your internet connection. Try opening the group again, and if the problem persists, please report it by sending an email to ';
    message += '<a href="mailto:' + terria.supportEmail + '">' + terria.supportEmail + '</a>.';
    message += '</p>';

    return message;
}

module.exports = UrthecastCatalogGroup;
