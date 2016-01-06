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

    /**
     * Gets or sets the list of items, ordered from bottom to top, with properties:
     * * `color`: CSS color description,
     * * `title`: label placed level with middle of box
     * * `titleAbove`: label placed level with top of box
     * * `titleBelow`: label placed level with bottom of box
     * * `image`: instantiated Image element that will be drawn instead of a box
     * @type {Object[]}
     */
    this.items = defaultValue(props.items, []);

    /**
     * Gets or sets a color map used to draw a smooth gradient instead of discrete color boxes.
     * @type {ColorMap}
     */
    this.gradientColorMap = props.gradientColorMap;

    /**
     * Gets or sets the maximum height of the whole color bar, unless very many items.
     * @type {Number}
     * @default 130
     */
    this.barHeightMax = defaultValue(props.barHeightMax, 130);

    /**
     * Gets or sets the minimum height of the whole color bar.
     * @type {Number}
     * @default 30
     */
    this.barHeightMin = defaultValue(props.barHeightMax, 30);

    /**
     * Gets or sets the width of each color box (and hence, the color bar)
     * @type {Number}
     * @default 30
     */
    this.itemWidth = defaultValue(props.itemWidth, 30);

    /** 
     * Gets or sets the asbolute minimum height of each color box, overruling barHeightMax.
     * @type {Number}
     * @default 12
     */
    this.itemHeightMin = defaultValue(props.itemHeightMin, 12);

    /**
     * Gets or sets the forced height of each color box. Better to leave unset.
     * @type {Number}
     * @default the smaller of `props.barHeightMax / props.items.length` and 30.
     */
    this.itemHeight = props.itemHeight;

    /**
     * Gets or setes the gap between each pair of color boxes.
     * @type {Number}
     * @default 0
     */
    this.itemSpacing = defaultValue(props.itemSpacing, 0);

    /**
     * Gets or sets the spacing to the left of the color bar.
     * @type {Number}
     * @default 15
     */
    this.barLeft = defaultValue(props.barLeft, 15);

    /**
     * Gets or sets the spacing above the color bar.
     * @type {Number}
     * @default 22
     */
    this.barTop = defaultValue(props.barTop, 22);

    /**
     * Gets or sets the forced total width of the legend.
     * @type {Number}
     * @default 210 or 300, depending on width of items
     */
    this.width = props.width;

    /**
     * Gets or sets the CSS font string used for the main variable title.
     * @type {String}
     * @default '15px \'Roboto\', sans-serif'
     */
    this.variableNameFont = defaultValue(props.variableNameFont, '15px \'Roboto\', sans-serif');

    /**
     * Gets or sets the CSS color string for the main variable title.
     * @type {String}
     * @default  '#2F353C'
     */
    this.variableNameColor = defaultValue(props.variableNameColor, '#2F353C');

    /**
     * Gets or sets the horizontal offset of variable title.
     * @type {Number}
     * @default 5
     */
    this.variableNameLeft = defaultValue(props.variableNameLeft, 5);

    /**
     * Gets or sets the vertical offset of variable title.
     * @type {Number}
     * @default 12
     */
    this.variableNameTop = defaultValue(props.variableNameTop, 12);

    /**
     * Gets or sets CSS font string for item labels.
     * @type {String}
     * @default '14px \'Roboto\', sans-serif'
     */
    this.minorLabelFont = defaultValue(props.minorLabelFont, '14px \'Roboto\', sans-serif');

    /**
     * Gets or sets the CSS font string for item labels when there are many.
     * @type {String}
     * @default '10px \'Roboto\', sans-serif'
     */
    this.minorLabelFontSmall = defaultValue(props.minorLabelFontSmall, '10px \'Roboto\', sans-serif');

    /**
     * Gets or sets the CSS color string for item labels.
     * @type {String}
     * @default '#666'
     */
    this.minorLabelColor = defaultValue(props.minorLabelColor, '#666');

    /**
     * Gets or sets the CSS color string for tick that links titleAbove and titleBelow with boxes.
     * @type {String}
     * @default 'lightgray'
     */
    this.labelTickColor = defaultValue(props.labelTickColor, 'lightgray');

    /**
     * Gets or sets CSS color string for whole legend.
     * @type {String}
     * @default 'white'
     */
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
    },
    width: {
        get: function() {
            return defaultValue(this._width, longestTitle(this) > 20 ? 300 : 210);
        },
        set: function(w) {
            this._width = w;
        }
    },
    itemHeight: {
        get: function() {
            return defaultValue(this._itemHeight, Math.max(Math.min(this.barHeightMax / this.items.length, 30), this.itemHeightMin));
        },
        set: function(h) {
            this._itemHeight = h;
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
        var itemLeft = legend.barLeft;
        var itemTop = itemY(legend, i);

        if (defined(item.image)) {
            ctx.drawImage(item.image, itemLeft, itemTop);
            return;
        } 
        
        if (!defined(item.color)) {
            return;
        }
        ctx.fillStyle = item.color;
        ctx.fillRect(
            itemLeft, 
            itemTop, 
            legend.itemWidth, 
            legend.itemHeight);

        // draw border on top
        ctx.strokeStyle = "lightgray";
        ctx.strokeRect(
            itemLeft,
            itemTop,
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
 * The Y position of the top of a given item number.
 */
function itemY(legend, itemNumber) {
    return legend.barTop + (legend.items.length - itemNumber - 1) * (legend.itemHeight + legend.itemSpacing);
}

/**
 * Calculate the length, in characters, of the longest item title, titleAbove or titleBelow.
 * @param  {Object} legend
 * @return {Number} Length in characters
 */
function longestTitle(legend) {
    return legend.items.reduce(function(max, item) {
        return Math.max(max, defaultValue(item.titleAbove, '').length, defaultValue(item.title, '').length, defaultValue(item.titleBelow, '').length);
    }, 0);
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

    ctx.font = legend.minorLabelFont;
    if (legend.items.length > 6 || longestTitle(legend) > 20) { 
        ctx.font = legend.minorLabelFontSmall;
    }

    var left = legend.barLeft + legend.itemWidth;
    var textOffsetX = 7;
    var textOffsetY = 3; // pixel shuffling to get the text to line up just right.
    legend.items.forEach(function(item, i) {
        var y = itemY(legend, i);
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
 * @param  {Canvas} canvas If provided, use this canvas to draw on.
 * @return {Canvas}
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
 * @param  {Canvas} canvas If provided, use this canvas to draw on.
 * @return {String} PNG encoded as data URL.
 */
Legend.prototype.asPngUrl = function(canvas) {
    return this.drawCanvas(canvas).toDataURL("image/png");
};

module.exports = Legend;
