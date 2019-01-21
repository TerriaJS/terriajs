const CsvCatalogItem = require('./CsvCatalogItem');
const CatalogItem = require('./CatalogItem');
const defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
const inherit = require('../Core/inherit');
const loadXML = require('../Core/loadXML');
const Metadata = require('./Metadata');
const proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
const knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

function GeoRssCatalogItem(terria, url) {
    CatalogItem.call(this, terria);

    this.url = url;
    this.cacheDuration = '60s';
    this.tableStyle = undefined;

    knockout.track(this, ['tableStyle']);
}

inherit(CatalogItem, GeoRssCatalogItem);

defineProperties(GeoRssCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf GeoRssCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'georss';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GeoRSS'.
     * @memberOf GeoRssCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'GeoRSS';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf GeoRssCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

GeoRssCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url];
};

const georssNamespace = 'http://www.georss.org/georss';

GeoRssCatalogItem.prototype._load = function() {
    return loadXML(proxyCatalogItemUrl(this, this.url)).then(xml => {
        if (typeof xml === 'string') {
            const parser = new DOMParser();
            xml = parser.parseFromString(xml, 'text/xml');
        }

        const rss = xml.documentElement;
        const channel = rss.getElementsByTagName('channel')[0];
        const items = channel.getElementsByTagName('item');

        const catalogItem = new CsvCatalogItem(this.terria);
        catalogItem.name = this.name;

        if (this.tableStyle) {
            Object.keys(this.tableStyle).forEach(key => {
                catalogItem.tableStyle[key] = this.tableStyle[key];
            });
        }

        let csv = 'latitude,longitude,category,title,description\n';

        for (let i = 0; i < items.length; ++i) {
            const item = items[i];

            const title = item.getElementsByTagName('title')[0].textContent.trim();
            const firstCategory = item.getElementsByTagName('category')[0].textContent.trim();
            const description = item.getElementsByTagName('description')[0].textContent.trim();

            const point = item.getElementsByTagNameNS(georssNamespace, 'point')[0];
            const latlon = point.textContent.trim().split(/\s/);
            const latitude = latlon[0];
            const longitude = latlon[1];
            csv +=
                latitude + ',' +
                longitude + ',' +
                '"' + firstCategory.replace(/"/g, '""') + '"' + ',' +
                '"' + title.replace(/"/g, '""') + '"' + ',' +
                '"' + description.replace(/"/g, '""') + '"' + '\n';
        }

        catalogItem.data = csv;

        return catalogItem;
    });
};

module.exports = GeoRssCatalogItem;
