/*global require*/
"use strict";

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var LegendUrl = require("./LegendUrl");

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
   * * `lineColor`: CSS color description,
   * * `multipleColors`: An array of CSS color descriptions.  A grid of these colors will be displayed in the box to the left of the item label.
   * * `title`: label placed level with middle of box
   * * `titleAbove`: label placed level with top of box
   * * `titleBelow`: label placed level with bottom of box
   * * `imageUrl`: url of image that will be drawn instead of a coloured box
   * * `imageWidth`, `imageHeight`: image dimensions
   * * `spacingAbove`: adds to itemSpacing for this item only.
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
   * Gets or sets the gap between each pair of color boxes.
   * @type {Number}
   * @default 0
   */
  this.itemSpacing = defaultValue(props.itemSpacing, 0);

  /**
   * Gets or sets the spacing to the left of the color bar.
   * @type {Number}
   * @default 5
   */
  this.barLeft = defaultValue(props.barLeft, 5);

  /**
   * Gets or sets the spacing between the title and color bar.
   * @type {Number}
   * @default 5
   */
  this.barTop = defaultValue(props.barTop, 5);

  /**
   * Gets or sets the forced total width of the legend.
   * @type {Number}
   * @default 310
   */
  this.width = defaultValue(props.width, 310);

  /**
   * Gets or sets the horizontal offset of variable title.
   * @type {Number}
   * @default 5
   */
  this.variableNameLeft = defaultValue(props.variableNameLeft, 5);

  /**
   * Gets or sets the vertical offset of variable title.
   * @type {Number}
   * @default 17
   */
  this.variableNameTop = defaultValue(props.variableNameTop, 17);

  /**
   * Gets or sets the CSS class that will be applied to the legend when it is displayed.
   * This is used to ensure that the correct font is used when measuring text for word wrapping.
   * @type {String}
   */
  this.cssClass = defaultValue(props.cssClass, "tjs-legend__legend");

  this._svg = undefined;
};

Object.defineProperties(Legend.prototype, {
  computedItemHeight: {
    get: function() {
      return defaultValue(
        this.itemHeight,
        Math.max(
          Math.min(this.barHeightMax / this.items.length, 30),
          this.itemHeightMin
        )
      );
    },
    set: function(h) {
      this.itemHeight = h;
    }
  }
});

function initSvg(legend) {
  legend._svgns = "http://www.w3.org/2000/svg";
  legend._svg = document.createElementNS(legend._svgns, "svg");
  //legend._svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  legend._svg.setAttribute("version", "1.1");
  legend._svg.setAttribute("width", legend.width);
  legend._svg.setAttribute(
    "class",
    "generated-legend now-viewing-legend-image-background"
  );
}

function finishSvg(legend, background, height) {
  background.setAttribute("height", height);
  legend._svg.setAttribute("height", height);
  legend._svg.setAttribute("style", "height: " + height + "px");

  // we create this temporary wrapper because IE doesn't allow innerHTML on SVG nodes.
  var temp = document.createElement("div");
  var node = legend._svg.cloneNode(true);
  temp.appendChild(node);
  return temp.innerHTML;
}

function addSvgElement(legend, element, attributes, className, innerText) {
  return legend._svg.appendChild(
    svgElement(legend, element, attributes, className, innerText)
  );
}

function svgElement(legend, element, attributes, className, innerText) {
  var ele = document.createElementNS(legend._svgns, element);
  Object.keys(attributes).forEach(function(att) {
    if (att.indexOf("xlink:") === 0) {
      ele.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        att.substring("xlink:".length),
        attributes[att]
      );
    } else {
      ele.setAttribute(att, attributes[att]);
    }
  });
  if (defined(innerText)) {
    ele.textContent = innerText;
  }
  if (defined(className)) {
    ele.setAttribute("class", className);
  }
  return ele;
}

/*
 * The name of the active data variable, drawn above the ramp or gradient.
 */
function drawVariableName(legend) {
  // Create a hidden DOM element to use to measure text.
  var measureElement = document.createElement("span");
  measureElement.className = legend.cssClass;
  measureElement.style.opacity = 0;
  measureElement.style.position = "fixed";

  document.body.appendChild(measureElement);

  var parts = (legend.title || "").split(" ");
  var start = 0;
  var end = parts.length;
  var y = legend.variableNameTop;

  while (start < parts.length) {
    var text = parts.slice(start, end).join(" ");
    measureElement.textContent = text;
    var dimensions = measureElement.getBoundingClientRect();

    // Add this text if it fits on the line, or if we're down to just one word.

    // Ideally, if we have one word and it doesn't fit on the line, we'd wrap
    // mid-word, but that would be a hassle: we'd have to find the portion of the
    // word that fits using a search-by-character much like the one we're already doing for
    // words.  Since this is a pretty unlikely corner case anyway (I hope), let's just
    // stick it all on one line and let the browser clip it on overflow.

    if (dimensions.width <= legend.width || start === end - 1) {
      addSvgElement(
        legend,
        "text",
        {
          x: legend.variableNameLeft,
          y: y
        },
        "variable-label",
        text
      );

      y += dimensions.height;
      start = end;
      end = parts.length;
    } else {
      --end;
    }
  }

  document.body.removeChild(measureElement);

  return y;
}

var gradientCount = 0;

/* The older, non-quantised, smooth gradient. */
function drawGradient(legend, barGroup, y) {
  var id = "terriajs-legend-gradient" + ++gradientCount;
  var defs = addSvgElement(legend, "defs", {}); // apparently it's ok to have the defs anywhere in the doc
  var linearGradient = svgElement(legend, "linearGradient", {
    x1: "0",
    x2: "0",
    y1: "1",
    y2: "0",
    id: id
  });
  legend.gradientColorMap.forEach(function(c, i) {
    linearGradient.appendChild(
      svgElement(legend, "stop", {
        offset: c.offset,
        "stop-color": c.color
      })
    );
  });
  defs.appendChild(linearGradient);

  var gradientItems = legend.items.filter(function(item) {
    return !defined(item.color);
  });

  var totalSpacingAbove = gradientItems.reduce(function(prev, item) {
    return prev + (item.spacingAbove || 0);
  }, 0);
  var barHeight = Math.max(
    (legend.computedItemHeight + legend.itemSpacing) * gradientItems.length +
      totalSpacingAbove,
    legend.barHeightMin
  );

  addSvgElement(
    legend,
    "rect",
    {
      x: legend.barLeft,
      y: y,
      width: legend.itemWidth,
      height: barHeight,
      fill: "url(#" + id + ")"
    },
    "gradient-bar"
  );

  return barHeight;
}

/*
 * Draw each of the colored boxes.
 */
function drawItemBoxes(legend, barGroup) {
  legend.items.forEach(function(item, i) {
    var itemTop = itemY(legend, i);

    if (defined(item.imageUrl)) {
      barGroup.appendChild(
        svgElement(
          legend,
          "image",
          {
            "xlink:href": item.imageUrl,
            x: 0,
            y: itemTop,
            width: Math.min(item.imageWidth, legend.itemWidth + 4), // let them overlap slightly
            height: Math.min(item.imageHeight, legend.computedItemHeight + 4)
          },
          "item-icon"
        )
      );
      return;
    }

    if (defined(item.multipleColors)) {
      var columns = Math.sqrt(item.multipleColors.length) | 0;
      var rows = Math.ceil(item.multipleColors.length / columns) | 0;

      var colorCount = item.multipleColors.length;
      var index = 0;
      var y = itemTop;

      for (var row = 0; index < colorCount && row < rows; ++row) {
        var height =
          row === rows - 1
            ? legend.computedItemHeight - (y - itemTop)
            : legend.computedItemHeight / rows;

        var x = 0;
        for (var column = 0; index < colorCount && column < columns; ++column) {
          var color = item.multipleColors[index++];

          var width =
            column === columns - 1
              ? legend.itemWidth - x
              : legend.itemWidth / columns;

          barGroup.appendChild(
            svgElement(
              legend,
              "rect",
              {
                fill: color,
                x: x,
                y: y,
                width: width,
                height: height
              },
              "item-box"
            )
          );

          x += width;
        }

        y += height;
      }
    } else if (defined(item.color)) {
      const rectAttributes = {
        fill: item.color,
        x: 0,
        y: itemTop,
        width: legend.itemWidth,
        height: legend.computedItemHeight
      };
      if (defined(item.lineColor)) {
        rectAttributes.stroke = item.lineColor;
      }
      barGroup.appendChild(
        svgElement(legend, "rect", rectAttributes, "item-box")
      );
    }
  });
}

/*
 * The Y position of the top of a given item number, relative to the top of the bar.
 */
function itemY(legend, itemNumber) {
  var cumSpacingAbove = legend.items
    .slice(itemNumber)
    .reduce(function(prev, item) {
      return prev + (item.spacingAbove || 0);
    }, 0);
  return (
    (legend.items.length - itemNumber - 1) *
      (legend.computedItemHeight + legend.itemSpacing) +
    cumSpacingAbove
  );
}

/*
 * Label the thresholds between bins for numeric columns, or the color boxes themselves in other cases.
 */
function drawItemLabels(legend, barGroup) {
  // draw a subtle tick to help indicate what the label refers to
  function drawTick(y) {
    barGroup.appendChild(
      svgElement(
        legend,
        "line",
        {
          x1: legend.itemWidth,
          x2: legend.itemWidth + 5,
          y1: y,
          y2: y
        },
        "tick-mark"
      )
    );
  }

  function drawLabel(y, text) {
    var textOffsetX = 7;
    var textOffsetY = 3; // pixel shuffling to get the text to line up just right.
    barGroup.appendChild(
      svgElement(
        legend,
        "text",
        {
          x: legend.itemWidth + textOffsetX,
          y: y + textOffsetY
        },
        "item-label" + (legend.items.length > 6 ? "-small" : ""),
        text
      )
    );
  }

  legend.items.forEach(function(item, i) {
    var y = itemY(legend, i);
    if (defined(item.titleAbove)) {
      drawLabel(y, item.titleAbove);
      drawTick(y);
    }
    if (defined(item.title)) {
      drawLabel(y + legend.computedItemHeight / 2, item.title);
    }
    if (defined(item.titleBelow)) {
      drawLabel(y + legend.computedItemHeight, item.titleBelow);
      drawTick(y + legend.computedItemHeight);
    }
  });

  return itemY(legend, -1);
}

function drawBackground(legend) {
  return addSvgElement(
    legend,
    "rect",
    {
      x: 0,
      y: 0,
      width: legend.width,
      height: 1 // reset in finishSvg
    },
    "background"
  ); // same class as in LegendSection.html
}

/**
 * Generate legend and return it as an SVG string
 * @return {String}
 */
Legend.prototype.drawSvg = function() {
  initSvg(this);
  var background = drawBackground(this);
  var y = drawVariableName(this);
  var barGroup = addSvgElement(
    this,
    "g",
    {
      transform: "translate(" + this.barLeft + "," + (y + this.barTop) + ")"
    },
    "legend-bar-group"
  );

  var gradientY = y + this.barTop;
  var labelsY = y + this.barTop;

  if (defined(this.gradientColorMap)) {
    gradientY += drawGradient(this, barGroup, gradientY);
  }

  if (this.items.length > 0) {
    drawItemBoxes(this, barGroup);
    labelsY += drawItemLabels(this, barGroup);
  }

  y = Math.max(gradientY, labelsY);

  return finishSvg(this, background, y + this.computedItemHeight / 2);
};

/**
 * Generate legend and return it as a data URI containing an SVG. Note that this SVG does
 * not contain inline styles.
 * @return {String}
 */
Legend.prototype.asSvgUrl = function() {
  return "data:image/svg+xml," + this.drawSvg();
};

/**
 * Return a LegendUrl object which actually contains the SVG as a property, .safeSvgContent.
 */

Legend.prototype.getLegendUrl = function() {
  var svg = this.drawSvg();
  var legendUrl = new LegendUrl("data:image/svg+xml," + svg, "image/svg+xml");
  legendUrl.safeSvgContent = svg;
  return legendUrl;
};

module.exports = Legend;
