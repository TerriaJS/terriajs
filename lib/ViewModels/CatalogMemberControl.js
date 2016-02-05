'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

var UserInterfaceControl = require('./UserInterfaceControl');

var inherit = require('../Core/inherit');

/**
 * The view-model for a control in the data catalog associated with a catalog member
 *
 * @alias CatalogMemberControl
 * @constructor
 * @abstract
 *
 * @param {CatalogMember} catalogMember The CatalogMember instance.
 */
var CatalogMemberControl = function(catalogMember) {
    UserInterfaceControl.call(this, catalogMember.terria);

    this._member = catalogMember;

    /**
     * Gets or sets the text to be displayed as a button in the now viewing panel.
     * This property is observable.
     * @type {String}
     */
    this.text = "Unnamed Control";

    /**
     * Gets or sets the CSS class of the control. This property is observable.
     * @type {String}
     */
    this.cssClass = 'data-catalog-control-icon';

    /**
     * Gets or sets the name of the required property on the catalog member.
     * @type {String}
     */
    this.requiredPropertyName = undefined;

};

inherit(UserInterfaceControl, CatalogMemberControl);

defineProperties(CatalogMemberControl.prototype, {

    /**
     * Gets the CatalogMember instance that this control is associated with.
     * @memberOf CatalogMemberControl.prototype
     * @type {CatalogMember}
     */
    member : {
        get : function() {
            return this._member;
        }
    }

});

/**
 * Gets the required property from the catalog member.
 * @abstract
 * @protected
 */
CatalogMemberControl.prototype.requiredProperty = function() {
    if (!defined(this.requiredPropertyName)) {
        throw new DeveloperError('The required property name is not set.');
    }

    if (defined(this._member[this.requiredPropertyName])) {
        return this._member[this.requiredPropertyName];
    } else if (defined(this._member.customProperties[this.requiredPropertyName])) {
        return this._member.customProperties[this.requiredPropertyName];
    }

    throw new DeveloperError('The required property is not set on the catalog member.');
};

/**
 * When implemented in a derived class, performs an action when the user clicks
 * on this control.
 * @abstract
 * @protected
 */
CatalogMemberControl.prototype.activate = function() {
    throw new DeveloperError('activate must be implemented in the derived class.');
};


CatalogMemberControl._leftControls = {};
CatalogMemberControl._rightControls = {};


CatalogMemberControl.registerLeftSideControl = function(key, constructor, propertyName) {
    registerControl(key, constructor, propertyName, CatalogMemberControl._leftControls);
};


CatalogMemberControl.registerRightSideControl = function(key, constructor, propertyName) {
    registerControl(key, constructor, propertyName, CatalogMemberControl._rightControls);
};


CatalogMemberControl.leftSideMemberControls = function(catalogMember) {
    return getMemberControls(catalogMember, CatalogMemberControl._leftControls);
};


CatalogMemberControl.rightSideMemberControls = function(catalogMember) {
    return getMemberControls(catalogMember, CatalogMemberControl._rightControls);
};

function registerControl(key, constructor, propertyName, controlList) {
    if (!defined(key) || !defined(constructor) || !defined(propertyName)) {
        throw new DeveloperError('The key, constructor and required property name are all required.');
    }
    controlList[key] = {
        constructor: constructor,
        requiredPropertyName: propertyName
    };
}


function getMemberControls(catalogMember, controlList) {
    var controls = [];
    for (var key in controlList) {

        if (defined(catalogMember[controlList[key].requiredPropertyName]) ||
            defined(catalogMember.customProperties[controlList[key].requiredPropertyName])) {
            var Constructor = controlList[key].constructor;
            var control = new Constructor(catalogMember);
            control.requiredPropertyName = controlList[key].requiredPropertyName;
            controls.push(control);
        }
    }
    return controls;
}

module.exports = CatalogMemberControl;
