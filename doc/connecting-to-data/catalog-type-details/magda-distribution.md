## Adding a record to data catalogue from magda website

A json data describing a magda record to be added to `TerriaMap` data catalogue should have the following properties:
1. "name": "`<the name of magda record>`"
2. "type": "magda"
3. "recordId": "`<the ID of magda record>`"
4. "url": "`<the url to magda website>`"

E.g. the [magda website](https://dev.magda.io/) can post the following message to a `TerriaMap` to visualise its record.
```
{
    "initSources": [
        {
            "catalog": [
                {
                "name": "Credit Licence Dataset - National Map",
                "type": "magda",
                "recordId": "dist-dga-548075a1-c36e-4837-bf26-cc00567b5c23",
                "url": "https://dev.magda.io/"
                }
            ],
            "workbench": ["//Credit Licence Dataset - National Map"]
        }
    ]
}
```
where the element in "workbench" array prepends "//" to the value of "name".
