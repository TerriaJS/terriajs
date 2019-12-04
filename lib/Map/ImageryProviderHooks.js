"use strict";
/* global require */
import i18next from "i18next";
var defined = require("terriajs-cesium/Source/Core/defined").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var ImageryProviderHooks = {};

ImageryProviderHooks.addRecolorFunc = function(imageryProvider, recolorFunc) {
  // Override requestImage to recolor the images.
  imageryProvider.base_requestImage = imageryProvider.requestImage;
  imageryProvider.requestImage = function(x, y, level) {
    var imagePromise = this.base_requestImage(x, y, level);
    if (!defined(imagePromise)) {
      return imagePromise;
    }

    return when(imagePromise, function(image) {
      if (defined(image)) {
        var context = getCanvasContext(imageryProvider, image);
        image = recolorImageWithCanvasContext(context, image, recolorFunc);
      }
      return image;
    });
  };
};

/* Recolor a raster image pixel by pixel, replacing encoded identifiers with some calculated value. */
ImageryProviderHooks.recolorImage = function(image, colorFunc) {
  var length = image.data.length; //pixel count * 4
  for (var i = 0; i < length; i += 4) {
    // Region identifiers are encoded in the blue and green channels, with R=0 and A=255
    if (image.data[i + 3] < 255 || image.data[i] !== 0) {
      // Set any pixel that is not part of a region completely transparent
      image.data[i + 3] = 0;
      continue;
    }
    // Convert the colour of a pixel back into the identifier of the region it belongs to
    var idx = image.data[i + 1] * 0x100 + image.data[i + 2];
    // Convert that identifier into the data-mapped colour it should display as.
    var clr = colorFunc(idx);
    if (defined(clr)) {
      for (var j = 0; j < 4; j++) {
        image.data[i + j] = clr[j];
      }
    } else {
      // This is a region but we don't have data for it, so make it transparent. Possibly should be configurable.
      image.data[i + 3] = 0;
    }
  }
  return image;
};

function getCanvasContext(imageryProvider, img) {
  var context = imageryProvider._canvas2dContext;
  if (
    !defined(context) ||
    context.canvas.width !== img.width ||
    context.canvas.height !== img.height
  ) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    context = canvas.getContext("2d");
    imageryProvider._canvas2dContext = context;
  }
  return context;
}

/* Copy an image to a newly created Canvas, then perform recoloring there. */
function recolorImageWithCanvasContext(context, img, colorFunc) {
  if (!defined(context)) {
    throw new DeveloperError(i18next.t("map.imageryProviderHooks.devError"));
  }

  // Copy the image contents to the canvas
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.drawImage(img, 0, 0);
  var image = context.getImageData(
    0,
    0,
    context.canvas.width,
    context.canvas.height
  );
  image = ImageryProviderHooks.recolorImage(image, colorFunc);
  return image;
}

ImageryProviderHooks.addPickFeaturesHook = function(imageryProvider, hook) {
  // Override pickFeatures to add more metadata.
  imageryProvider.base_pickFeatures = imageryProvider.pickFeatures;
  imageryProvider.pickFeatures = function(x, y, level, longitude, latitude) {
    var featurePromise = this.base_pickFeatures(
      x,
      y,
      level,
      longitude,
      latitude
    );
    if (!defined(featurePromise)) {
      return featurePromise;
    }
    return featurePromise.then(hook);
  };
};
module.exports = ImageryProviderHooks;
