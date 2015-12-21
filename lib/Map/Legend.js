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
    
    this.title = props.title;

    /** @type {Object[]} Items, ordered from bottom to top with properties:
        color: CSS color description,
        title: label placed level with middle of box
        titleAbove: label placed level with top of box
        titleBelow: label placed level with bottom of box
     */
    this.items = defaultValue(props.items, []);

    /** @type {ColorMap object} A color map used to draw a smooth gradient instead of discrete color boxes. */
    this.gradientColorMap = props.gradientColorMap;

    /** @type {Number} Maximum height of the whole color bar */
    this.barHeightMax = defaultValue(props.barHeightMax, 130);

    /** @type {Number} Minimum height of the whole color bar */
    this.barHeightMin = defaultValue(props.barHeightMax, 30);

    /** @type {Number} Width of each color box (and hence, the color bar) */
    this.itemWidth = defaultValue(props.itemWidth, 30);

    /** @type {Number} Forced height of each color box. Better to leave unset. */
    this.itemHeight = defaultValue(props.itemHeight, Math.min(this.barHeightMax / this.items.length, 30));

    /** @type {Number} Gap between each pair of color boxes. */
    this.itemSpacing = defaultValue(props.itemSpacing, 0);

    /** @type {Number} Spacing to the left of the color bar. */
    this.barLeft = defaultValue(props.barLeft, 15);

    /** @type {Number} Spacing above the color bar. */
    this.barTop = defaultValue(props.barTop, 22);

    /** @type {Number} Total width of the legend. */
    this.width = defaultValue(props.width, 210) ; // total width

    /** @type {String} CSS font string used for the main variable title. */
    this.variableNameFont = defaultValue(props.variableNameFont, '15px \'Roboto\', sans-serif');

    /** @type {String} CSS color string for the main variable title. */
    this.variableNameColor = defaultValue(props.variableNameColor, '#2F353C');

    /** @type {Number} Horizontal offset of variable title. */
    this.variableNameLeft = defaultValue(props.variableNameLeft, 5);

    /** @type {Number} Vertical offset of variable title. */
    this.variableNameTop = defaultValue(props.variableNameTop, 12);

    /** @type {String} CSS font string for item labels. */
    this.minorLabelFont = defaultValue(props.minorLabelFont, '14px \'Roboto\', sans-serif');

    /** @type {String} CSS font string for item labels when there are many. */
    this.minorLabelFontSmall = defaultValue(props.minorLabelFontSmall, '10px \'Roboto\', sans-serif');

    /** @type {String} CSS color string for item labels. */
    this.minorLabelColor = defaultValue(props.minorLabelColor, '#666');

    /** @type {String} CSS color string for tick that links titleAbove and titleBelow with boxes. */
    this.labelTickColor = defaultValue(props.labelTickColor, 'lightgray');

    /** @type {String} CSS color string for whole legend. */
    this.backgroundColor = defaultValue(props.backgroundColor, 'white'); // for consistency with other legends

};

defineProperties(Legend.prototype, {
    barHeight: { 
        get: function() {
            return Math.max((this.itemHeight + this.itemSpacing) * this.items.length, this.barHeightMin);
        }
    },
    height: {
        get: function() {
            return this.barTop + this.barHeight + this.itemHeight / 2; // add some spacing underneath
        }
    }
});

/** The older, non-quantised, smooth gradient. */
function drawGradient(legend, ctx) {
    var linGrad = ctx.createLinearGradient(0,0,0,legend.barHeight);
    legend.gradientColorMap.forEach(function(c, i) {
        linGrad.addColorStop(1 - c.offset, c.color);
    });
    ctx.fillStyle = linGrad;
    ctx.fillRect(legend.barLeft, legend.barTop, legend.itemWidth, legend.barHeight);
}

/** 
 * Draw each of the colored boxes.
 */
function drawItemBoxes(legend, ctx) {
    legend.items.forEach(function(item, i) {
        if (!defined(item.color)) {
            return;
        }
        ctx.fillStyle = item.color;
        ctx.fillRect(
            legend.barLeft, 
            legend.barTop + (legend.itemHeight + legend.itemSpacing) * (legend.items.length - i - 1), 
            legend.itemWidth, 
            legend.itemHeight);

        // draw border on top
        ctx.strokeStyle = "lightgray";
        ctx.strokeRect(
            legend.barLeft, 
            legend.barTop + (legend.itemHeight + legend.itemSpacing) * (legend.items.length - i - 1), 
            legend.itemWidth, 
            legend.itemHeight);
    });
}

/** 
 * The name of the active data variable, drawn above the ramp or gradient.
 */
function drawVariableName(legend, ctx) {

    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = legend.variableNameColor;
    ctx.font = legend.variableNameFont;
    ctx.fillText(legend.title || '', legend.variableNameLeft, legend.variableNameTop);
}

/** 
 * Label the thresholds between bins for numeric columns
 */
function drawItemLabels(legend, ctx) {
    function drawTick (y) {

        // draw a subtle tick to help indicate what the label refers to
        ctx.strokeStyle = legend.labelTickColor;
        ctx.beginPath();

        ctx.moveTo(left, y);
        ctx.lineTo(left + 5, y);
        ctx.stroke();

    }
    ctx.fillStyle = legend.minorLabelColor;

    ctx.font = legend.items.length > 6 ? legend.minorLabelFontSmall : legend.minorLabelFont;

    var left = legend.barLeft + legend.itemWidth;
    var textOffsetX = 7;
    var textOffsetY = 3; // pixel shuffling to get the text to line up just right.
    legend.items.forEach(function(item, i) {
        var y = (legend.items.length - i - 1) * (legend.itemHeight + legend.itemSpacing) + legend.barTop;
        if (item.titleAbove) {
            ctx.fillText(item.titleAbove, left + textOffsetX, y + textOffsetY);
            drawTick(y);
        }
        if (item.title) {
            ctx.fillText(item.title, left + textOffsetX, y + legend.itemHeight / 2 + textOffsetY);
        }
        if (item.titleBelow) {
            ctx.fillText(item.titleBelow, left + textOffsetX, y + legend.itemHeight + textOffsetY);
            drawTick(y + legend.itemHeight);
        }
    });
}

function initCanvas(legend, ctx) {
    var canvas = document.createElement("canvas"); // let's just assume this could never fail.
    canvas.width = legend.width;
    canvas.height = legend.height;
    return canvas; 
}

function drawBackground(legend, ctx) {
    ctx.fillStyle = legend.backgroundColor;
    ctx.fillRect(0, 0, legend.width, legend.height);
}

/**
 * Generate legend and draw it to a canvas.
 * @param  {Canvas object} canvas If provided, use this canvas to draw on.
 * @return {Canvas object}
 */
Legend.prototype.drawCanvas = function(canvas) {
    if (!defined(canvas)) {
        canvas = initCanvas(this);
    }
    var ctx = canvas.getContext('2d');
    
    drawBackground(this, ctx);
    
    if (defined(this.gradientColorMap)) {
            drawGradient(this, ctx);
    }
    if (this.items.length > 0) {
        drawItemBoxes(this, ctx);
        drawItemLabels(this, ctx);
    }

    drawVariableName(this, ctx);

    return canvas;
};

/**
 * Generate legend as a PNG data URL.
 * @param  {Canvas object} canvas If provided, use this canvas to draw on.
 * @return {String}        PNG encoded as data URL.
 */
Legend.prototype.asPngUrl = function(canvas) {
    return this.drawCanvas(canvas).toDataURL("image/png");
};

module.exports = Legend;
