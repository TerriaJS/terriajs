var loaderUtils = require("loader-utils");
var path = require("path");

module.exports = DirectoryLoaderPlugin;

function DirectoryLoaderPlugin(paths) {
  this.paths = paths;
}

DirectoryLoaderPlugin.prototype.apply = function (resolver) {
  var optPaths = this.paths;
  console.log("A" + optPaths);

  resolver.plugin("directory", function (request, callback) {
    var dirPath = this.join(request.path, request.request);
    var dirName = dirPath.substr(
      dirPath.lastIndexOf(path.sep) + path.sep.length
    );

    if (optPaths && optPaths.indexOf(dirPath) >= 0) {
      this.fileSystem.stat(
        dirPath,
        function (err, stat) {
          if (err || !stat || !stat.isDirectory()) {
            callback.log &&
              callback.log(
                request.path +
                  " doesn't exist or is not a directory (directory named)"
              );
            return callback();
          }

          try {
            request.resolved = true;
            callback.log = function () {
              console.log(arguments);
            };
            console.log(callback);
            return callback(null, null);
          } catch (e) {
            console.error(e);
            throw e;
          }
        }.bind(this)
      );
    }
    //} else {
    callback();
    //}
  });
};

DirectoryLoaderPlugin.loader = function (content) {
  //this.cacheable && this.cacheable();
  //if(!this.emitFile) throw new Error("emitFile is required from module system");
  //var query = loaderUtils.parseQuery(this.query);
  //var url = loaderUtils.interpolateName(this, query.name || "[hash].[ext]", {
  //    context: query.context || this.options.context,
  //    content: content,
  //    regExp: query.regExp
  //});
  //this.emitFile(url, content);
  //return "module.exports = __webpack_public_path__ + " + JSON.stringify(url) + ";";
  console.log("blah");
  return " hello ";
};
DirectoryLoaderPlugin.loader.raw = true;
