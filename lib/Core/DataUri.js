"use strict";

var DataUri = {
  /**
   * Turn a file with the supplied type and stringified data into a data uri that can be set as the href of an anchor tag.
   * @param {String} type Data type, eg. 'json' or 'csv'.
   * @param {String} dataString The data.
   * @return {String} A string that can be used to in an anchor tag's 'href' attribute to represent downloadable data.
   */
  make: function (type, dataString) {
    if (dataString) {
      // Using attachment/* mime type makes safari download as attachment. text/* works on Chrome (as does attachment).
      return "data:attachment/" + type + "," + encodeURIComponent(dataString);
    }
  }
};

module.exports = DataUri;
