// json preview module
ckan.module('cesiumpreview', function (jQuery, _) {
    return {
        initialize: function () {
            var self = this;

//      var vis_server = 'http://localhost';  //local
            var vis_server = 'http://nationalmap.nicta.com.au/';

            var config = {
                "version": "0.0.03",
                "initSources": [{
                    "catalog": [{
                        "type": "group",
                        "name": "User-Added Data",
                        "description": "The group for data that was added by the user via the Add Data panel.",
                        "isUserSupplied": true,
                        "isOpen": true,
                        "items": [{
                            "type": "kml",
                            "name": "User Data",
                            "isUserSupplied": true,
                            "isOpen": true,
                            "isEnabled": true,
                            "url": "http://"
                        }]
                    }],
                    "catalogIsUserSupplied": true,
                    "homeCamera": {
                        "west": 105,
                        "south": -45,
                        "east": 155,
                        "north": -5
                    }

                }
                ]

            };
            // load dataset spatial extent as default home camera if available
            if (spatial != '') {
                extent = geojsonExtent(JSON.parse(spatial)); //[WSEN]
                if (extent[0] != extent[2]) {
                    config["initSources"][0]['homeCamera']['west'] = extent[0];
                    config["initSources"][0]['homeCamera']['south'] = extent[1];
                    config["initSources"][0]['homeCamera']['east'] = extent[2];
                    config["initSources"][0]['homeCamera']['north'] = extent[3];
                }
            }

            config["initSources"][0]['catalog'][0]['items'][0]['url'] = preload_resource['url'];
                if (preload_resource['url'].indexOf('http') !== 0) {
                    config["initSources"][0]['catalog'][0]['items'][0]['url'] = "http:" + preload_resource['url'];
                }
            config["initSources"][0]['catalog'][0]['items'][0]['type'] = preload_resource['format'].toLowerCase();

            if (config["initSources"][0]['catalog'][0]['items'][0]['type'] == 'wms' || config["initSources"][0]['catalog'][0]['items'][0]['type'] == 'wfs') {
                // if wms_layer specified in resource, display that layer/layers by default
                if (typeof preload_resource['wms_layer'] != 'undefined' && preload_resource['wms_layer'] != '') {
                    config["initSources"][0]['catalog'][0]['items'][0]['layers'] = preload_resource['wms_layer'];
                }
                else {
                    config["initSources"][0]['catalog'][0]['items'][0]['type'] = config["initSources"][0]['catalog'][0]['items'][0]['type'] + '-getCapabilities';
                }
            }
            if (config["initSources"][0]['catalog'][0]['items'][0]['type'] == 'arcgis rest api') {
                config["initSources"][0]['catalog'][0]['items'][0]['type'] = 'esri-mapServer-group';
            }
            var encoded_config = encodeURIComponent(JSON.stringify(config));
            var style = 'height: 600px; width: 100%; border: none;';
            var display = 'allowFullScreen mozAllowFullScreen webkitAllowFullScreen';

            var html = '<iframe src="' + vis_server + '#clean&start=' + encoded_config + '" style="' + style + '" ' + display + '></iframe>';

            console.log(html);

            self.el.html(html);
        }
    };
});
