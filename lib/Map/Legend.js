/*global require*/
"use strict";

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var defined = require('terriajs-cesium/Source/Core/defined');
var LegendUrl = require('./LegendUrl');

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
     * * `imageUrl`: url of image that will be drawn instead of a coloured box
     * * `imageWidth`, `imageHeight`: image dimensions
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
     * Gets or sets the CSS font family string used for the main variable title.
     * @type {String}
     * @default 'Roboto, sans-serif'
     */
    this.variableNameFontFamily = defaultValue(props.variableNameFontFamily, 'Roboto, sans-serif');

    /**
     * Gets or sets the CSS font size string used for the main variable title.
     * @type {String}
     * @default '15px'
     */
    this.variableNameFontSize = defaultValue(props.variableNameFontSize, '15px');

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
    this.variableNameTop = defaultValue(props.variableNameTop, 17);

    /**
     * Gets or sets the font family for item labels.
     * @type {String}
     * @default 'Roboto, sans-serif'
     */
    this.minorLabelFontFamily = defaultValue(props.minorLabelFont, 'Roboto, sans-serif');

    /**
     * Gets or sets the font size for item labels.
     * @type {String}
     * @default '14px'
     */
    this.minorLabelFontSize = defaultValue(props.minorLabelSize, '14px');

    /**
     * Gets or sets the font size for item labels when there are many.
     * @type {String}
     * @default '10px'
     */
    this.minorLabelFontSizeSmall = defaultValue(props.minorLabelSize, '10px');

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
    this.backgroundColor = defaultValue(props.backgroundColor, '#eee'); // for consistency with other white-background legends

    /**
     * Gets or sets CSS color string for border of whole legend.
     * @type {String}
     * @default '#222'
     */
    this.borderColor = defaultValue(props.borderColor, '#222');

    this._svg = undefined;

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



function addSvgElement(legend, element, attributes, innerText) {
    return legend._svg.appendChild(svgElement(legend, element, attributes, innerText));
}

function svgElement(legend, element, attributes, innerText) {
    var ele = document.createElementNS(legend._svg.namespaceURI, element);
    Object.keys(attributes).forEach(function(att) {
        ele.setAttribute(att, attributes[att]);
    });
    if (defined(innerText)) {
        ele.innerHTML = innerText;
    }
    return ele;
}

/** The older, non-quantised, smooth gradient. */
function drawGradient(legend, ctx) {
    var defs = addSvgElement(legend, 'defs', {}); // apparently it's ok to have the defs anywhere in the doc
    var linearGradient = svgElement(legend, 'linearGradient', {
        x1: '0',
        x2: '0',
        y1: '1',
        y2: '0',
        id: 'gradient'
    });
    legend.gradientColorMap.forEach(function(c, i) {
        linearGradient.appendChild(svgElement(legend, 'stop', {
            offset: c.offset,
            'stop-color': c.color
        }));
    });
    defs.appendChild(linearGradient);
    addSvgElement(legend, 'rect', {
        x: legend.barLeft,
        y: legend.barTop,
        width: legend.itemWidth,
        height: legend.barHeight,
        fill: 'url(#gradient)'
    });
}

/**
 * Draw each of the colored boxes.
 */
function drawItemBoxes(legend, ctx) {
    legend.items.forEach(function(item, i) {
        var itemLeft = legend.barLeft;
        var itemTop = itemY(legend, i);

        if (defined(item.imageUrl)) {
            addSvgElement(legend, 'image', {
                'xlink:href': item.imageUrl, 
                x: itemLeft,
                y: itemTop,
                width: Math.min(item.imageWidth, legend.itemWidth + 4), // let them overlap slightly
                height: Math.min(item.imageHeight, legend.itemHeight + 4)
            });
            return;
        } 
        
        if (!defined(item.color)) {
            return;
        }
        addSvgElement(legend, 'rect', {
            fill: item.color,
            stroke: 'lightgray',
            x: legend.barLeft,
            y: legend.barTop + (legend.itemHeight + legend.itemSpacing) * (legend.items.length - i - 1),
            width: legend.itemWidth,
            height: legend.itemHeight
        });
    });
}

/**
 * The name of the active data variable, drawn above the ramp or gradient.
 */
function drawVariableName(legend, ctx) {
    addSvgElement(legend, 'text', {
        fill: legend.variableNameColor,
        'font-family': legend.variableNameFontFamily,
        'font-size': legend.variableNameFontSize,
        x: legend.variableNameLeft,
        y: legend.variableNameTop
    }, legend.title || '');
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
    var left = legend.barLeft + legend.itemWidth;

    // draw a subtle tick to help indicate what the label refers to
    function drawTick (y) {
        addSvgElement(legend, 'line', {
            x1: left,
            x2: left + 5,
            y1: y,
            y2: y,
            stroke: legend.labelTickColor
        });
    }

    function drawLabel(y, text) {
        var textOffsetX = 7;
        var textOffsetY = 3; // pixel shuffling to get the text to line up just right.
        addSvgElement(legend, 'text', {
            x: left + textOffsetX, 
            y: y + textOffsetY,
            fill: legend.minorLabelColor,
            'font-family': legend.minorLabelFontFamily,
            'font-size': legend.items.length > 6 ? legend.minorLabelFontSizeSmall : legend.minorLabelFontSize
        }, text);
    }

    legend.items.forEach(function(item, i) {
        var y = itemY(legend, i);
        if (item.titleAbove) {
            drawLabel(y, item.titleAbove);
            drawTick(y);
        }
        if (item.title) {
            drawLabel(y + legend.itemHeight / 2, item.title);
        }
        if (item.titleBelow) {
            drawLabel(y + legend.itemHeight, item.titleBelow);
            drawTick(y + legend.itemHeight);
        }
    });
}

function drawBackground(legend, ctx) {
    addSvgElement(legend, 'rect', {
        fill: legend.backgroundColor,
        x: 0,
        y: 0,
        width: legend.width,
        height: legend.height,
        stroke: legend.borderColor,
        'stroke-width': 1
    });
}

/**
 * Generate legend and return it as an SVG string
 * @return {String}
 */
Legend.prototype.drawSvg = function() {
    var svgns = 'http://www.w3.org/2000/svg';
    this._svg = document.createElementNS(svgns, 'svg');
    this._svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this._svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    this._svg.setAttributeNS(svgns, 'version', "1.1");
    this._svg.setAttributeNS(svgns, 'width', this.width);
    this._svg.setAttributeNS(svgns, 'height', this.height);

    drawBackground(this);
    if (defined(this.gradientColorMap)) {
            drawGradient(this);
    }
    if (this.items.length > 0) {
        drawItemBoxes(this);
        drawItemLabels(this);
    }
    drawVariableName(this);

    return this._svg.outerHTML;
};

/**
 * Generate legend and return it as a data URI containing an SVG.
 * @return {String}
 */
Legend.prototype.asSvgUrl = function() {
    return "data:image/svg+xml," + this.drawSvg();
};

Legend.prototype.getLegendUrl = function() {
    var svg = this.drawSvg();
    var legendUrl = new LegendUrl('data:image/svg+xml,' + svg, 'image/svg+xml');
    legendUrl.svgContent = svg;
    return legendUrl;
};

module.exports = Legend;
