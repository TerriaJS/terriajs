'use strict';

/*global require*/

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

/**
 * Tells the specified view-model to load itself and then runs a given function when the loading is complete.
 * If no loading is necessary, the function is invoked immediately.
 * 
 * @param {GeoDataMemberViewModel} viewModel The view-model to load.
 * @param {Function} callback The function to invoke when the view-model is done loading, or immediately if no loading is necessary.  The function is passed a reference to the view-model as its only parameter.
 */
var runWhenDoneLoading = function(viewModel, callback) {
    // Load first, if we haven't already.
    viewModel.load();

    // If we're still loading, delay this operation until the loading is complete.
    if (viewModel.isLoading) {
        var subscription = knockout.getObservable(viewModel, 'isLoading').subscribe(function(newValue) {
            if (newValue === false) {
                subscription.dispose();
                callback(viewModel);
            }
        });
    } else {
        callback(viewModel);
    }
};

module.exports = runWhenDoneLoading;
