'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');

var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

/**
 * A ViewModel of a Collapsible element.
 * @alias CollapsibleViewModel
 * @constructor
 *
 * @param {String} [name] The name to display on the collapsible title bar.
 * @param {Boolean} [isOpen] Whether to start open or closed (default is open).
*/
var CollapsibleViewModel = function(name, isOpen) {
    this.name = defaultValue(name, '');
    this.isOpen = defaultValue(isOpen, true);
    this.wrapper = undefined;
    this.container = undefined;

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;

    knockout.track(this, ['name', 'isOpen']);
};

/**
 * Shows this panel by adding it to the DOM inside a given container element.
 * @param {DOMNode} container The DOM node to which to add this panel.
 */
CollapsibleViewModel.prototype.show = function(container) {
    // first, move out and save any existing content
    this.container = container;
    this.wrapper = document.createElement('div');
    var nextNode;
    for (var node = container.firstChild; node; node = nextNode) {
        nextNode = node.nextSibling;
        this.wrapper.appendChild(node);
    }
    loadView(require('fs').readFileSync(__dirname + '/../Views/Collapsible.html', 'utf8'), container, this);
};

CollapsibleViewModel.prototype.destroy = function() {
    // to be consistent with other destroy methods (probably unnecessary)
    destroyObject(this);
};

CollapsibleViewModel.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

CollapsibleViewModel.prototype.renderCollapsible = function() {
    // this is not the ideal way to find the element with class .chart-inject
    // the first child is the <script> tag, etc
    var collapsibleContainer = this.container.children[1].children[1].children[0];
    // move back existing content
    var nextNode;
    for (var node = this.wrapper.firstChild; node; node = nextNode) {
        nextNode = node.nextSibling;
        collapsibleContainer.appendChild(node);
    }
};


module.exports = CollapsibleViewModel;
