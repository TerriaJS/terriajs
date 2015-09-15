'use strict';

/*global require*/

var CatalogMemberControl = require('./CatalogMemberControl');
var EmbeddedContentPopupViewModel = require('../ViewModels/EmbeddedContentPopupViewModel');
var svgBinoculars = require('../SvgPaths/svgBinoculars');
var inherit = require('../Core/inherit');

/**
 * The view-model for a download control for catalog items. Clicking the control shows the
 * embedded content in a popup.
 *
 * @alias CatalogMemberEmbeddedContentControl
 * @constructor
 * @abstract
 *
 * @param {CatalogItem} catalogMember The CatalogMember instance.
 * @param {String} url The url ofthe embedded content.
 */
var CatalogMemberEmbeddedContentControl = function(catalogMember) {
    CatalogMemberControl.call(this, catalogMember);

    /**
     * Gets or sets the name of the control which is set as the control's title.
     * This property is observable.
     * @type {String}
     */
    this.name = 'View the embedded content associated with this item.';

    /**
     * Gets or sets the text to be displayed as a button in the now viewing panel.
     * This property is observable.
     * @type {String}
     */
    this.text = "View Content";

    /**
     * Gets or sets the svg icon of the control.  This property is observable.
     * @type {Object}
     */
    this.svgIcon = svgBinoculars;

    /**
     * Gets or sets the height of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgHeight = 85.714;

    /**
     * Gets or sets the width of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgWidth = 85.714;

};

inherit(CatalogMemberControl, CatalogMemberEmbeddedContentControl);

/**
 * When implemented in a derived class, performs an action when the user clicks
 * on this control.
 * @abstract
 * @protected
 */
CatalogMemberEmbeddedContentControl.prototype.activate = function() {
    EmbeddedContentPopupViewModel.open({
        container: 'ui',
        url: this.requiredProperty(),
        title: this.member.name
    });
};

module.exports = CatalogMemberEmbeddedContentControl;