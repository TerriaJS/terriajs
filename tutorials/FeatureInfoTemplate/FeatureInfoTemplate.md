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
              "featureInfoTemplate" : "Pixel colour: <b>Red={{Red}} Blue={{Blue}} Green={{Green}}</b>."
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

You can provide a template to use for the name of the collapsible section (eg. to replace `RGB` in the example above), like so:

              "featureInfoTemplate" : {
                  "template": "<div>Pixel colour: {{>foobar}}</div>",
                  "name": "Red {{Red}}"
              }

## More details

The template is rendered using [Mustache](https://github.com/janl/mustache.js#usage), so you can use all of its features here.

In particular, you can render properties that include html by using triple-braces, eg. `{{{property}}}`.

You can make use of partial templates (and even recursive templates) by specifying your template and partials as a json object, eg.:

              "featureInfoTemplate" : {
                  "template": "<div>Pixel colour: {{>foobar}}</div>",
                  "partials": {
                      "foobar": "<b>Red={{Red}} Blue={{Blue}} Green={{Green}}</b>"
                  }
              }

After Mustache has rendered the template, the result is displayed using [Markdown](https://help.github.com/articles/markdown-basics/), so you could also write:

              "featureInfoTemplate" : "Pixel colour: *Red={{Red}} Blue={{Blue}} Green={{Green}}*."
