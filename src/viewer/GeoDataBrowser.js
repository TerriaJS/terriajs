"use strict";

/*global Cesium,require*/

var defineProperties = Cesium.defineProperties;
var getElement = Cesium.getElement;

var knockout = require('knockout');
var knockoutES5 = require('../../public/third_party/knockout-es5.js');

var GeoDataBrowserViewModel = require('./GeoDataBrowserViewModel');

var GeoDataBrowser = function(options) {
    var container = getElement(options.container);

    this._viewModel = new GeoDataBrowserViewModel({
        viewer : options.viewer,
        dataManager : options.dataManager,
        map : options.map
    });

    this._viewModel._dataButton = 'M15.701026,10.8708 h 29.569528 c 0.694648,0 1.09333,-0.729467 1.09333,-1.4241149 V 2.8614609 c 0,-0.693777 -0.398682,-1.5660037 -1.09333,-1.5660037 H 15.701026 c -0.692036,0 -1.545112,0.8722267 -1.545112,1.5660037 V 9.4466851 C 14.155044,10.141333 15.00899,10.8708 15.701026,10.8708 z M8.056421,1.2954572 H 1.1212616 c -0.6920361,0 -0.89398878,0.8722267 -0.89398878,1.5660037 v 6.5852242 c 0,0.6946479 0.20195268,1.4241149 0.89398878,1.4241149 H 8.056421 c 0.6946476,0 0.8757086,-0.729467 0.8757086,-1.4241149 V 2.8614609 c 0,-0.693777 -0.181061,-1.5660037 -0.8757086,-1.5660037 z M46.363014,23.420592 v -5.978496 c 0,-0.693777 -0.398683,-1.348382 -1.09333,-1.348382 H 15.701026 c -0.692036,0 -1.545112,0.654605 -1.545112,1.348382 v 6.585224 c 0,0.694648 0.853076,1.641736 1.545112,1.641736 h 21.870953 c 4.076484,-2.466086 8.791035,-2.25891 8.791035,-2.248464 z M8.056421,16.093714 H 1.1212616 c -0.6920361,0 -0.89398878,0.654605 -0.89398878,1.348382 v 6.585224 c 0,0.694648 0.20195268,1.641736 0.89398878,1.641736 H 8.056421 c 0.6946476,0 0.8757086,-0.947088 0.8757086,-1.641736 v -6.585224 c 0,-0.693777 -0.181061,-1.348382 -0.8757086,-1.348382 z M15.701026,30.89197 c -0.692036,0 -1.545112,0.436984 -1.545112,1.130761 v 6.585224 c 0,0.694648 0.853076,0.988872 1.545112,0.988872 h 8.97906 c 0.915751,-3.481943 2.655852,-6.0934 4.997458,-8.704857 H 15.701026 z M8.056421,30.89197 H 1.1212616 c -0.6920361,0 -0.89398878,0.436984 -0.89398878,1.130761 v 6.585224 c 0,0.694648 0.20195268,0.988872 0.89398878,0.988872 H 8.056421 c 0.6946476,0 0.8757086,-0.294224 0.8757086,-0.988872 v -6.585224 c 0,-0.693777 -0.181061,-1.130761 -0.8757086,-1.130761 z M46.580635,28.280513 c -9.495258,0 -17.192092,7.697705 -17.192092,17.192092 0,9.494388 7.696834,17.192093 17.192092,17.192093 9.495258,0 17.192092,-7.697705 17.192092,-17.192093 0,-9.494387 -7.696834,-17.192092 -17.192092,-17.192092 z m 7.61675,19.150685 h -5.222914 v 6.0934 h -5.222914 v -6.0934 H 38.528643 V 43.07877 h 5.222914 v -6.0934 h 5.222914 v 6.0934 h 5.222914 v 4.352428 z';
    this._viewModel._mapButton = 'M9.211561,15.971934 c 1.115754,-1.115754 2.868263,-1.435087 4.462061,-1.036399 1.593798,0.398689 1.752509,0.557399 2.947618,1.434132 1.19511,0.876732 2.151197,0.239022 3.346307,-0.717066 1.195109,-0.956088 2.310864,-1.593798 2.390219,-0.478044 0.07935,1.115754 0.07935,5.180083 0,6.772925 -0.07936,1.592842 0.63771,3.744039 -0.239022,5.895236 -0.876732,2.151197 -2.231509,3.026974 -3.02793,2.390219 -0.796421,-0.636754 -0.15871,-2.468618 -0.557399,-3.026973 -0.398688,-0.558355 -2.709552,-2.391175 -3.266951,-0.08031 -0.557399,2.310863 0.956088,3.506929 1.752509,3.904661 0.796421,0.397733 1.83282,2.151198 3.903705,2.39022 2.070886,0.239021 4.063373,0.397732 5.337838,2.469574 1.274464,2.071842 1.354776,4.301438 0.318377,5.337837 -1.036399,1.036399 -2.947618,0.159667 -3.266952,1.593798 -0.319333,1.434132 0.398689,1.752509 -0.557399,3.585329 -0.956087,1.83282 -1.593798,1.831864 -1.434131,4.142727 0.159666,2.310864 0.398688,4.780439 -1.513487,3.505974 -1.912175,-1.274465 -1.274465,-2.709553 -1.354776,-4.223039 -0.08031,-1.513487 -0.637711,-3.424706 -0.956088,-4.222083 -0.318377,-0.797377 -1.354776,-2.629241 -1.912175,-2.788908 -0.557399,-0.159666 -0.717066,-1.114798 -0.63771,-1.752508 0.07935,-0.637711 0.239021,-0.636755 -0.5574,-1.19511 -0.796421,-0.558355 -1.354776,-1.594754 -0.398688,-2.709552 0.956088,-1.114799 2.629241,-1.912176 3.346307,-2.629241 0.717065,-0.717066 -0.318378,-2.390219 -1.035443,-2.629241 -0.717066,-0.239023 -1.912176,-0.239023 -3.585329,-1.75251 C 11.042469,28.640095 10.48507,28.241407 9.768004,27.285319 9.0509382,26.329232 8.8119163,24.497368 9.6886487,22.90357 10.565381,21.309771 12.158223,20.832684 11.919201,19.557263 11.680179,18.281842 10.48507,17.962509 9.8473592,18.281842 9.2096488,18.601175 8.0145392,20.433039 7.0584516,19.23793 6.102364,18.04282 6.898785,17.803798 7.5364954,17.086732 8.1742059,16.369667 9.211561,15.971934 9.211561,15.971934 z M27.217559,15.254869 c 0.398689,-1.275421 0.717066,-1.196066 0.796421,-1.992487 0.07936,-0.796421 0.07936,-1.593798 -1.115754,-1.673153 -1.19511,-0.07936 -1.83282,0.558355 -2.390219,1.593798 -0.557399,1.035443 -0.159667,2.389263 -0.159667,2.947618 0,0.558355 -0.159666,1.435087 0.796421,1.275421 0.956088,-0.159667 0.717066,-0.877689 1.115755,-1.275421 0.398688,-0.397733 0.957043,-0.875776 0.957043,-0.875776 z M27.217559,22.504881 c 0,0 -0.239022,2.391175 1.274465,2.788908 1.513487,0.397732 1.991531,-0.239022 1.991531,-1.354777 0,-1.115754 -0.398689,-1.912175 0,-2.629241 0.398688,-0.717065 1.35382,-1.35382 1.513486,-0.318377 0.159667,1.035443 -0.15871,2.468619 1.115755,2.309908 1.274464,-0.158711 0.239022,-2.390219 1.434131,-2.151197 1.19511,0.239022 1.19511,1.275421 1.593798,2.47053 0.398689,1.19511 0.557399,2.628285 -0.239022,2.787952 -0.796421,0.159666 -1.274465,-0.557399 -2.310864,-0.557399 -1.036399,0 -2.469574,1.035443 -3.346306,1.912175 -0.876733,0.876732 -2.071842,2.070886 -2.071842,4.620772 0,2.549885 0.63771,3.984973 1.99153,4.382705 1.35382,0.397733 2.151198,-0.239978 2.708597,-0.797377 0.557399,-0.557399 0.876732,-0.398688 1.673153,0.717066 0.796421,1.115754 0.557399,1.355732 0.717066,3.187596 0.159666,1.831864 0,6.772925 0.159666,8.604789 0.159667,1.831864 0.637711,4.063372 1.752509,1.99153 1.114798,-2.071842 0.796421,-2.391175 1.195109,-3.984017 0.398689,-1.592842 0.478044,-3.663728 0.796421,-4.222083 0.318378,-0.558355 1.593799,-2.390219 1.912176,-3.505973 0.318377,-1.115755 0.558355,-1.274465 -0.07936,-2.230553 -0.63771,-0.956087 -2.071841,-1.354776 -1.99153,-2.071842 0.08031,-0.717065 0.239022,-0.796421 0.956088,-0.07935 0.717065,0.717066 1.115754,1.514443 1.99153,1.912175 0.875776,0.397733 2.071842,-0.07935 1.354776,-1.673153 -0.717065,-1.593798 -0.956087,-2.868263 -0.159666,-3.027929 0.796421,-0.159667 2.629241,0.15871 2.549885,1.99153 -0.07935,1.83282 -0.478043,5.737482 -0.398688,7.011947 0.07935,1.274465 0.07935,4.063372 0.796421,4.142727 0.717066,0.07936 1.035443,-1.99153 1.035443,-3.18664 0,-1.195109 0.239022,-2.47053 0.63771,-3.744995 0.398689,-1.274465 1.035443,-2.549886 1.991531,-1.912175 0.956087,0.63771 1.274465,1.274465 2.230552,2.390219 0.956088,1.115754 1.274465,0.159667 1.752509,-1.035443 0.478044,-1.19511 1.036399,-3.028886 1.83282,-3.426618 0.796421,-0.397732 1.99153,-0.636754 2.071842,-2.070886 0.08031,-1.434131 0.07935,-3.425662 -0.557399,-4.063372 -0.636755,-0.637711 -1.83282,-0.159667 -2.629241,-0.398689 -0.796421,-0.239022 -1.593799,-0.08031 -1.19511,-1.83282 0.398689,-1.752508 0.159667,-3.18664 0.876732,-3.664684 0.717066,-0.478044 2.151198,-0.478044 3.02793,-1.195109 0.876732,-0.717066 1.115754,-1.514443 0.557399,-2.071842 -0.558355,-0.557399 -1.514443,-1.911219 -1.83282,-2.54893 -0.318377,-0.63771 -2.390219,-0.717065 -3.266951,0.318377 -0.876733,1.035443 -2.549886,2.231509 -3.425662,3.984018 -0.875777,1.752508 -2.469575,0.796421 -3.02793,-0.637711 -0.558355,-1.434131 -1.195109,-2.152153 -1.673153,-2.549886 -0.478044,-0.397732 -1.513487,-1.27542 -0.876733,-1.912175 0.636755,-0.636754 1.831864,-0.875776 1.513487,-1.35382 -0.318377,-0.478044 -1.513487,0 -2.071842,0.717066 -0.558355,0.717066 -0.956087,1.99153 -2.230552,1.752508 -1.274465,-0.239021 -3.903706,-1.513486 -4.940105,-2.230552 -1.036399,-0.717066 -2.390219,-1.435088 -5.01946,1.592842 -2.629241,3.02793 -3.02793,3.107285 -3.425662,4.223039 -0.397733,1.115754 -0.236154,2.629241 -0.236154,2.629241 z M51.439083,44.415541 c 0,0 -1.434131,1.513487 -1.673153,3.18664 -0.239022,1.673154 0.318377,2.947618 0.717066,3.585329 0.398688,0.63771 1.195109,0.398688 1.912175,-0.557399 0.717066,-0.956088 0.796421,-1.19511 1.513487,-1.673154 0.717065,-0.478043 1.035443,-0.63771 1.593798,-0.159666 0.558355,0.478044 1.035443,1.036399 1.593798,0.876732 0.558355,-0.159666 0.478044,-0.15871 0.478044,-1.195109 0,-1.036399 -0.07936,-1.673154 -0.159667,-2.390219 -0.08031,-0.717066 -0.63771,-0.718022 -0.717066,-1.514443 -0.07935,-0.796421 0.159667,-1.592842 -0.318377,-1.513487 -0.478044,0.07935 -1.035443,0.876732 -1.195109,1.434132 -0.159667,0.557399 -1.035443,0.797377 -0.956088,0.398688 0.07935,-0.398688 -0.07935,-1.514443 -0.398689,-2.071842 -0.319333,-0.557399 -0.876732,-0.796421 -1.513486,0.159667 -0.636755,0.956087 -0.876733,1.434131 -0.876733,1.434131 z M51.836816,7.1262115 C 50.761217,7.6042553 50.246842,8.1721714 48.215156,7.4551056 46.495154,6.84799 34.47522,1.8304421 33.1606,1.2328874 31.84598,0.63533258 31.27902,0.73572179 30.322932,1.3332766 29.366844,1.9308313 20.54598,6.7017086 19.589892,7.1797524 18.633805,7.6577962 17.842164,8.0995087 15.929989,7.1434211 14.017813,6.1873335 0.44710565,0.27393146 0.44710565,0.27393146 V 56.445036 c 0,0 14.58033635,6.453591 15.65593535,6.931635 1.075598,0.478044 1.553642,0.358533 2.868262,-0.239022 1.314621,-0.597555 11.114519,-5.377993 12.190118,-5.975547 1.075598,-0.597555 1.792664,-0.358533 2.987774,0.239021 1.195109,0.597555 12.429139,5.377993 13.504737,5.856037 1.075599,0.478044 1.971453,0.836577 3.644606,-0.239022 1.673154,-1.075598 12.249395,-6.692613 12.249395,-6.692613 V 0.99195327 c 9.56e-4,0 -10.635519,5.65621443 -11.711117,6.13425823 z m 6.931635,46.3826795 c 0,0 -7.003342,3.568119 -8.417395,4.436246 -1.414054,0.866216 -2.145461,0.577477 -3.0547,0.192174 -0.910196,-0.385303 -12.375599,-5.511845 -13.386183,-5.993713 -1.010585,-0.481869 -2.540325,-0.354709 -3.449564,0.127159 -0.90924,0.480912 -9.226246,5.288121 -10.338176,5.769989 -1.110974,0.480912 -1.578501,0.577477 -2.48774,0.192174 C 16.725454,57.847616 5.2275438,52.648412 5.2275438,52.648412 V 7.5258561 c 0,0 9.6870802,4.6360689 11.3038242,5.4057199 1.615788,0.770606 2.411253,0.414942 3.220103,0.02868 0.807894,-0.384347 11.131728,-6.1409506 11.939622,-6.6228188 0.80885,-0.4809121 1.284026,-0.5621795 2.395956,-0.081267 1.110974,0.4818681 12.221668,5.4793378 13.675877,5.9688548 1.717134,0.577477 2.136856,0.120467 3.046096,-0.264836 0.909239,-0.384348 7.959429,-3.9572467 7.959429,-3.9572467 V 53.508891 z';
    this._viewModel._checkboxChecked = 'M29.548,3.043c-1.081-0.859-2.651-0.679-3.513,0.401L16,16.066l-3.508-4.414c-0.859-1.081-2.431-1.26-3.513-0.401c-1.081,0.859-1.261,2.432-0.401,3.513l5.465,6.875c0.474,0.598,1.195,0.944,1.957,0.944c0.762,0,1.482-0.349,1.957-0.944L29.949,6.556C30.809,5.475,30.629,3.902,29.548,3.043zM24.5,24.5h-17v-17h12.756l2.385-3H6C5.171,4.5,4.5,5.171,4.5,6v20c0,0.828,0.671,1.5,1.5,1.5h20c0.828,0,1.5-0.672,1.5-1.5V12.851l-3,3.773V24.5z';
    this._viewModel._checkboxUnchecked = 'M26,27.5H6c-0.829,0-1.5-0.672-1.5-1.5V6c0-0.829,0.671-1.5,1.5-1.5h20c0.828,0,1.5,0.671,1.5,1.5v20C27.5,26.828,26.828,27.5,26,27.5zM7.5,24.5h17v-17h-17V24.5z';
    this._viewModel._arrowDown = 'M8.037,11.166L14.5,22.359c0.825,1.43,2.175,1.43,3,0l6.463-11.194c0.826-1.429,0.15-2.598-1.5-2.598H9.537C7.886,8.568,7.211,9.737,8.037,11.166z';
    this._viewModel._arrowRight = 'M11.166,23.963L22.359,17.5c1.43-0.824,1.43-2.175,0-3L11.166,8.037c-1.429-0.826-2.598-0.15-2.598,1.5v12.926C8.568,24.113,9.737,24.789,11.166,23.963z';

    var wrapper = document.createElement('div');
    container.appendChild(wrapper);

    var dataButton = document.createElement('div');
    dataButton.className = 'ausglobe-panel-button';
    dataButton.title = 'Data';
    dataButton.innerHTML = '<div class="ausglobe-panel-button-image" data-bind="cesiumSvgPath: { path: $root._dataButton, width: 64, height: 64 }"></div>';
    dataButton.setAttribute('data-bind', 'click: toggleShowingPanel, css { "ausglobe-panel-button-panel-visible": showingPanel }');
    wrapper.appendChild(dataButton);

    var mapButton = document.createElement('div');
    mapButton.className = 'ausglobe-panel-button';
    mapButton.title = 'Map';
    mapButton.innerHTML = '<div class="ausglobe-panel-button-image" data-bind="cesiumSvgPath: { path: $root._mapButton, width: 64, height: 64 }"></div>';
    mapButton.setAttribute('data-bind', 'click: toggleShowingMapPanel, css { "ausglobe-panel-button-panel-visible": showingMapPanel }');
    wrapper.appendChild(mapButton);

    var dataPanel = document.createElement('div');
    dataPanel.id = 'ausglobe-data-panel';
    dataPanel.className = 'ausglobe-panel';
    dataPanel.setAttribute('data-bind', 'css: { "ausglobe-panel-visible" : showingPanel }');

    dataPanel.innerHTML = '\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openNowViewing">\
                <div class="ausglobe-accordion-item-header-label">Now Viewing</div>\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': nowViewingIsOpen }">\
                <div class="ausglobe-accordion-category">\
                    <div class="ausglobe-accordion-category-content ausglobe-accordion-category-content-visible" data-bind="visible: nowViewing().length > 0, foreach: nowViewing">\
                        <div class="ausglobe-accordion-category-item" draggable="true" data-bind="attr : { title : Title, nowViewingIndex : $index }, css: { \'ausglobe-accordion-category-item-enabled\': show }, event : { dragstart: $root.startNowViewingDrag, dragenter: $root.nowViewingDragEnter, dragend: $root.endNowViewingDrag }">\
                            <img class="ausglobe-nowViewing-dragHandle" draggable="false" src="images/Reorder.svg" width="12" height="24" alt="Drag to reorder data sources." />\
                            <div class="ausglobe-accordion-category-item-checkbox" data-bind="click: $root.toggleItemShown, visible: show, cesiumSvgPath: { path: $root._checkboxChecked, width: 32, height: 32 }"></div>\
                            <div class="ausglobe-accordion-category-item-checkbox" data-bind="click: $root.toggleItemShown, visible: !show(), cesiumSvgPath: { path: $root._checkboxUnchecked, width: 32, height: 32 }"></div>\
                            <div class="ausglobe-accordion-category-item-label" data-bind="text: Title, click: $root.zoomToItem"></div>\
                            <div class="ausglobe-accordion-category-item-infoButton" data-bind="click: $root.showInfoForItem">info</div>\
                        </div>\
                    </div>\
                    <div class="ausglobe-accordion-category-content ausglobe-accordion-category-content-visible" data-bind="visible: nowViewing().length === 0">\
                        <div class="ausglobe-now-viewing-no-data">\
                            Add data from the collections below.\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>\
        <div data-bind="foreach: content">\
            <div class="ausglobe-accordion-item">\
                <div class="ausglobe-accordion-item-header" data-bind="click: $root.openItem">\
                    <div class="ausglobe-accordion-item-header-label" data-bind="text: name"></div>\
                </div>\
                <div class="ausglobe-accordion-item-content" data-bind="foreach: Layer, css: { \'ausglobe-accordion-item-content-visible\': isOpen }">\
                    <div class="ausglobe-accordion-category">\
                        <div class="ausglobe-accordion-category-header" data-bind="click: $root.toggleCategoryOpen">\
                            <div class="ausglobe-accordion-category-header-arrow" data-bind="visible: isOpen(), cesiumSvgPath: { path: $root._arrowDown, width: 32, height: 32 }"></div>\
                            <div class="ausglobe-accordion-category-header-arrow" data-bind="visible: !isOpen(), cesiumSvgPath: { path: $root._arrowRight, width: 32, height: 32 }"></div>\
                            <div class="ausglobe-accordion-category-header-label" data-bind="text: name"></div>\
                        </div>\
                        <div class="ausglobe-accordion-category-loading" data-bind="visible: isLoading">Loading...</div>\
                        <div class="ausglobe-accordion-category-content" data-bind="foreach: Layer, css: { \'ausglobe-accordion-category-content-visible\': isOpen }">\
                            <div class="ausglobe-accordion-category-item" data-bind="css: { \'ausglobe-accordion-category-item-enabled\': isEnabled() }">\
                                <div class="ausglobe-accordion-category-item-checkbox" data-bind="click: $root.toggleItemEnabled, visible: isEnabled, cesiumSvgPath: { path: $root._checkboxChecked, width: 32, height: 32 }"></div>\
                                <div class="ausglobe-accordion-category-item-checkbox" data-bind="click: $root.toggleItemEnabled, visible: !isEnabled(), cesiumSvgPath: { path: $root._checkboxUnchecked, width: 32, height: 32 }"></div>\
                                <div class="ausglobe-accordion-category-item-label" data-bind="text: Title, click: $root.zoomToItem"></div>\
                                <div class="ausglobe-accordion-category-item-infoButton" data-bind="click: $root.showInfoForItem">info</div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openAddData">\
                <div class="ausglobe-accordion-item-header-label">Add Data</div>\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': addDataIsOpen }">\
                <div data-bind="foreach: userContent">\
                    <div class="ausglobe-accordion-category">\
                        <div class="ausglobe-accordion-category-header" data-bind="click: $root.toggleCategoryOpen">\
                            <div class="ausglobe-accordion-category-header-arrow" data-bind="visible: isOpen(), cesiumSvgPath: { path: $root._arrowDown, width: 32, height: 32 }"></div>\
                            <div class="ausglobe-accordion-category-header-arrow" data-bind="visible: !isOpen(), cesiumSvgPath: { path: $root._arrowRight, width: 32, height: 32 }"></div>\
                            <div class="ausglobe-accordion-category-header-label" data-bind="text: name"></div>\
                        </div>\
                        <div class="ausglobe-accordion-category-loading" data-bind="visible: isLoading">Loading</div>\
                        <div class="ausglobe-accordion-category-content" data-bind="foreach: Layer, css: { \'ausglobe-accordion-category-content-visible\': isOpen }">\
                            <div class="ausglobe-accordion-category-item" data-bind="css: { \'ausglobe-accordion-category-item-enabled\': isEnabled() }">\
                                <div class="ausglobe-accordion-category-item-checkbox" data-bind="click: $root.toggleItemEnabled, visible: isEnabled, cesiumSvgPath: { path: $root._checkboxChecked, width: 32, height: 32 }"></div>\
                                <div class="ausglobe-accordion-category-item-checkbox" data-bind="click: $root.toggleItemEnabled, visible: !isEnabled(), cesiumSvgPath: { path: $root._checkboxUnchecked, width: 32, height: 32 }"></div>\
                                <div class="ausglobe-accordion-category-item-label" data-bind="text: Title, click: $root.zoomToItem"></div>\
                                <div class="ausglobe-accordion-category-item-infoButton" data-bind="click: $root.showInfoForItem">info</div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
                <div class="ausglobe-accordion-category">\
                    <div class="ausglobe-add-data-message">\
                        Add data by dragging and dropping it onto the map, or\
                        <span class="ausglobe-upload-file-button" data-bind="click: selectFileToUpload">browse and select a file to load</span>.\
                        <input type="file" style="display: none;" id="uploadFile" data-bind="event: { change: addUploadedFile }"/>\
                    </div>\
                    <form class="ausglobe-user-service-form" data-bind="submit: addDataOrService">\
                        <label>\
                            <div>Enter a web link to add a data file or WMS/WFS service (advanced):</div>\
                            <input class="ausglobe-wfs-url-input" type="text" data-bind="value: wfsServiceUrl" />\
                        </label>\
                        <div>\
                            <input class="ausglobe-button" type="submit" value="Add" />\
                        </div>\
                    </form>\
                </div>\
            </div>\
        </div>';

    wrapper.appendChild(dataPanel);

    var mapPanel = document.createElement('div');
    mapPanel.className = 'ausglobe-panel';
    mapPanel.setAttribute('data-bind', 'css: { "ausglobe-panel-visible" : showingMapPanel }');

    mapPanel.innerHTML = '\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openImagery">\
                <div class="ausglobe-accordion-item-header-label">Imagery</div>\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': imageryIsOpen }">\
                <img class="ausglobe-imagery-option" src="images/AustralianTopography.png" width="73" height="74" data-bind="click: activateAustralianTopography" />\
                <img class="ausglobe-imagery-option" src="images/BingMapsAerialWithLabels.png" width="73" height="74" data-bind="click: activateBingMapsAerialWithLabels" />\
                <img class="ausglobe-imagery-option" src="images/BingMapsAerial.png" width="73" height="74" data-bind="click: activateBingMapsAerial" />\
                <img class="ausglobe-imagery-option" src="images/BingMapsRoads.png" width="73" height="74" data-bind="click: activateBingMapsRoads" />\
                <img class="ausglobe-imagery-option" src="images/NASABlackMarble.png" width="73" height="74" data-bind="click: activateNasaBlackMarble" />\
                <img class="ausglobe-imagery-option" src="images/NaturalEarthII.png" width="73" height="74" data-bind="click: activateNaturalEarthII" />\
            </div>\
        </div>\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openViewerSelection">\
                <div class="ausglobe-accordion-item-header-label">2D/3D</div>\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': viewerSelectionIsOpen }">\
                <label class="ausglobe-viewer-radio-button"><input type="radio" name="viewer" value="2D" data-bind="checked: selectedViewer" /> 2D</label>\
                <label class="ausglobe-viewer-radio-button"><input type="radio" name="viewer" value="Ellipsoid" data-bind="checked: selectedViewer" /> 3D Smooth Globe</label>\
                <label class="ausglobe-viewer-radio-button"><input type="radio" name="viewer" value="Terrain" data-bind="checked: selectedViewer" /> 3D Terrain</label>\
            </div>\
        </div>';

    wrapper.appendChild(mapPanel);

    knockout.applyBindings(this._viewModel, wrapper);
};

defineProperties(GeoDataBrowser.prototype, {
    viewModel : {
        get : function() {
            return this._viewModel;
        }
    }
});

module.exports = GeoDataBrowser;
