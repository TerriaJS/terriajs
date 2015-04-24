'use strict';

/*global require*/
var MenuBarItemViewModel = require('./MenuBarItemViewModel');
var ToolsPanelViewModel = require('./ToolsPanelViewModel');

var defined = require('../../Cesium/Source/Core/defined');
var knockout = require('../../Cesium/Source/ThirdParty/knockout');

var createToolsMenuItem = function(application, container) {
    var showToolsMenuItem = knockout.computed(function() {
        var toolsProperty = application.getUserProperty('tools');
        return defined(toolsProperty) && toolsProperty !== 'false' && toolsProperty !== 'no' && toolsProperty !== '0';
    });

    var toolsMenuItem = new MenuBarItemViewModel({
        visible: showToolsMenuItem(),
        label: 'Tools',
        tooltip: 'Advance National Map Tools.',
        callback: function() {
            ToolsPanelViewModel.open({
                container: container,
                application: application
            });
        }
    });

    showToolsMenuItem.subscribe(function(newValue) {
        toolsMenuItem.visible = newValue;
    });

    return toolsMenuItem;
};

module.exports = createToolsMenuItem;