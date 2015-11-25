'use strict';

/*global require*/
var UrlTemplateImageryProvider = require('terriajs-cesium/Source/Scene/UrlTemplateImageryProvider');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');

var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer of Urthecast Imagrey.
 *
 * @alias UrthecastServerCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var UrthecastServerCatalogItem = function(terria) {
    ImageryLayerCatalogItem.call(this, terria);
};

inherit(ImageryLayerCatalogItem, UrthecastServerCatalogItem);

defineProperties(UrthecastServerCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf UrthecastServerCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'urthecast';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Urthecast Map Tiles Service'.
     * @memberOf UrthecastServerCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Urthecast Map Tiles Service Renderer';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf WebMapServiceCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            if (!defined(this._metadata)) {
                addInfoSections(this, [
                  {
                      name: this.name,
                      content: getMapTileServiceRendererInfo(this.renderer)
                  },
                  {
                      name: 'Sensor Platform',
                      content: getSensorPlatformInfo(this.platform)
                  }
                ]);

                this._metadata = createMetaData();

                return this._metadata;
            } else {
                return this._metadata;
            }
        }
    },
});

UrthecastServerCatalogItem.prototype._createImageryProvider = function() {
    var url = proxyCatalogItemUrl(this, createMapTileServiceUrl(this));

    return new UrlTemplateImageryProvider({
        url: url,
        subdomains: 'abcdefgh',
    });
};

function createMapTileServiceUrl(catalogItem) {
    var url = 'https://tile-{s}.urthecast.com/v1/' + catalogItem.renderer + '/{z}/{x}/{y}';

    url += '?api_key=' + catalogItem.terria.configParameters.urthecastApiKey;
    url += '&api_secret=' + catalogItem.terria.configParameters.urthecastApiSecret;
    url += '&sensor_platform=' + catalogItem.platform;

    // NOTE this will yield the best data for all sensor platforms.
    url += '&cloud_coverage_lte=20';

    return url;
}

function createMetaData() {
    var result = new Metadata();

    result.isLoading = false;

    return result;
}

function addInfoSections(catalogItem, sections) {
    for (var i = 0; i < sections.length; i++) {
        catalogItem.info.push({
            name: sections[i].name,
            content: sections[i].content
        });
    }
}

// NOTE there is no good way to get this info via API.
// Content is pulled from the following sources:
// https://www.urthecast.com/enterprise/cameras
// http://www.deimos-imaging.com/satellites
// http://landsat.usgs.gov/landsat8.php
function getSensorPlatformInfo(sensorPlatform) {
    var sensorPlatforms = {
        'landsat-8': 'Landsat 8 carries two instruments: [The Operational Land Imager (OLI)](http://landsat.usgs.gov/ldcm_vs_previous.php) sensor includes refined heritage bands, along with three new bands: a deep blue band for coastal/aerosol studies, a shortwave infrared band for cirrus detection*, and a [Quality Assessment band](http://landsat.usgs.gov/L8_QA_band.php). The [Thermal Infrared Sensor (TIRS)](http://landsat.usgs.gov/ldcm_vs_previous.php) provides two thermal bands. These sensors both provide improved signal-to-noise (SNR) radiometric performance quantized over a 12-bit dynamic range. (This translates into 4096 potential grey levels in an image compared with only 256 grey levels in previous 8-bit instruments.) Improved signal to noise performance enable better characterization of land cover state and condition. Products are delivered as 16-bit images (scaled to 55,000 grey levels).',
        'theia': '[Urthecast\'s](https://developers.urthecast.com) Medium-Resolution Camera (MRC), Theia, is a conventional linear Charge-Coupled Device (CCD) pushbroom camera. It produces strips of medium-resolution, 4-channel multispectral imagery with a GSD of approximately 5 m and a swath width of approximately 50 km.',

        'iris': 'The High-Resolution Camera (HRC), Iris, is mounted on a biaxial pointing platform that allows for the tracking of targeted Areas of Interest (AOI). Iris uses a CMOS detector to capture full color, Ultra High-Definition (UHD) videos with a Ground Sample Distance (GSD) as fine as 1-meter and a duration of up to 60-seconds.',

        'deimos-1': 'The DEIMOS-1, owned and operated by Deimos Imaging, is the first Spanish Earth Observation Satellite. With a mass of 100 kg, it was launched in 2009, and provides 22m, 3-band imagery with a very wide (650-km) swath. It has been specifically designed to assure very-high-frequency revisit on large areas (every 3 days on average for any mid-latitude region), with precision agriculture and forestry monitoring applications in mind. DEIMOS-1 is member of the Disaster Monitoring Constellation (DMC), and it is nowadays one of the leading sources of high-resolution data worldwide.',

        'deimos-2': 'The DEIMOS-2, owned and operated by Deimos Imaging, is an agile satellite for cost-effective, dependable very-high-resolution EO applications. It provides 75-cm pan-sharpened images with a 12-km swath from its orbital altitude of 620 km. The DEIMOS-2 is operated 24/7, with a network of four ground stations which assures a contact every orbit, and therefore the capacity of commanding the satellite and downloading data every 90 minutes. Launched in June 2014, it entered Initial Operational Capability in November 2014 and Full Operational Capability in May 2015.'

    };

    return sensorPlatforms[sensorPlatform];
}

// NOTE there is no good way to get this info via API.
// Content is pulled from the following sources:
// https://developers.urthecast.com/docs/map-tiles#renderers
function getMapTileServiceRendererInfo(renderer) {
    var renderers = {
        'rgb': 'True RGB (rgb) - this is a traditional mapping of the red, green, and blue spectral bands to the red, green, and blue image channels. This produces a satellite image that looks "normal" to the human eye. True RGB is available for both the Theia and Landsat8 sensors.',

        'ndvi': 'Normalized Difference Vegetation Index (ndvi) is an index that uses the [near-infrared](https://en.wikipedia.org/wiki/NIR) and red spectral bands to calculate a vegetation "health" index. This index is mapped from a red to green hue, where green pixels indicate good crop health and red pixels indicate poor crop health or an absence of vegetation. This index can be used to provide insight into the health of crops and vegetation. It is available for both the Theia and Landsat8 sensors.',

        'evi': 'Enhanced Vegetation Index (evi) is another vegetation index that can be used to help determine the health of crops and vegetation. It differs from NDVI in that the EVI index is more sensitive to variations in canopy structure, canopy type, and canopy architecture ([Wikipedia](https://en.wikipedia.org/wiki/Enhanced_vegetation_index)). In addition, it has an increased ability to eliminate background and atmospheric noises.',

        'ndwi': 'Normalized Difference Water Index (ndwi) uses the near-infrared and green bands to help detect the presence of water in vegetation. The calculated pixel values range from blue to purple - where blue indicates the presence of water, and purple indicates dryer land. It is another tool to determine crop health and condition.',

        'false-color-nir': 'False-color NIR (false-color-nir) is an algorithm that substitutes the red band for the near-infrared band, the red band for the green band, and the green band for the blue band. This provides an alternate view of the image where the (typically) invisible near-infrared light will appear as shades of red.'
    };

    return renderers[renderer] + ' See [https://developers.urthecast.com/docs/map-tiles](https://developers.urthecast.com/docs/map-tiles) for more information.';
}

module.exports = UrthecastServerCatalogItem;
