Add a `featureInfoTemplate` to the items in your catalog `json` file, like so:

    {
      "catalog": [
        {
          "name": "ArcGIS Server",
          "type": "group",
          "items": [
            {
              "name": "Gravity Anomaly two",
              "type": "esri-mapServer",
              "url": "http://www.ga.gov.au/gisimg/rest/services/earth_science/Geoscience_Australia_National_Geophysical_Grids/MapServer/6",
              "attribution" :
                {
                  "text" : "Geoscience Australia",
                  "link" : "http://www.ga.gov.au"
                },
              "featureInfoTemplate" : "Pixel colour: Red={{Red}} Blue={{Blue}} Green={{Green}}."
            }
          ]
        }
      ]
    }

The template will replace all occurrences of `{{property}}` with the value of the property for that feature.

The result is:

<img src="template.png">

instead of:

<img src="no_template.png">

CAVEAT: This currently only works on catalog items with an imagery layer, eg. ArcGIS and WMS.  It does not work with geojson.  We are working on it!
