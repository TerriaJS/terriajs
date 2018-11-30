(function(global, factory) {
  if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
    // CommonJS support
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    // Do AMD support
    define(["loadJS"], factory);
  } else {
    // Do browser support
    global.loadJS = factory();
  }
})(this, function() {
  var cache = {};

  function exec(options) {
    if (typeof options === "string") {
      options = {
        url: options
      };
    }

    var id = options.id || options.url;
    var script = cache[id];

    if (script) {
      console.log('load-js cache hit', id);
      return script;
    }

    if (!options.url && !options.text) {
      throw new Error("must provide a url or text to load");
    }

    script = document.createElement("script");
    script.charset = options.charset || "utf-8";
    script.type = options.type || "text/javascript";
    script.async = !!options.async;
    script.id = id;

    var head = document.getElementsByTagName("head")[0] || document.documentElement;
    var pending;

    if (options.url) {
      script.src = options.url;
      pending = loadScript(head, script);
    }
    else {
      script.text = options.text;
      pending = runScript(head, script);
    }

    if (options.cache !== false && id) {
      cache[id] = pending;
    }

    return pending;
  }

  function runScript(head, script) {
    head.appendChild(script);
    return Promise.resolve(script);
  }

  function loadScript(head, script) {
    return new Promise(function(resolve) {
      // Handle Script loading
      var done = false;

      // Attach handlers for all browsers
      //
      // References:
      // http://stackoverflow.com/questions/4845762/onload-handler-for-script-tag-in-internet-explorer
      // http://stevesouders.com/efws/script-onload.php
      //
      script.onload = script.onreadystatechange = function() {
        if (!done && (!this.readyState ||
              this.readyState === "loaded" ||
              this.readyState === "complete")) {
          done = true;

          // Get the module id that just finished and load it up!
          // var loadedSrc = script.getAttribute("src");

          // Handle memory leak in IE
          script.onload = script.onreadystatechange = null;
          resolve(script);
        }
      };

      head.appendChild(script);
    });
  }

  return function load(items) {
    return items instanceof Array ?
      Promise.all(items.map(exec)) :
      exec(items);
  }
});
