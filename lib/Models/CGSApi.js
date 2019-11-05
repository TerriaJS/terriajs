"use strict";

var loadWithXhr = require("../Core/loadWithXhr");

var API_KEY = "Api-Key j5SJa2YsiwOjzRPmVCywV";
var MAX_RESULTS = 5;

var CGSApi = function() {};

CGSApi.prototype.geoCode = function(searchTerm, rectangle, maxResults) {

  return loadWithXhr({
    url: "/search/api/v1/locations/search?query=" + searchTerm + "&limit=" + MAX_RESULTS,
    method: "GET",
    headers: { "Authorization": API_KEY },
    responseType: "json"
  }).then(
    function(data) {
      // Get the location of each result in list
      var results = [];
      var i;
      for (i = 0; i < data.results.length; i++) {
        var name = data.results[i].name;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              // Typical action to be performed when the document is ready:
              var response = JSON.parse(xhttp.responseText)
              var result = {
                name: name,
                location: {
                  longitude: response.geojson.bbox[2] - Math.abs(response.geojson.bbox[2] - response.geojson.bbox[0]) / 2,
                  latitude: response.geojson.bbox[3] - Math.abs(response.geojson.bbox[3] - response.geojson.bbox[1]) / 2
              }};
              results.push(result);
            }
        };
        xhttp.open("GET", "/search/api/v1/locations/geometry?query=" + name, false);
        xhttp.setRequestHeader("Authorization", API_KEY);
        xhttp.send();
      } 
      
      return results;
    }.bind(this)
  );
};

module.exports = CGSApi;
