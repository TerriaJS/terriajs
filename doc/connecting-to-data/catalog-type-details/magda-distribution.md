## Adding a record to data catalogue from magda website

A json data describing a magda record to be added to `TerriaMap` data catalogue should have the following properties:

- "name": "`<the name of magda record>`"

- "type": "magda"

- "recordId": "`<the ID of magda record>`"

- "url": "`<the url to magda website>`"

- "id": "`<the globally unique id of the record`"

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
                "url": "https://dev.magda.io/",
                "id": "data.gov.au-postMessage-dist-dga-548075a1-c36e-4837-bf26-cc00567b5c23"
                }
            ],
            "workbench": ["data.gov.au-postMessage-dist-dga-548075a1-c36e-4837-bf26-cc00567b5c23"]
        }
    ]
}
```
where the element in `workbench` array is the value of `id` (preferred) or `name` prepended with "//".
