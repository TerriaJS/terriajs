
module.exports = function(moduleID) {
    console.log(moduleID);
    return require('terriajs-cesium/Source/' + moduleID);
};
