/*global require*/
"use strict";

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var defined = require('terriajs-cesium/Source/Core/defined');

/*
Legend object for generating and displaying a legend.
*/

/* props:

{
    title: ;
    items: [
        color: "..."
        title: "..."
        titleAbove: "..." ???
        titleBelow: "..." ???
    ]
    itemWidth: 30
    itemHeight: 30
    itemSpacing: 10
}
    // TODO: how to express labels between items - raiseTitle?


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

    this._itemWidth = defaultValue(props.itemWidth, 30);

    this._itemHeight = defaultValue(props.itemHeight, 130 / props.items.length);

    this._itemSpacing = defaultValue(props.itemSpacing, 10);

    this._itemLeft = 15;

    this._itemTop = 22;

    this._width = 210; // total width

    this._height = 160; // should be calculated ?

    this._context = undefined;

    this._variableNameFont = "15px 'Roboto', sans-serif";

    this._variableNameColor = "#2F353C";

    this._minorLabelFont = "14px 'Roboto', sans-serif";

    this._minorLabelFontSmall = "10px 'Roboto', sans-serif";

    this._minorLabelColor = "#666";

    this._labelTickColor = 'lightgray';

    this._backgroundColor = 'white'; // for consistency with other legends

};

defineProperties(Legend.prototype, {
    boxesHeight: { 
        get: function() {
            return (this._itemHeight + this._itemSpacing) * this._items.length;
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
    legend._context.translate(legend._itemWidth + legend._itemLeft, legend._context.canvas.height-5);
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

/** A ramp of usually 3-9 discrete colors */
function drawColorRamp(legend) {
    var items = legend._items.length;
    for (var i = 0; i < legend._items.length; i++) {
        legend._context.fillStyle = legend._items[i].color;
        legend._context.fillRect(
            legend._itemLeft, 
            legend._itemtop + legend._itemHeight *  (items - i - 1), 
            legend._itemWidth, 
            legend._itemHeight);

    }
}
/** The name of the active data variable, drawn above the ramp or gradient. */
function drawVariableName(legend) {

    legend._context.setTransform(1,0,0,1,0,0);
    legend._context.fillStyle = legend._variableNameColor;
    legend._context.font = legend._variableNameFont;
    legend._context.fillText(legend._title || '', 5, 12); //TODO what are 5, 12?
}

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

//TODO suport itemSpacing here and in drawing the boxes
/** Label the thresholds between bins for numeric columns */
function drawBinLabels(legend) {
    function drawTick (y) {

        // draw a subtle tick to help indicate what the label refers to
        legend._context.strokeStyle = legend._labelTickColor;
        legend._context.beginPath();

        legend._context.moveTo(left, y);
        legend._context.lineTo(left - 5, y);
        legend._context.stroke();

    }
    legend._context.fillStyle = legend._minorLabelColor;

    legend._context.font = legend._items.length > 6 ? legend._minorLabelFontSmall : legend._minorLabelFont;

    var left = legend._itemLeft + legend._itemWidth;
    legend._items.forEach(function(item, i) {
        var y = (legend._items.length - i - 1) * legend._itemHeight / legend._items.length + legend._itemTop;
        if (item.title) {
            legend._context.fillText(item.title, left + 2, y + 3);
        }
        if (item.titleAbove) {
            legend._context.fillText(item.titleAbove, left + 2, y  - legend.itemHeight / 2);
            drawTick(y - legend.itemHeight / 2);
        }
        if (item.titleBelow) {
            legend._context.fillText(item.titleBelow, left + 2, y  + legend.itemHeight / 2);
            drawTick(y + legend.itemHeight / 2);
        }
    });
}

/** Labels drawn for every item of a categorical scale. */
/*function drawEnumLabels(legend, height, width, top, labels, binCount) {
    legend._context.setTransform(1,0,0,1,0,0);
    legend._context.fillStyle = "#2F353C";
    legend._context.font = "12px lighter Roboto, sans-serif";

    for (var i = 0; i < binCount; i++) {
        legend._context.fillText(labels[binCount - i - 1], width + 25, height * (i + 0.5) / binCount + top );
    }
}
*/

function initCanvas(legend) {
    var canvas = document.createElement("canvas");
    if (!defined(canvas)) {
        return;
    }
    canvas.width = legend._width;
    canvas.height = legend._height; //singleValueLegend ? 60 : 160;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = legend._backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return canvas;

}


Legend.prototype.asPngUrl = function() {
    var canvas = initCanvas(this);
    this._context = canvas.getContext('2d');
    
    // draw border
    this._context.fillStyle = "lightgrey"; 
    this._context.fillRect(this._itemLeft - 1, this._itemTop - 1, this._itemWidth + 2, this.boxesHeight + 2);

    drawColorRamp(this);

    drawVariableName(this);
    drawBinLabels(this._context);


    /*
    if (!this._binColors) {
        drawGradient(this, rampHeight, this.colorMap);
        drawTicks(this, rampHeight, singleValueLegend ? 0 : this.legendTicks+1);
    }*/
    /*
    var bins = defined(this._binColors) ? this._binColors.length : undefined;
    if (dataVar.varType === VarType.ENUM) {
        drawEnumLabels(this._context, rampHeight, rampWidth, rampTop, dataVar.enumList, bins);
    } else if (bins) {
        //drawLabels(this._context, rampHeight, rampWidth, rampTop, singleValueLegend ? 0 : this.legendTicks + 2, minVal, maxVal);
        drawBinLabels(this._context, rampHeight, rampWidth + 20, rampTop, this._binColors, minVal, maxVal);
    } else {
        drawNonBinLabels(this._context, rampHeight, rampWidth, rampTop, singleValueLegend ? 0 : this.legendTicks + 1, minVal, maxVal);
    }
    */
    return canvas.toDataURL("image/png");

};