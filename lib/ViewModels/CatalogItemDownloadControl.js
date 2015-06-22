'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

var UserInterfaceControl = require('./UserInterfaceControl');

var svgDownload = require('../svgDownload');

/**
 * The view-model for a control in the user interface
 *
 * @alias CatalogItemDownloadControl
 * @constructor
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var CatalogItemDownloadControl = function(terria, catalogItem) {
    UserInterfaceControl.call(this, terria);

    this._item = catalogItem;

    /**
     * Gets or sets the name of the control which is set as the control's title.
     * This property is observable.
     * @type {String}
     */
    this.name = 'Click to download';

    /**
     * Gets or sets the svg icon of the control.  This property is observable.
     * @type {Object}
     */
    this.svgIcon = svgDownload;

    /**
     * Gets or sets the height of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgHeight = 800;

    /**
     * Gets or sets the width of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgWidth = 800;

    /**
     * Gets or sets the CSS class of the control. This property is observable.
     * @type {String}
     */
    this.cssClass = 'data-catalog-control-icon';

};

defineProperties(CatalogItemDownloadControl.prototype, {

    /**
     * Gets the CatalogItem instance that this control is associated with.
     * @memberOf CatalogItemDownloadControl.prototype
     * @type {CatalogItem}
     */
    item : {
        get : function() {
            return this._item;
        }
    }

});

/**
 * When implemented in a derived class, performs an action when the user clicks
 * on this control.
 * @abstract
 * @protected
 */
CatalogItemDownloadControl.prototype.activate = function() {
        if (!defined(this.item.url)) {
        throw new DeveloperError('This catalog item has no url to download from.');
    }
    var url = this.item.url;

    var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    var isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;


    //If in Chrome or Safari - download via virtual link click
    if (isChrome || isSafari) {
        //Creating new link node.
        var link = document.createElement('a');
        link.href = url;

        if (link.download !== undefined){
            //Set HTML5 download attribute. This will prevent file from opening if supported.
            var fileName = this.name.substring(0, this.name.lastIndexOf('(') - 1);
            link.download = fileName;
        }

        //Dispatching click event.
        if (document.createEvent) {
            var e = document.createEvent('MouseEvents');
            e.initEvent('click' ,true ,true);
            link.dispatchEvent(e);
            return true;
        }
    }

    // Force file download (whether supported by server).
    var query = 'download';
    if (url.indexOf('?') === -1) {
        query = '?download';
    } else {
        query = '&'+ query;
    }

    window.open(this.item.url + query);
};

module.exports = CatalogItemDownloadControl;