var require = {
    baseUrl: '.',
    paths: {
        'Cesium': './cesium/Source',
        'ui': './viewer',
        'domReady': './cesium/ThirdParty/requirejs-2.1.9/domReady',
        'knockout.mapping': './third_party/knockout.mapping'
    }, map: {
        '*': {
            'knockout': 'Cesium/ThirdParty/knockout'
        }
    },
    shim: {
        'ausglobe': {
            deps: ['ui/GlobalCesium'],
            exports: 'ausglobe'
        }
    }
};
