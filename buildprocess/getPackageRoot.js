'use strict';

/**
 * Gets the absolute path of the root directory of a given npm package.  The package must have a package.json file.
 * @param {String} packageName The package name.
 * @return {String} The absolute path of the package's root directory, or undefined if the package is not found.
 */
function getPackageRoot(packageName) {
    var packageJsonPath = require.resolve(packageName + '/package.json');
    if (!packageJsonPath) {
        return undefined;
    }
    var packageJsonIndex = packageJsonPath.lastIndexOf('package.json');
    if (packageJsonIndex === packageJsonPath.length - 'package.json'.length) {
        return packageJsonPath.substring(0, packageJsonIndex - 1);
    }
    return undefined;
}

module.exports = getPackageRoot;
