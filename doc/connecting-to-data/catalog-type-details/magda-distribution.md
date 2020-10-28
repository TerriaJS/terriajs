## Adding a record to data catalogue from magda website

A json data containing the following properties can be used to add a record from a magda website to `TerriaMap` data catalogue.
1. "name": "`<the name of magda record>`"
2. "type": "magda"
3. "recordId": "`<the ID of magda record>`"
4. "url": "`<the url to magda website>`"

E.g. the [magda website](https://dev.magda.io/) can post the following message to a `TerriaMap` to visualise its record.
```
{
  "catalog": [
    {
      "name": "Credit Licence Dataset - National Map",
      "type": "magda",
      "recordId": "dist-dga-548075a1-c36e-4837-bf26-cc00567b5c23",
      "url": "https://dev.magda.io/"
    }
  ],
  "baseMapName": "Positron (Light)"
}
```
