# 8. Remove conversion service

Date: 2022-03-15

## Status

Accepted

## Context

The GDAL conversion service `/convert/` was an important part of [NationalMap](https://nationalmap.gov.au/) when many users had small Shapefiles or MapInfo files to be visualised. The conversion service is now no longer useful for multiple reasons:

- We support visualising Shapefiles in the frontend (and can handle larger Shapefiles that our conversion service is usually configured to allow)
- The conversion service file size limit was too small for many files
- MapInfo files are uncommon and almost all geospatial vector data can now be found in GeoJSON, Shapefile or vector tile formats

While the `OgrCatalogItem` that calls the conversion service has never been ported to version 8, there was some ported code (and old documentation) that referred to the conversion service in various parts of terriajs. This ADR has been created to record the decision to discontinue the conversion service so that we can remove this old code and documentation.

## Decision

We will not support calling the terriajs-server conversion service from the TerriaJS library in any >=8.0.0 release.

## Consequences

All conversion service code, UI strings and docs have been removed from the terriajs library. The conversion service endpoint will be dropped from a future major version release of terriajs-server.
