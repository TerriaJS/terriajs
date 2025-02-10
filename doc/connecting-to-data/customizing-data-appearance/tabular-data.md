# Tabular Data

**Warning: This page requires major changes to be updated for TerriaJS version 8.**

## Overview

When you drag and drop a csv file onto the map, TerriaJS chooses some display defaults
for you, including the size of the points, the color scale, how to cluster values in the
legend, and more.

You can gain control of these settings by writing a small json file. In fact the json
is exactly the same as the initialization file, and can be included there too.

Let's start with an example. Save this snippet as `example.json` and drag it onto the map.

```
{
    "catalog": [
        {
            "name": "Victorian postcodes",
            "type": "csv",
            "url": "https://raw.githubusercontent.com/TerriaJS/terriajs/5.2.4/wwwroot/test/csv/3000s.csv",
            "tableStyle": {
                "colorMap": "green-orange"
            }
        }
    ]
}
```

At first it will appear like nothing has happened. This is because json files instruct Terria to update the catalog, not directly add data onto the map.
So head back to the Data Catalog, and scroll to the bottom. You will see a new item called
"Victorian postcodes". Add this to the map.

Two things will happen. First, you will get a message telling you that many of the values
are not actually valid Australian postcodes. We'll fix that in a moment. Second, you will
see a swathe of yellow-green color across Victoria. Without the json, the csv file would
have appeared using the default shades of red.

To remove the invalid region name warning, just add this to the json (at the same level as "name" and "type"):

```
            "showWarnings": false,
```

This same option can be used with any tabular data type, eg. Sensor Observation Service and SDMX-JSON items as well.

Please note this documentation is still being developed, and does not cover everything
that is possible.
The definitive source of what you can do with `tableStyle` is this pair:

- [TableStyle](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/TableStyle.js)
- [TableColumnStyle](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/TableColumnStyle.js)

## Referencing your data

As you can see in the example above, you need to provide a URL to the csv data in the json file. If your data can be made accessible publicly, [github gists](https://gist.github.com/) are a convenient way to do this.

For small data files, you can embed the data directly in the json too, eg. instead of `"url"`, use:

```
            "data": "lon,lat,value\n134.384,-26.716,5\n121.659,-33.592,10"
```

## Manipulating time

### timeColumn

You can set which column controls the time slider by setting `timeColumn`:

```
            "tableStyle": {
                "timeColumn": "name-or-index-of-column"
            }
```

Use `"timeColumn": null` to remove the time slider altogether for this dataset.

### idColumns

If you have data that shows particular features over time, you can have a time-series plot of the
chosen column values to appear in the feature info panel when you click on a feature, so long
as you tell TerriaJS how to track individual features over time.

If your table has a time column and a column named `id`, this will happen automatically.

Otherwise, you can tell TerriaJS which column or columns to use for the feature ids, by setting
`idColumns` (this is on at the same level as the dataset's name or type, not inside `tableStyle`).
This should be an array of column names or indexes, eg.

```
        "idColumns": ["feature name"],
```

If your features have fixed lat/lon positions, you could use:

```
        "idColumns": ["lat", "lon"],
```

## Controlling how table columns appear in the workbench

### dataVariable

If you want the dataset to start with a different column selected, use `dataVariable`:

```
            "tableStyle": {
                "dataVariable": "name-or-index-of-column"
            }
```

### columns

If you want to change the appearance of individual columns, use `tableStyle`'s `columns` property, eg:

```
          "tableStyle": {
            "columns": {
              "original name": {
                "name": "better name",
                "format": {
                  "maximumFractionDigits": 0
                }
              },
              "bad": {
                  "type": "hidden"
              }
            }
          },
```

This example shows a few possibilities:

- A column called "original name" is displayed with the name "better name".
- The legend for that column is shown without any decimal places (`maximumFractionDigits` 0).
- A column in the original data called "bad" is hidden from the workbench.

The full list of options is in [TableColumnStyle](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/TableColumnStyle.js).

## Coloring

Use the following settings to adjust how points and regions are colored.

### colorMap

In the example above we specified the two ends of the color spectrum to use via the setting
`"colorMap": "green-orange"`, where `green` and `orange` are two colors in CSS format. In fact you can specify as many colors as you like, separated by hyphens, and the colors are evenly spaced over the range of values, eg.

```
                "colorMap": "red-white-hsl(240,50%,50%)"
```

If you want more control what fraction of the range each color should apply,
you can use this alternative syntax:

```
                "colorMap": [
                    {
                        "color": "rgba(0,0,200,1.0)",
                        "offset": 0
                    },
                    {
                        "color": "rgba(200,200,200,1.00)",
                        "offset": 0.6
                    },
                    {
                        "color": "rgba(200,0,0,1.00)",
                        "offset": 1
                    }
                ],
```

### colorBins

You can explicitly state how many colors (color "bins") you want to divide the data into, eg.

```
                "colorBins": 16
```

or, if you have specific boundaries in mind, you can list them, eg.

```
                "colorBins": [3000, 3100, 3800, 3850, 3950, 4000]
```

### colorPalette

To simplify the settings, you can specify a [ColorBrewer](http://colorbrewer2.org/)
palette directly, eg.

```
            "tableStyle": {
                "colorPalette": "10-class Set3",
                "colorBins": 10
            }
```

`"10-class BrBG"` is also a valid choice.

This property is ignored if colorMap is defined.

### colorBinMethod

Use this to force a particular method for quantizing colors.
The alternatives are "auto" (the default), "ckmeans", "quantile" or "none"
(equivalent to `"colorBins": 0`).

### imageUrl

For lat/lon datasets, if you want to use a particular image instead of a circle,
you can specify its url as the `imageUrl`, eg. in [test.json](https://raw.githubusercontent.com/TerriaJS/nationalmap/2017-05-15/wwwroot/init/test.json):

```
            "imageUrl": "test/images/pow32.png",
```

## Sizing

### scale

The size of each point (or image), eg.

```
            "tableStyle": {
                "scale": 2
            }
```

### scaleByValue

A Boolean for whether points should be scaled by the value of the selected `dataVariable`. Defaults to `false`.

```
            "tableStyle": {
                "scale": 2,
                "scaleByValue": true
            }
```

### minDisplayValue

All data values less than or equal to this are considered equal for the purpose of display.

### maxDisplayValue

All data values greater than or equal to this are considered equal for the purpose of display.

### clampDisplayValue

A Boolean - if true, display values that fall outside the display range show as min and max colors.

## Other settings

For a full list of the available settings, see the `TableStyle` and `TableColumnStyle` models mentioned earlier.

## More examples

Some examples are here:
[https://github.com/TerriaJS/terriajs/blob/master/wwwroot/test/init/test-tablestyle.json](https://github.com/TerriaJS/terriajs/blob/master/wwwroot/test/init/test-tablestyle.json)

You can add this directly to your catalog by appending `#build/TerriaJS/test/init/test-tablestyle.json` to the URL to your map, eg. `http://localhost:3001/#build/TerriaJS/test/init/test-tablestyle.json`.
