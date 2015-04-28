'use strict';

/*global require*/
var MenuBarItemViewModel = require('./MenuBarItemViewModel');
var ToolsPanelViewModel = require('./ToolsPanelViewModel');

var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var createToolsMenuItem = function(terria, container) {
    var showToolsMenuItem = knockout.computed(function() {
        var toolsProperty = terria.getUserProperty('tools');
        return defined(toolsProperty) && toolsProperty !== 'false' && toolsProperty !== 'no' && toolsProperty !== '0';
    });

    var toolsMenuItem = new MenuBarItemViewModel({
        visible: showToolsMenuItem(),
        label: 'Tools',
        tooltip: 'Advanced Tools.',
        callback: function() {
            ToolsPanelViewModel.open({
                container: container,
                terria: terria
            });
        }
    });

    showToolsMenuItem.subscribe(function(newValue) {
        toolsMenuItem.visible = newValue;
    });

    return toolsMenuItem;
};

module.exports = createToolsMenuItem;