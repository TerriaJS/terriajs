# Imagery Data

**Warning: This section needs to be updated for TerriaJS version 8.**

## Overview

Here's an example json file which places some sample WMS items in an open group called "WMS example", at the top of the catalog:

```json
{
  "catalog": [
    {
      "name": "WMS example",
      "type": "group",
      "isPromoted": true,
      "isOpen": true,
      "items": [
        {
          "name": "Solar Satellite DNI & GHI with datetime picker",
          "layers": "Solar_Satellite_DNI_2014",
          "url": "http://gis.aremi.nationalmap.gov.au/bom/wms",
          "type": "wms",
          "maxRefreshIntervals": 9000,
          "showDatetimePicker": true,
          "useOwnClock": true,
          "featureInfoTemplate": {
            "name": "{{GRAY_INDEX}} W/m2"
          }
        },
        {
          "name": "Solar Satellite DNI & GHI with initialTimeSource",
          "layers": "Solar_Satellite_DNI_2014",
          "url": "http://gis.aremi.nationalmap.gov.au/bom/wms",
          "type": "wms",
          "maxRefreshIntervals": 9000,
          "initialTimeSource": "2014-06-30T22:00:00Z",
          "featureInfoTemplate": {
            "name": "{{GRAY_INDEX}} W/m2"
          }
        }
      ]
    }
  ]
}
```

## Setting the default date

Use `initialTimeSource` to do this. The allowed values are a valid ISO8601 datestring, "present", "start" and "end".

## For more

For more information, check the descriptions under each of the [catalog items](../catalog-items.md) (eg. WMS).
