'use strict';

/*global require*/

var runLater = function(functionToRunLater) {
    setTimeout(functionToRunLater, 0);
};

module.exports = runLater;
