## Guide to WPS parameters: which UI elements they map to

When developing a WPS service for TerriaJS, there are a number of inputs that are translated directly to UI widgets.
This table outlines how the widgets are chosen for the input parameters.

| Input type      | Parameter                                                | Widget type                                                                |
|-----------------|----------------------------------------------------------|----------------------------------------------------------------------------|
| LiteralData     | AllowedValues provided                                   | Dropdown using values specified                                            |
| LiteralData     | AnyValue                                                 | Input field that takes text                                                |
| ComplexData     | Schema http://www.w3.org/TR/xmlschema-2/#dateTime        | DateTime widget                                                            |
| ComplexData     | Schema http://geojson.org/geojson-spec.html#point        | Select point widget (will return geojson point selected)                   |
| ComplexData     | Schema http://geojson.org/geojson-spec.html#linestring   | Draw line widget (will return geojson line drawn on map)                   |
| ComplexData     | Schema http://geojson.org/geojson-spec.html#polygon      | Draw polygon widget (will return geojson polygon drawn on map)             |
| BoundingBoxData |                                                          | Draw rectangle widget (will return rectangle in OGC bounding box format)   |

