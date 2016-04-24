# Config.json

The file `wwwroot/config.json` contains client-side configuration parameters.

It has this structure:

```
{
    "initializationUrls" : [
        "myinitfile",
        "anotherinitfile"
    ],
    "parameters": {
        "binMapsKey": "...",
        ...
    }
}
```


Option | Meaning
-------|--------
`"initializationUrls"` | Each string `"foo"` refers to a catalog (init) file found at `/wwwroot/init/foo.json`. These define all the datasets that will be loaded into the catalog. See [Initialization File](/Documentation/Initialization-File.md). 
`"parameters": {` | Key value pairs that configure Terria, as follows.
`"bingMapsKey"` | A [Bing Maps API key](https://msdn.microsoft.com/en-us/library/ff428642.aspx) used for requesting Bing Maps base maps and using the Bing Maps geocoder for searching. It is your responsibility to request a key and comply with all terms and conditions.
`"googleUrlShortenerKey"`| A Google API key for accessing the [Google URL Shortener service](https://developers.google.com/url-shortener/v1/getting_started#intro). This is required in order to generate short URLs on the "Share" page.
`"googleAnalyticsKey"`| A Google API key for Google Analytics.
`"googleAnalyticsOptions"`| Additional options that will be passed to the Google Analytics call.
`"disclaimer": {`<span><br/>`"text": "",`<br/>`"url": ""`<br/>`}`</span> | This text will be displayed prominently at the bottom of the map, with a clickable link to the URL.
`"developerAttribution": {`<span><br/>`"text": "Your organisation",`<br/>`"link": "http://www.example.com"`<br/>`}`<span> | This text is displayed somewhat less prominently at the bottom of the map.
`"appName"`| This title serves as the HTML `<title>` of the page and in various user text.
`"supportEmail"`| The email address shown when things go wrong.
`"brandBarElements": [ ]` | An array of HTML strings that fill up the top left logo space.

