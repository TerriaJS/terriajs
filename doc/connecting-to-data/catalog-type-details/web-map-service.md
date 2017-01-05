To get quick performance in Terria, your server [must be configured with cached map tiles](http://docs.geoserver.org/latest/en/user/geowebcache/using.html). Ensure the cache is populated for every layer.

Map tiles should be served in 50ms or less, with 400ms considered the absolute maximum for acceptable user experience. To measure the speed, use the Dataset Testing tool:

1. Add `#tools=1` to the end of your Terria URL (for instance, `http://nationalmap.gov.au/#tools=1`)
2. Open the group you wish to test
3. Click `Tools` in the menu at the top right
4. Choose settings: `All Opened` tests every opened group, `All Enabled` tests only individual datasets that are selected. You can set a specific tile zoom range to test as well.
5. Click `Request Tiles`.

For each dataset, you will see whether all tiles were successfully retrieved, and the average and maximum response time.