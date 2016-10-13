## Guide to WPS parameters: which UI elements they map to

When developing a WPS service for TerriaJS, there are a number of inputs that are translated directly to UI widgets.
This table outlines how the widgets are chosen for the input parameters.

| Input type      | Parameter                                                | Parameter                   | Widget type                                                                |
|-----------------|----------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------|
| LiteralData     | AllowedValues provided                                   | Identifier not "regionType" | Dropdown using values specified                                            |
| LiteralData     | AnyValue                                                 | Identifier not "regionType" | Input field that takes text                                                |
| LiteralData     |                                                          | Identifier "regionType"     | RegionType widget populated with all known widget types                    |
| LiteralData     | AllowedValues provided                                   | Identifier "regionType"     | RegionType widget populated with region types that match allowed values    |
| ComplexData     | Schema http://www.w3.org/TR/xmlschema-2/#dateTime        |                             | DateTime widget                                                            |
| ComplexData     | Schema http://geojson.org/geojson-spec.html#multipolygon | Identifier "region"         | Select region widget (will return geojson multipolygon of region selected) |
| ComplexData     | Schema http://geojson.org/geojson-spec.html#point        |                             | Select point widget (will return geojson point selected)                   |
| ComplexData     | Schema http://geojson.org/geojson-spec.html#linestring   |                             | Draw line widget (will return geojson line drawn on map)                   |
| ComplexData     | Schema http://geojson.org/geojson-spec.html#polygon      | Identifier not "region"     | Draw polygon widget (will return geojson polygon drawn on map)             |
| ComplexData     | Schema http://geojson.org/geojson-spec.html              |                             | Draw point/polygon/region on map (will return geojson formatted result)    |
| BoundingBoxData |                                                          |                             | Draw rectangle widget (will return rectangle in OGC bounding box format)   |

