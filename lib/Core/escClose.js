'use strict';

var escClose = function(obj){
    var x = init.bind(obj);
    var key;
    function init (event) {
      key = event.which || event.keyCode;
      if(key === 27 && obj){
        obj.close();
        document.removeEventListener('keydown', x);
      }
    }
    document.addEventListener('keydown', x);
};

module.exports = escClose;
