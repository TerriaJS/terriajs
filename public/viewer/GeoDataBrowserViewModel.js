define([
        'Cesium/Core/defined',
        'Cesium/Core/defineProperties',
        'Cesium/Core/Rectangle',
        'Cesium/Widgets/createCommand',
        'ausglobe',
        'knockout',
        'knockout.mapping'
    ], function(
        defined,
        defineProperties,
        Rectangle,
        createCommand,
        ausglobe,
        knockout,
        komapping) {
    "use strict";

    var GeoDataBrowserViewModel = function(options) {
        this.content = options.content;

        this._dataManager = options.dataManager;
        this._map = options.map;

        this.showingPanel = false;
        this.openIndex = 0;

        var that = this;
        this._toggleShowingPanel = createCommand(function() {
            that.showingPanel = !that.showingPanel;
        });

        this._openItem = createCommand(function(item) {
            that.openIndex = that.content.indexOf(item);
        });

        this._toggleCategoryOpen = createCommand(function(item) {
            item.isOpen(!item.isOpen());
        });

        this._toggleItemEnabled = createCommand(function(item) {
            item.isEnabled(!item.isEnabled());

            if (item.isEnabled()) {
                enableItem(that, item);
            } else {
                disableItem(that, item);
            }
        });

        knockout.track(this, ['showingPanel', 'openIndex']);
    };

    defineProperties(GeoDataBrowserViewModel.prototype, {
        toggleShowingPanel : {
            get : function() {
                return this._toggleShowingPanel;
            }
        },

        openItem : {
            get : function() {
                return this._openItem;
            }
        },

        toggleCategoryOpen : {
            get : function() {
                return this._toggleCategoryOpen;
            }
        },

        toggleItemEnabled : {
            get : function() {
                return this._toggleItemEnabled;
            }
        }
    });

    function enableItem(viewModel, item) {
        var description = komapping.toJS(item);
        var layer = new ausglobe.GeoData({
            name: description.Name,
            type: description.type,
            extent: getOGCLayerExtent(description)
        });

        if (defined(description.url)) {
            layer.url = description.url;
        } else if (description.type === 'CKAN') {
            for (var i = 0; i < description.resources.length; i++) {
                if (description.resources[i].format.toUpperCase() === 'JSON') {
                    layer.url = description.resources[i].url;
                }
            }
        } else {
            // description.count = 100;
            layer.url = viewModel._dataManager.getOGCFeatureURL(description);
        }

        //pass leaflet map object if exists
        layer.map = viewModel._map;
        layer.proxy = description.proxy;

        item.layer = layer;

        viewModel._dataManager.sendLayerRequest(layer);
    }

    function disableItem(viewModel, item) {
        var index = viewModel._dataManager.layers.indexOf(item.layer);
        viewModel._dataManager.remove(index);
    }

    function getOGCLayerExtent(layer) {
        var rect;
        if (layer.WGS84BoundingBox) {
            var lc = layer.WGS84BoundingBox.LowerCorner.split(" ");
            var uc = layer.WGS84BoundingBox.UpperCorner.split(" ");
            rect = Rectangle.fromDegrees(parseFloat(lc[0]), parseFloat(lc[1]), parseFloat(uc[0]), parseFloat(uc[1]));
        }
        else if (layer.LatLonBoundingBox) {
            var box = layer.LatLonBoundingBox || layer.BoundingBox;
            rect = Rectangle.fromDegrees(parseFloat(box.minx), parseFloat(box.miny),
                parseFloat(box.maxx), parseFloat(box.maxy));
        }
        else if (layer.EX_GeographicBoundingBox) {
            var box = layer.EX_GeographicBoundingBox;
            rect = Rectangle.fromDegrees(parseFloat(box.westBoundLongitude), parseFloat(box.southBoundLatitude),
                parseFloat(box.eastBoundLongitude), parseFloat(box.northBoundLatitude));
        }
        else if (layer.BoundingBox) {
            var box = layer.BoundingBox;
            rect = Rectangle.fromDegrees(parseFloat(box.west), parseFloat(box.south),
                parseFloat(box.east), parseFloat(box.north));
        }
        return rect;
    }

    return GeoDataBrowserViewModel;
});
