const StringParameter = require('./StringParameter');

const definition = { // in JSON
    "name": "Chlorophyll-a concentration (monthly)",
    "type": "wms",
    "url": "http://ereeftds.bom.gov.au/ereefs/tds/wms/ereefs/mwq_gridAgg_P1M",
    "description": "...",
    "abstract": "Chlorophyll-a, reflecting wavelengths in the green part of the visible light spectrum, is the substance that helps plants capture the sun’s energy. In the water, it indicates the presence of microscopic green algae (phytoplankton). While these plants are a natural part of the reef ecosystem, elevated numbers (a bloom) of phytoplankton signal elevated nutrient levels, especially nitrogen, in the water. Typical sources are runoff from excess fertiliser being applied to crops and, to a lesser extent in the Great Barrier Reef region, sewage contamination from urban areas.",
    "layers": "Chl_MIM_mean",
    "getFeatureInfoAsGeoJson": false,
    "parameters": {
        "ABOVEMAXCOLOR": "0xAF324B",
        "BELOWMINCOLOR": "transparent",
        "COLORSCALERANGE": "0,1",
        "FORMAT": "image/png",
        "LOGSCALE": "false",
        "NUMCOLORBANDS": "16",
        "PALETTE": "mwq_chl",
        "STYLES": "boxfill/mwq_chl",
        "TRANSPARENT": "true",
        "VERSION": "1.1.1"
    }
};

const defaults = {
    styles: '',
    parameters: {},
    tilingScheme: 'web-mercator',
    populateIntervalsFromTimeDimension: true,
    minScaleDenominator: undefined,
    maxRefreshIntervals: 1000,
    isGeoServer: false,
    isEsri: false,
    isNcWms: false,
    opacity: 0.6
};

const load = {
    tilingScheme: 'geographic',
    isEsri: true
};

const ui = {
    opacity: 0.93,
    styles: 'foo'
};


function Test() {
    this._layers = [
        defaults,
        load,
        definition,
        ui
    ];

    knockout.track(this, ['_layers']);

    knockout.defineProperty(this, '_combined', {
        get: function() {
            return this._layers.reduce((p, c) => combine(c, p), {});
        }
    });
}

Object.defineProperty(Test.prototype, 'name', {
    get: function() {
        return this._combined.name;
    },
    set: function(value) {
        this._layers[this._layers.length - 1] = set(this._layers[this._layers.length - 1], 'name', value);
    }
})

function addParameter(definition, parameter) {
    definition[parameter.id] = definition;
}

const CatalogMemberDefinition = {
};

addParameter(CatalogMemberDefinition, new StringParameter({
    id: 'name',
    name: 'Name',
    description: 'The name of this catalog item, to be displayed in the catalog and on the workbench.'
}));

addParameter(CatalogMemberDefinition, new StringParameter({
    id: 'description',
    name: 'Description',
    description: 'The description of this dataset, displayed to the user while browsing this dataset in the catalog.',
    markdown: true
}));

addParameter(CatalogMemberDefinition, new InfoParameter({
    id: 'info',
    name: 'Info',
    description: 'Additional information to display to the user while browsing this dataset in the catalog.'
}));

const groups = [
    {
        name: 'Core',
        items: [
            CatalogMemberDefinition.name.id,
            CatalogMemberDefinition.description.id
        ]
    }
];

const WebMapServiceDefinitionOld = [
    {
        title: 'Core',
        name: 'core',
        editor: PropertyEditorGroup,
        items: [
            {
                title: 'Name',
                name: 'name',
                description: 'The name of this catalog item, to be displayed in the catalog and on the workbench.',
                editor: PropertyEditorString
            },
            new StringParameter({
                terria: terria,
                id: 'name',
                name: 'Name',
                description: 'The name of this catalog item, to be displayed in the catalog and on the workbench.'
            }),
            {
                title: 'URL',
                name: 'url',
                description: 'The URL of the WMS server.\n\nAny provided query parameters are ignored; it is not necessary to provide a complete GetMap or GetCapabilities URL.',
                editor: PropertyEditorString
            },
            {
                title: 'Layers',
                name: 'layers',
                description: 'The names of the WMS layers to include. To specify multiple layers, separate them with a comma.',
                editor: PropertyEditorString
            }
        ]
    },
    {
        title: 'Server',
        name: 'server',
        editor: PropertyEditorGroup,
        items: [
            {
                title: 'Additional Parameters',
                name: 'parameters',
                description: 'Extra query parameters to pass to the server in GetMap and GetFeatureInfo requests.',
                editor: PropertyEditorString // TODO
            },
            {
                title: 'Treat 404 (Not Found) as error',
                name: 'treat404AsError',
                description: 'Whether to treat a GetMap response with HTTP status code 404 (Not Found) as an error.',
                editor: PropertyEditorBoolean
            },
            {
                title: 'Treat 403 (Forbidden) as error',
                name: 'treat403AsError',
                description: 'Whether to treat a GetMap response with HTTP status code 403 (Forbidden) as an error.',
                editor: PropertyEditorBoolean
            },
            {
                title: 'Ignore unknown tile errors',
                name: 'ignoreUnknownTileErrors',
                description: 'Whether to ignore errors with an unknown HTTP status code.',
                editor: PropertyEditorBoolean
            },
            {
                title: 'Clip to rectangle',
                name: 'clipToRectangle',
                description: 'Indicates whether this dataset should be clipped to its defined rectangle. If true, no part of the dataset will be displayed outside the rectangle and fewer tiles will be downloaded, improving performance.  However, it may also cause features to be cut off in some cases, such as if a server reports an extent that does not take into account that the representation of features sometimes require a larger spatial extent than the features themselves.  For example, if a point feature on the edge of the extent is drawn as a circle with a radius of 5 pixels, half of that circle will be cut off.',
                editor: PropertyEditorBoolean
            },
            {
                title: 'Cache duration',
                name: 'cacheDuration',
                description: 'The cache duration to use for proxied URLs for this catalog member.  If undefined, proxied URLs are effectively cachable forever. The duration is expressed as a Varnish-like duration string, such as \'1d\' (one day) or \'10000s\' (ten thousand seconds).',
                editor: PropertyEditorString
            },
            {
                title: 'Force use of proxy',
                name: 'forceProxy',
                description: 'Determines if this dataset should be forced to use the proxy. If true, the lists of domains known to be proxyable and the domains known to support Cross-Origin Resource Sharing (CORS) will be ignored.',
                editor: PropertyEditorBoolean
            },
            {
                title: 'Supports COLORSCALERANGE',
                name: 'supportsColorScaleRange',
                description: 'Determines if the WMS server supports the COLORSCALERANGE property. This is a non-standard extension support by ncWMS servers.',
                editor: PropertyEditorBoolean
            }
        ]
    },
    {
        title: 'Initial State',
        name: 'initialState',
        editor: PropertyEditorGroup,
        items: [
            {
                title: 'Initially on workbench (Enabled)',
                name: 'isEnabled',
                description: 'An enabled catalog item is shown on the workbench but not necessarily shown on the map.',
                editor: PropertyEditorBoolean
            },
            {
                title: 'Initially on map (Shown)',
                name: 'isShown',
                description: 'A shown catalog item is visible on the map.',
                editor: PropertyEditorBoolean
            },
            {
                title: 'Initially expanded on workbench',
                name: 'isLegendVisible',
                description: 'Is this dataset expanded on the workbench, revealing its details?',
                editor: PropertyEditorBoolean
            },
            {
                title: 'Automatically "zoom to" when enabled',
                name: 'zoomOnEnable',
                description: 'Should the map be zoomed to the rectangle of this catalog item when this catalog item is enabled?',
                editor: PropertyEditorBoolean
            }
        ]
    },
    {
        title: 'Map Display',
        name: 'map',
        editor: PropertyEditorGroup,
        items: [
            {
                title: 'Opacity',
                name: 'opacity',
                description: 'The opacity (alpha) of the dataset, where 0.0 is fully transparent and 1.0 is fully opaque',
                editor: PropertyEditorString
            },
            {
                title: 'Keep on top',
                name: 'keepOnTop',
                description: 'Keeps this dataset on top of all other raster datasets.',
                editor: PropertyEditorBoolean
            },
            {
                title: 'Attribution',
                name: 'attribution',
                description: 'An attribution displayed at the bottom of the map when this catalog item is enabled. This can be used to credit the source of the dataset.',
                editor: PropertyEditorString
            },
            {
                title: 'Styles',
                name: 'styles',
                description: 'The styles to use for each layer.',
                editor: PropertyEditorString // TODO
            },
            {
                title: 'Dimension values',
                name: 'dimensions',
                description: 'The values to use for each dimension. Note that WMS does not allow dimensions to be explicitly specified per layer, so the selected dimension values are applied to all layers with a corresponding dimension.',
                editor: PropertyEditorString // TODO
            },
            {
                title: 'Color scale minimum',
                name: 'colorScaleMinimum',
                description: 'The minimum of the color scale range. Because COLORSCALERANGE is a non-standard property supported by ncWMS servers, this property is ignored unless supportsColorScaleRange is true. colorScaleMaximum must be set as well.',
                editor: PropertyEditorString
            },
            {
                title: 'Color scale maximum',
                name: 'colorScaleMaximum',
                description: 'The maximum of the color scale range. Because COLORSCALERANGE is a non-standard property supported by ncWMS servers, this property is ignored unless supportsColorScaleRange is true. colorScaleMinimum must be set as well.',
                editor: PropertyEditorString
            }
        ]
    },
    {
        title: 'Info',
        name: 'info',
        editor: PropertyEditorGroup,
        items: [
            {
                title: 'Description',
                name: 'description',
                description: 'The description of this dataset, displayed to the user while browsing this dataset in the catalog.',
                editor: PropertyEditorMarkdown
            }
        ]
    }
];

module.exports = WebMapServiceDefinition;
