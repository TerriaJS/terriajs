'use strict';

/*global require*/

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

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
