'use strict';

/*global require*/

var CatalogMemberControl = require('./CatalogMemberControl');

var svgDownload = require('../SvgPaths/svgDownload');
var inherit = require('../Core/inherit');

/**
 * The view-model for a download control for catalog members. Clicking the control downloads the
 * resource defined in catalog member's "downloadUrl" parameter.
 *
 * @alias CatalogMemberDownloadControl
 * @constructor
 * @abstract
 *
 * @param {CatalogMember} catalogMember The CatalogMember instance.
 * @param {String} url The url to download from.
 */
var CatalogMemberDownloadControl = function(catalogMember) {
    CatalogMemberControl.call(this, catalogMember);

    /**
     * Gets or sets the name of the control which is set as the control's title.
     * This property is observable.
     * @type {String}
     */
    this.name = 'Download the data associated with this catalog member.';

    /**
     * Gets or sets the text to be displayed as a button in the now viewing panel.
     * This property is observable.
     * @type {String}
     */
    this.text = "Download";

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

};

inherit(CatalogMemberControl, CatalogMemberDownloadControl);

/**
 * When implemented in a derived class, performs an action when the user clicks
 * on this control.
 * @abstract
 * @protected
 */
CatalogMemberDownloadControl.prototype.activate = function() {

    var url = this.requiredProperty();

    var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    var isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;


    //If in Chrome or Safari - download via virtual link click
    if (isChrome || isSafari) {
        //Creating new link node.
        var link = document.createElement('a');
        link.href = url;

        if (link.download !== undefined){
            //Set HTML5 download attribute. This will prevent file from opening if supported.
            var urlPath = url.split('?')[0];
            var fileName = urlPath.substring(0, this.name.lastIndexOf('/') - 1);
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
        query = '?' + query;
    } else {
        query = '&'+ query;
    }

    window.open(url + query);
};

module.exports = CatalogMemberDownloadControl;