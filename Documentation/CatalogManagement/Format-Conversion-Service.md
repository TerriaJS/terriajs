Certain file formats that are not directly supported by TerriaJS can be converted using a server-side conversion service, implemented by [TerriaJS Server](https://github.com/TerriaJS/terriajs-server).

Any [file format supported by the OGR suite](http://www.gdal.org/ogr_formats.html) (part of the GDAL spatial conversion library) is indirectly supported by first uploading it through an online conversion process. There are several limitations:

- the user must choose to allow this to happen
- files must be under 1MB
- the overall user experience is slower and less engaging than for natively supported file types

It is in general much better to convert files to a directly supported type, such as GeoJSON.
