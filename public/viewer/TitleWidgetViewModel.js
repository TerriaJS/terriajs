/*global define*/
define([
    'ui/TitleWidgetViewModel',
    'knockout'
], function(
    TitleWidgetViewModel,
    knockout) {
    "use strict";

    var TitleWidgetViewModel = function() {
        this.title = 'National Map';
        this.menuItems = ['Map Information', 'Help', 'Fullscreen', 'Share'];

        knockout.track(this, ['title', 'menuItems']);
    };

    return TitleWidgetViewModel;
});
