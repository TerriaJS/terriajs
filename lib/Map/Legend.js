/*global require*/
"use strict";

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var defined = require('terriajs-cesium/Source/Core/defined');

/** 
 * Legend object for generating and displaying a legend.
 * Constructor: new Legend(props), where props is an object containing many properties.
 * Other than the "items" property, it is best to leave other properties to their defaults
 * for consistency.
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
    this._items = props.items;

    /** @type {Number} Maximum height of the whole color bar */
    this._barHeightMax = defaultValue(props.barHeightMax, 130);

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
            return (this._itemHeight + this._itemSpacing) * this._items.length;
        }
    },
    height: {
        get: function() {
            return this._barTop + this.barHeight + this._itemHeight / 2; // add some spacing underneath
        }
    }
});


/** The older, non-quantised, smooth 
gradient accessible if user sets `colorBins=0` */
// TODO restore
/*function drawGradient(legend, gradH, colorMap) {
    var linGrad = legend._context.createLinearGradient(0,0,0,gradH);
    var colorStops = singleValueLegend ? 1 : colorMap.length;

    for (var i = 0; i < colorStops; i++) {
        linGrad.addColorStop(colorMap[i].offset, colorMap[i].color);
    }
    //put 0 at bottom
    legend._context.translate(legend._itemWidth + legend._barLeft, legend._context.canvas.height-5);
    legend._context.rotate(180 * Math.PI / 180);
    legend._context.fillStyle = linGrad;
    legend._context.fillRect(0,0,legend._itemWidth, gradH);

}
*/
/** Horizontal lines drawn across the smooth gradient, accompanied by labels */
/*
function drawTicks(legend, gradH, segments) {
    //TODO: if singleValue, but not singleValueLegend then place tic at correct ht between min/max
    for (var s = 1; s < segments; s++) {
        var ht = gradH * s / segments;
        legend._context.beginPath();
        legend._context.moveTo(0, ht);
        legend._context.lineTo(legend._itemWidth, ht);
        legend._context.stroke();
    }
}
*/
/** Labels drawn for certain values along a numeric scale. Hopefully we get rid of this soon. */
/*

 function drawNonBinLabels(legend, rampHeight, rampWidth, rampTop, segments, minVal, maxVal) {
    var minText = defined(minVal) ? (Math.round(minVal * 100) / 100).toString() : '';
    var maxText = defined(maxVal) ? (Math.round(maxVal * 100) / 100).toString() : '';

    legend._context.setTransform(1,0,0,1,0,0);
    legend._context.fillStyle = "#2F353C";
    legend._context.font = legend._minorLabelFont;


    if (minVal === maxVal) {
        legend._context.fillText(minText, rampWidth + 25, legend._context.canvas.height - rampHeight/2);
    }
    else {
        legend._context.fillText(maxText, rampWidth + 25, legend._context.canvas.height - rampHeight);
        legend._context.fillText(minText, rampWidth + 25, legend._context.canvas.height);
    }

    var val;
    if (defined(minVal) && defined(maxVal)) {
        for (var s = 1; s < segments; s++) {
            var textTop = rampHeight * (s + 0.5) / segments + rampTop + 3;
            val = minVal + (maxVal - minVal) * (segments-s) / segments;
            var valText = (Math.round(val * 100) / 100).toString();
            legend._context.fillText(valText, rampWidth + 25, textTop);
        }
    }
}
*/



/** A ramp of usually 3-9 discrete colors */
function drawItemBoxes(legend) {
    legend._items.forEach(function(item, i) {
        legend._context.fillStyle = defaultValue(item.color, '#0f0'); // undefined is intentionally ugly
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
/** The name of the active data variable, drawn above the ramp or gradient. */
function drawVariableName(legend) {

    legend._context.setTransform(1,0,0,1,0,0);
    legend._context.fillStyle = legend._variableNameColor;
    legend._context.font = legend._variableNameFont;
    legend._context.fillText(legend._title || '', 5, 12); //TODO what are 5, 12?
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
    var textOffsetX = 5;
    var textOffsetY = 3;
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
    canvas.height = legend.height; //singleValueLegend ? 60 : 160;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = legend._backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return canvas;

}


Legend.prototype.asPngUrl = function() {
    var canvas = initCanvas(this);
    this._context = canvas.getContext('2d');
    
    drawItemBoxes(this);
    drawItemLabels(this);

    drawVariableName(this);


    /*
    if (!this._binColors) {
        drawGradient(this, rampHeight, this.colorMap);
        drawTicks(this, rampHeight, singleValueLegend ? 0 : this.legendTicks+1);
    }*/
    /*
    var bins = defined(this._binColors) ? this._binColors.length : undefined;
    } else {
        drawNonBinLabels(this._context, rampHeight, rampWidth, rampTop, singleValueLegend ? 0 : this.legendTicks + 1, minVal, maxVal);
    }
    */
    return canvas.toDataURL("image/png");

};

module.exports = Legend;
