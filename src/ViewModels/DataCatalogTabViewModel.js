'use strict';

/*global require,ga*/
var ExplorerTabViewModel = require('./ExplorerTabViewModel');
var GeoDataInfoPopup = require('../viewer/GeoDataInfoPopup');
var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');

var DataCatalogTabViewModel = function(catalog) {
    ExplorerTabViewModel.call(this);

    this.name = 'Data Catalogue';
    this.catalog = catalog;

    this.svgCheckboxChecked = 'M29.548,3.043c-1.081-0.859-2.651-0.679-3.513,0.401L16,16.066l-3.508-4.414c-0.859-1.081-2.431-1.26-3.513-0.401c-1.081,0.859-1.261,2.432-0.401,3.513l5.465,6.875c0.474,0.598,1.195,0.944,1.957,0.944c0.762,0,1.482-0.349,1.957-0.944L29.949,6.556C30.809,5.475,30.629,3.902,29.548,3.043zM24.5,24.5h-17v-17h12.756l2.385-3H6C5.171,4.5,4.5,5.171,4.5,6v20c0,0.828,0.671,1.5,1.5,1.5h20c0.828,0,1.5-0.672,1.5-1.5V12.851l-3,3.773V24.5z';
    this.svgCheckboxUnchecked = 'M26,27.5H6c-0.829,0-1.5-0.672-1.5-1.5V6c0-0.829,0.671-1.5,1.5-1.5h20c0.828,0,1.5,0.671,1.5,1.5v20C27.5,26.828,26.828,27.5,26,27.5zM7.5,24.5h17v-17h-17V24.5z';
    this.svgArrowDown = 'M8.037,11.166L14.5,22.359c0.825,1.43,2.175,1.43,3,0l6.463-11.194c0.826-1.429,0.15-2.598-1.5-2.598H9.537C7.886,8.568,7.211,9.737,8.037,11.166z';
    this.svgArrowRight = 'M11.166,23.963L22.359,17.5c1.43-0.824,1.43-2.175,0-3L11.166,8.037c-1.429-0.826-2.598-0.15-2.598,1.5v12.926C8.568,24.113,9.737,24.789,11.166,23.963z';
    this.svgInfo = 'm 8.28,13.32 0,-6.12 1.44,0 0,6.12 0.72,0 0,0.36 -2.88,0 0,-0.36 0.72,0 0,0 z M 9,18 c 4.97056,0 9,-4.029437 9,-9 C 18,4.029437 13.97056,0 9,0 4.02944,0 0,4.029437 0,9 c 0,4.970563 4.02944,9 9,9 z m 0,-0.72 c 4.57292,0 8.28,-3.707082 8.28,-8.28 C 17.28,4.427082 13.57292,0.72 9,0.72 4.42708,0.72 0.72,4.427082 0.72,9 c 0,4.572918 3.70708,8.28 8.28,8.28 z M 7.56,7.2 l 0,0.36 0.72,0 0,-0.36 -0.72,0 z M 9,6.48 C 9.59647,6.48 10.08,5.996468 10.08,5.4 10.08,4.8035324 9.59647,4.32 9,4.32 8.40353,4.32 7.92,4.8035324 7.92,5.4 7.92,5.996468 8.40353,6.48 9,6.48 z';
};

inherit(ExplorerTabViewModel, DataCatalogTabViewModel);

DataCatalogTabViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/DataCatalogTab.html', 'utf8'), container, this);
};

DataCatalogTabViewModel.prototype.showInfo = function(item) {
    ga('send', 'event', 'dataSource', 'info', item.name);
    GeoDataInfoPopup.open({
        container : document.body,
        dataSource : item
    });
};

module.exports = DataCatalogTabViewModel;
