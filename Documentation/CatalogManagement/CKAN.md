CKAN is data catalogue software used by the Australian Government (http://data.gov.au), many Australian State Governments (eg http://data.sa.gov.au), the US government (http://data.gov), the UK government (http://data.gov.uk) and many others. Depending on its configuration, spatial files may be hosted directly (such as .geojson files), or it may contain links to WMS services.

CKAN does not have a simple filter for geospatial datasets, so the CKAN group type uses the CKAN API and several heuristics to attempt to locate them.

You can make this easier by:

- tagging all spatial CSV's `csv-geo-au`
- providing GeoJSON versions of all spatial files
