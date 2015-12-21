/*global require*/
"use strict";

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var defined = require('terriajs-cesium/Source/Core/defined');

/** 
 * Legend object for generating and displaying a legend.
 * Constructor: new Legend(props), where props is an object containing many properties.
 * Other than the "items" property, it is preferable to leave other properties to their defaults
 * for style consistency.
 */

var Legend = function(props) {
    props = defaultValue(props, {});
    
    this._title = props.title;

    /** @type {Object[]} Items, ordered from bottom to top with properties:
        color: CSS color description,
        title: label placed level with middle of box
        titleAbove: label placed level with top of box
        titleBelow: label placed level with bottom of box
     */
    this._items = defaultValue(props.items, []);

    /** @type {ColorMap object} A color map used to draw a smooth gradient instead of discrete color boxes. */
    this._gradientColorMap = props.gradientColorMap;

    /** @type {Number} Maximum height of the whole color bar */
    this._barHeightMax = defaultValue(props.barHeightMax, 130);

    /** @type {Number} Minimum height of the whole color bar */
    this._barHeightMin = defaultValue(props.barHeightMax, 30);

    /** @type {Number} Width of each color box (and hence, the color bar) */
    this._itemWidth = defaultValue(props.itemWidth, 30);

    /** @type {Number} Forced height of each color box. Better to leave unset. */
    this._itemHeight = defaultValue(props.itemHeight, Math.min(this._barHeightMax / this._items.length, 30));

    /** @type {Number} Gap between each pair of color boxes. */
    this._itemSpacing = defaultValue(props.itemSpacing, 0);

    /** @type {Number} Spacing to the left of the color bar. */
    this._barLeft = defaultValue(props.barLeft, 15);

    /** @type {Number} Spacing above the color bar. */
    this._barTop = defaultValue(props.barTop, 22);

    /** @type {Number} Total width of the legend. */
    this._width = defaultValue(props.width, 210) ; // total width

    /** @type {String} CSS font string used for the main variable title. */
    this._variableNameFont = defaultValue(props.variableNameFont, '15px \'Roboto\', sans-serif');

    /** @type {String} CSS color string for the main variable title. */
    this._variableNameColor = defaultValue(props.variableNameColor, '#2F353C');

    /** @type {Number} Horizontal offset of variable title. */
    this._variableNameLeft = defaultValue(props.variableNameLeft, 5);

    /** @type {Number} Vertical offset of variable title. */
    this._variableNameTop = defaultValue(props.variableNameTop, 12);

    /** @type {String} CSS font string for item labels. */
    this._minorLabelFont = defaultValue(props.minorLabelFont, '14px \'Roboto\', sans-serif');

    /** @type {String} CSS font string for item labels when there are many. */
    this._minorLabelFontSmall = defaultValue(props.minorLabelFontSmall, '10px \'Roboto\', sans-serif');

    /** @type {String} CSS color string for item labels. */
    this._minorLabelColor = defaultValue(props.minorLabelColor, '#666');

    /** @type {String} CSS color string for tick that links titleAbove and titleBelow with boxes. */
    this._labelTickColor = defaultValue(props.labelTickColor, 'lightgray');

    /** @type {String} CSS color string for whole legend. */
    this._backgroundColor = defaultValue(props.backgroundColor, 'white'); // for consistency with other legends

    this._context = undefined;

};

defineProperties(Legend.prototype, {
    barHeight: { 
        get: function() {
            return Math.max((this._itemHeight + this._itemSpacing) * this._items.length, this._barHeightMin);
        }
    },
    height: {
        get: function() {
            return this._barTop + this.barHeight + this._itemHeight / 2; // add some spacing underneath
        }
    }
});


/** The older, non-quantised, smooth gradient. */
function drawGradient(legend) {
    var linGrad = legend._context.createLinearGradient(0,0,0,legend.barHeight);
    legend._gradientColorMap.forEach(function(c, i) {
        linGrad.addColorStop(1 - c.offset, c.color);
    });
    legend._context.fillStyle = linGrad;
    legend._context.fillRect(legend._barLeft, legend._barTop, legend._itemWidth, legend.barHeight);
}



/** 
 * Draw each of the colored boxes.
 */
function drawItemBoxes(legend) {
    legend._items.forEach(function(item, i) {
        if (!defined(item.color)) {
            return;
        }
        legend._context.fillStyle = item.color;
        legend._context.fillRect(
            legend._barLeft, 
            legend._barTop + (legend._itemHeight + legend._itemSpacing) * (legend._items.length - i - 1), 
            legend._itemWidth, 
            legend._itemHeight);

        // draw border on top
        legend._context.strokeStyle = "lightgray";
        legend._context.strokeRect(
            legend._barLeft, 
            legend._barTop + (legend._itemHeight + legend._itemSpacing) * (legend._items.length - i - 1), 
            legend._itemWidth, 
            legend._itemHeight);
    });
}

/** 
 * The name of the active data variable, drawn above the ramp or gradient.
 */
function drawVariableName(legend) {

    legend._context.setTransform(1,0,0,1,0,0);
    legend._context.fillStyle = legend._variableNameColor;
    legend._context.font = legend._variableNameFont;
    legend._context.fillText(legend._title || '', legend._variableNameLeft, legend._variableNameTop);
}

/** 
 * Label the thresholds between bins for numeric columns
 */
function drawItemLabels(legend) {
    function drawTick (y) {

        // draw a subtle tick to help indicate what the label refers to
        legend._context.strokeStyle = legend._labelTickColor;
        legend._context.beginPath();

        legend._context.moveTo(left, y);
        legend._context.lineTo(left + 5, y);
        legend._context.stroke();

    }
    legend._context.fillStyle = legend._minorLabelColor;

    legend._context.font = legend._items.length > 6 ? legend._minorLabelFontSmall : legend._minorLabelFont;

    var left = legend._barLeft + legend._itemWidth;
    var textOffsetX = 7;
    var textOffsetY = 3; // pixel shuffling to get the text to line up just right.
    legend._items.forEach(function(item, i) {
        var y = (legend._items.length - i - 1) * (legend._itemHeight + legend._itemSpacing) + legend._barTop;
        if (item.titleAbove) {
            legend._context.fillText(item.titleAbove, left + textOffsetX, y + textOffsetY);
            drawTick(y);
        }
        if (item.title) {
            legend._context.fillText(item.title, left + textOffsetX, y + legend._itemHeight / 2 + textOffsetY);
        }
        if (item.titleBelow) {
            legend._context.fillText(item.titleBelow, left + textOffsetX, y + legend._itemHeight + textOffsetY);
            drawTick(y + legend._itemHeight);
        }
    });
}

function initCanvas(legend) {
    var canvas = document.createElement("canvas");
    if (!defined(canvas)) {
        return;
    }
    canvas.width = legend._width;
    canvas.height = legend.height;
    return canvas;
}

function drawBackground(legend) {
    legend._context.fillStyle = legend._backgroundColor;
    legend._context.fillRect(0, 0, legend._width, legend.height);
}

/**
 * Generate legend as a PNG data URL.
 * @param  {Canvas object} canvas If provided, use this canvas to draw on.
 * @return {String}        PNG encoded as data URL.
 */
Legend.prototype.asPngUrl = function(canvas) {
    if (!defined(canvas)) {
        canvas = initCanvas(this);
    }
    this._context = canvas.getContext('2d');
    
    drawBackground(this);
    
    if (defined(this._gradientColorMap)) {
            drawGradient(this);
    }
    if (this._items.length > 0) {
        drawItemBoxes(this);
        drawItemLabels(this);
    }

    drawVariableName(this);

    return canvas.toDataURL("image/png");
};

module.exports = Legend;
