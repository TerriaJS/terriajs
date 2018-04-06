const mobx = require('mobx');
const mobxUtils = require('mobx-utils');
//const computedAsyncMobx = require('computed-async-mobx');

function defined(x) {
    return typeof x !== 'undefined';
}

function addParameter(definition, parameter) {
    definition[parameter.id] = parameter;
}

const CatalogMemberDefinition = {};

class StringParameter {
    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
    }

    combineLayerValues(below, above) {
        return defined(above) ? above : below;
    }
}

class InfoParameter {
    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
    }

    combineLayerValues(below, above) {
        // TODO: de-duplicate sections
        if (defined(below) && defined(above)) {
            return below.concat(above);
        } else if (defined(above)) {
            return above;
        } else {
            return below;
        }
    }
}

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

function createInstanceOfDefinition(definition) {
    const props = {};
    Object.keys(definition).forEach(propertyName => {
        props[propertyName] = undefined;
    });
    return props;
}

function commentout() {
const WebMapServiceCatalogItemModel = defineModel({
    name: 'Web Map Service (WMS)',
    type: 'wms',
    layers: [
        {
            name: 'getCapabilitiesLayer',
            properties: [
                availableStyles,
                availableDimensions,
                isGeoServer,
                isEsri,
                isNcWms,
                supportsColorScaleRange,
                info,
                minScaleDenominator,
                getFeatureInfoFormats,
                rectangle,
                intervals,
                tilingScheme,
                colorScaleMinimum,
                colorScaleMaximum
            ],
            load: mobx.computed(function() {
                const layer = createInstanceOfDefinition(getCapabilitiesLayer);

                layer.loadPromise = loadXML(this.getCapabilitiesUrl).then(xml => {

                });
                return layer;
            })
        },
        {
            name: 'describeLayerLayer',
            properties: [
                dataUrl,
                dataUrlType
            ]
        },
        {
            name: 'definitionLayer',
            properties: [

            ]
        }
    ]
});
}

// How to indicate that a property (layer?) is currently loading?

const WebMapServiceCatalogItemDefinition = Object.assign({
    layers: ['defaultsLayer', 'getCapabilitiesLayer', 'describeLayerLayer', 'definitionLayer', 'userLayer']
}, CatalogMemberDefinition);

/**
 * A layered definitional object, as commonly used in the Model layer.
 */
class DefinitionalObject {
    /**
     * Initializes a new instance.
     * @param {Terria} options.terria The Terria instance to which this object belongs.
     * @param {Object} options.definition A description of the configurable fields of this object.
     * @param {String[]} [options.middleLayerNames=[]] The names of the middle layers of this object, if any.
     */
    constructor(options) {
        const { terria, definition, middleLayerNames } = options;

        this.terria = terria;
        this.definition = definition;
        this.layerNames = ['defaultsLayer', ...(middleLayerNames || []), 'definitionLayer', 'userLayer'];
        this.defaultStratumToModify = 'userLayer';

        const layers = this.layerNames.reduce((p, c) => {
            p[c] = createInstanceOfDefinition(definition);
            return p;
        }, {});

        mobx.extendObservable(this, layers);

        const that = this;
        const flattened = {};
        Object.keys(definition).forEach(propertyName => {
            const property = definition[propertyName];
            const id = property.id;

            Object.defineProperty(flattened, id, {
                get: function() {
                    let value;

                    for (let i = 0; i < that.layerNames.length; ++i) {
                        const layerName = that.layerNames[i];
                        const layer = that[layerName];
                        if (defined(layer)) {
                            value = property.combineLayerValues(value, layer[id]);
                        }
                    }

                    return value;

                },
                set: function(value) {
                    // TODO: need an uncombine, too, e.g. for info
                    that[that.defaultLayerToModify][id] = value;
                },
                enumerable: true
            });
        });

        mobx.extendObservable(this, {
            flattened: flattened
        });

        const props = {};
        Object.keys(definition).forEach(propertyName => {
            const property = definition[propertyName];
            const id = property.id;
            Object.defineProperty(this, id, {
                get: function() {
                    return this.flattened[id];
                },
                set: function(value) {
                    this.flattened[id] = value;
                },
                enumerable: true,
                configurable: true
            });
        });

        mobx.extendObservable(this, props);
    }
}

class CatalogItem extends DefinitionalObject {
    constructor(options) {
        super(options);
    }
}

// No more isEnabled property!
// Instead, it's enabled if it's in the terria.workbench.

class WebMapServiceCatalogItem extends DefinitionalObject {
    constructor() {
        super({
            definition: WebMapServiceCatalogItemDefinition,
            middleLayerNames: ['getCapabilitiesLayer']
        });

        this.load = /*mobx.asyncAction('load',*/ function*() {
            var that = this;
            var promises = [];

            if (!defined(this._rawMetadata) && defined(this.getCapabilitiesUrl)) {
                promises.push(loadXML(proxyCatalogItemUrl(this, this.getCapabilitiesUrl, '1d')).then(function(xml) {
                    var metadata = capabilitiesXmlToJson(that, xml);
                    that.updateFromCapabilities(metadata, false);
                    loadFromCapabilities(that);
                }));
            } else {
                loadFromCapabilities(this);
            }

            // Query WMS for wfs or wcs URL if no dataUrl is present
            if (!defined(this.dataUrl) && defined(this.url)) {
                var describeLayersURL = cleanUrl(this.url) + '?service=WMS&version=1.1.1&sld_version=1.1.0&request=DescribeLayer&layers=' + encodeURIComponent(this.layers);

                promises.push(loadXML(proxyCatalogItemUrl(this, describeLayersURL, '1d')).then(function(xml) {
                    var json = xml2json(xml);
                    // LayerDescription could be an array. If so, only use the first element
                    var LayerDescription = (json.LayerDescription instanceof Array) ? json.LayerDescription[0] : json.LayerDescription;
                    if (defined(LayerDescription) && defined(LayerDescription.owsURL) && defined(LayerDescription.owsType)) {
                        switch (LayerDescription.owsType.toLowerCase()) {
                            case 'wfs':
                                if (defined(LayerDescription.Query) && defined(LayerDescription.Query.typeName)) {
                                    that.dataUrl = cleanUrl(LayerDescription.owsURL) + '?service=WFS&version=1.1.0&request=GetFeature&typeName=' + LayerDescription.Query.typeName + '&srsName=EPSG%3A4326&maxFeatures=1000';
                                    that.dataUrlType = 'wfs-complete';
                                }
                                else {
                                    that.dataUrl = cleanUrl(LayerDescription.owsURL);
                                    that.dataUrlType = 'wfs';
                                }
                                break;
                            case 'wcs':
                                if (defined(LayerDescription.Query) && defined(LayerDescription.Query.typeName)) {
                                    that.dataUrl = cleanUrl(LayerDescription.owsURL) + '?service=WCS&version=1.1.1&request=DescribeCoverage&identifiers=' + LayerDescription.Query.typeName;
                                    that.dataUrlType = 'wcs-complete';
                                }
                                else {
                                    that.dataUrl = cleanUrl(LayerDescription.owsURL);
                                    that.dataUrlType = 'wcs';
                                }
                                break;
                        }
                    }
                }).otherwise(function(err) { })); // Catch potential XML error - doesn't matter if URL can't be retrieved
            }

            yield when.all(promises);
        } /*)*/ ;

        // It's inconsistent that in TerriaJS, we show incomplete/incorrect stuff (e.g. description) in the catalog view before
        // the load is finished, but we never show an incomplete/incorrect map; we wait for the load to finish before ever
        // showing anything on the map.
        // We should probably show a "loading" message for the catalog view, too, instead of showing incorrect values while
        // the load is in progress.  Or, better yet, we should display a loading message _only for those properties that
        // might change as a result of the load_. That is also the set of properties that should trigger a load on access.
        // But this set of properties would have to be explicitly specified by the developer, I can't see any way to infer it.
        // Actually... maybe we don't need to infer it. Consider the `name` property. Ideally, we'd like to be able to show
        // the name without loading, cause otherwise displaying the catalog would require a lot of loading. What, if anything
        // is special about `name`? Is it special because of how it's used in the UI? Hopefully not. Is it special because
        // it can't ever come from GetCapabilities? Well, that might be true currently, but it doesn't need to be. WMS
        // layers certainly have a Title property that would work well as a name. So maybe, what is special about `name`
        // is that it is _usually_ included in the definition, and because the value in the definition layer overrides
        // any value that might be set in the getCapabilitiesLayer, the value in getCapabilitiesLayer is irrelevant and
        // therefore we don't need to load before using the name. If the `name` _weren't_ specified in the definition,
        // then we _would_ need to load GetCapabilities before displaying the name in the catalog.

        this.getMapResources = mobxUtils.createTransformer(terria => {
            const currentImagery = this.createImageryProvider(terria, this.getCurrentTime(terria));
            const nextImagery = this.createImageryProvider(terria, this.getNextTime(terria));
            return [currentImagery, nextImagery].filter(x => x !== undefined);
        });

        this.getCapabilities = mobxUtils.createTransformer(terria => {
            const url = this.getCapabilitiesUrl;
            return mobxUtils.lazyObservable(sink => {
                loadXML(url).then(sink);
            }, undefined).current();
        });

        this.getImageryProvider = mobxUtils.createTransformer((terria, time) => {
            // We shouldn't be willing to create an imagery provider until we've loaded from GetCapabilities,
            // because that load is likely to affect the construction of our GetMap requests (e.g. CRS).
            // But there's no obviously missing property we can key off.

            // 1. load from GetCapabilities
            // 2. change URL
            // 3. new imagery provider created that does GetMap calls based on the old GetCapabilities?!

            //

            if (!this.getCapabilities(terria)) {
                this.load();
                return undefined;
            }

            var parameters = objectToLowercase(this.parameters);
            if (defined(time)) {
                parameters = combine({ time: time }, parameters);
            }

            parameters = combine(parameters, WebMapServiceCatalogItem.defaultParameters);
            // request one more feature than we will show, so that we can tell the user if there are more not shown
            if (defined(parameters.feature_count)) {
                console.log(this.name + ': using parameters.feature_count (' + parameters.feature_count + ') to override maximumShownFeatureInfos (' + this.maximumShownFeatureInfos + ').');
                if (parameters.feature_count === 1) {
                    this.maximumShownFeatureInfos = 1;
                } else {
                    this.maximumShownFeatureInfos = parameters.feature_count - 1;
                }
            } else {
                parameters.feature_count = this.maximumShownFeatureInfos + 1;
            }

            if (defined(this.styles) && (!defined(parameters.styles) || parameters.styles.length === 0)) {
                parameters.styles = this.styles;
            }

            if (defined(this.colorScaleMinimum) && defined(this.colorScaleMaximum) && !defined(parameters.colorscalerange)) {
                parameters.colorscalerange = [this.colorScaleMinimum, this.colorScaleMaximum].join(',');
            }

            var maximumLevel;

            if (defined(this.minScaleDenominator)) {
                var metersPerPixel = 0.00028; // from WMS 1.3.0 spec section 7.2.4.6.9
                var tileWidth = 256;

                var circumferenceAtEquator = 2 * Math.PI * Ellipsoid.WGS84.maximumRadius;
                var distancePerPixelAtLevel0 = circumferenceAtEquator / tileWidth;
                var level0ScaleDenominator = distancePerPixelAtLevel0 / metersPerPixel;

                // 1e-6 epsilon from WMS 1.3.0 spec, section 7.2.4.6.9.
                var ratio = level0ScaleDenominator / (this.minScaleDenominator - 1e-6);
                var levelAtMinScaleDenominator = Math.log(ratio) / Math.log(2);
                maximumLevel = levelAtMinScaleDenominator | 0;
            }

            if (defined(this.dimensions) && (!defined(parameters.dimensions) || parameters.dimensions.length === 0)) {
                for (var dimensionName in this.dimensions) {
                    if (this.dimensions.hasOwnProperty(dimensionName)) {
                        // elevation is specified as simply elevation.
                        // Other (custom) dimensions are prefixed with 'dim_'.
                        // See WMS 1.3.0 spec section C.3.2 and C.3.3.
                        if (dimensionName.toLowerCase() === 'elevation') {
                            parameters.elevation = this.dimensions[dimensionName];
                        } else {
                            parameters['dim_' + dimensionName] = this.dimensions[dimensionName];
                        }
                    }
                }
            }

            return new WebMapServiceImageryProvider({
                url : cleanAndProxyUrl(this, this.url),
                layers : this.layers,
                getFeatureInfoFormats : this.getFeatureInfoFormats,
                parameters : parameters,
                getFeatureInfoParameters : parameters,
                tilingScheme : defined(this.tilingScheme) ? this.tilingScheme : new WebMercatorTilingScheme(),
                maximumLevel: maximumLevel
            });
        });

        // this.getClock = mobxUtils.createTransformer(terria => {
        //     if (this.useOwnClock) {
        //         return
        //     }
        // });

        // this.getCurrentTime = mobxUtils.createTransformer(terria => {
        //     if (this.useOwnClock) {
        //         return
        //     }
        // })

        // this.createImageryProvider = mobxUtils.createTransformer((terria, time) => {

        // });

        // this.mapResources = mobx.asyncComputed(undefined, 200, async () => {
        //     if (!this.isEnabled || !this.isShown) {
        //         return undefined;
        //     }

        //     await this.load();
        // });
    }

    get name() {
        return this.flattened.name || 'foo';
    }

    set name(value) {
        this.flattened.name = value;
    }

    // operations
    // intermediate/cached values
    // a layer can compute values??
}

mobx.decorate(WebMapServiceCatalogItem, {
    name: mobx.observable
});

// class PlaceholderCatalogItem {
//     constructor(definition) {
//         this.definitionLayer = createInstanceOfDefinition(definition);

//         const props = {};
//         Object.keys(definition).forEach(propertyName => {
//             const property = definition[propertyName];
//             const id = property.id;
//             Object.defineProperty(this, id, {
//                 get: function() {
//                     return this.definitionLayer[id];
//                 },
//                 set: function(value) {
//                     this.definitionLayer[id] = value;
//                 },
//                 enumerable: true,
//                 configurable: true
//             });
//         });

//         mobx.extendObservable(this, props);
//     }

//     become(newType) {
//         newType.call(this);
//     }
// }

//module.exports = WebMapServiceCatalogItem;

// Would like to have a _value_ that represents "the things shown on the map by this dataset".
// That value will initially be empty (nothing to show) and then after an asynchronous load it might
// contain an ImageryProvider or a DataSource or something. Or perhaps two of these things, one of them
// hidden, if the layer is time-dynamic and the next time is being pre-loaded.
// The value will change if certain settings of the catalog item change (e.g. its URL, selected style, etc.).
// It will also change when time changes (but this is just another property of the catalog item, in a sense).
//
// We can think of this a little like the way React works.  A pure function of (observable) state produces
// a value representing the state of stuff on the map. When the state changes, we need to re-run the pure
// function to get the new value and apply it to the map. One complication is that the process of
// determining what to put on the map is inherently asynchronous. But that's ok if it's always synchronous
// but just produces an empty set (nothing on the map) before the map contents are loaded.
//
// What about side effects? The "pure" function that produces map state won't produce anything if the
// catalog item isn't loaded yet. Should it automatically trigger a load?

const wms = new WebMapServiceCatalogItem();
console.log(wms.name);
wms.defaultsLayer.name = 'Unnamed Item';
console.log(wms.name);
wms.name = 'test';
console.log(wms.name);

console.log('****');

const b = mobx.observable('b');

const test = mobxUtils.createTransformer(function(a) {
    console.log('transforming');
    const o = mobx.observable({
        value: a
    });
    const p = mobxUtils.fromPromise((resolve, reject) => {
        setTimeout(() => {
            console.log('inside');
            o.value = o.value + b.get() + 'a';
            resolve();
        }, 500);
    });
    console.log('after');
    // setInterval(() => {
    //     o.value = o.value + b.get() + 'a';
    // }, 1000);
    return o;
});

mobx.autorun(() => {
    console.log(test('a').value);
});

setTimeout(() => {
    console.log('timeout');
    b.set('c');
}, 2500);

// let value = mobx.observable();
// value.set(0);

// const lazy = mobxUtils.lazyObservable(sink => {
//     console.log('evaluating');
//     const v = value.get();
//     setTimeout(() => {
//         console.log('timeout ' + v);
//         sink(v.toString());
//     }, 1000);
// }, 'not set yet');

// setTimeout(() => {
//     value.set(2);
// }, 2000);

// mobx.autorun(() => {
//     console.log('autorun ' + lazy.current());
// });

// const ph = new PlaceholderCatalogItem(WebMapServiceCatalogItemDefinition);

// mobx.autorun(() => {
//     console.log(ph.name);
// });

// ph.definitionLayer.name = 'foo';

// ph.become(WebMapServiceCatalogItem);


// const foo = mobx.observable({
//     a: 'foo',
//     set foo(value) {
//         this.a = value;
//     },
//     get foo() {
//         return this.a;
//     },
// });

// mobx.autorun(() => {
//     console.log(foo.foo);
// });

// // mobx.reaction(() => foo.foo, () => {
// //     console.log(foo.foo);
// // });

// foo.foo = 'hi';
// foo.foo = 'bye';

// mobx.extendObservable(foo, {
//     b: 'bar',
//     get foo() {
//         return this.b + '1';
//     },
//     set foo(value) {
//         this.b = value;
//     }
// });

// foo.foo = '1';

// mobx.autorun(() => {
//     console.log(foo.foo);
// });

// Put a placeholder in the catalog with just a "definition" layer, and load the real catalog item when its accessed.

// const foo = computedAsyncMobx.promisedComputed('not resolved yet', () => {
//     console.log('evaluating');
//     const v = value.get();
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             console.log(v);
//             resolve(v.toString());
//         }, 5000);
//     });
// });

// value.set(1);

// setTimeout(() => {
//     value.set(2);
// }, 2000);

// mobx.autorun(() => {
//     console.log(foo.get());
// });


// WMS catalog item definition ---load---> augmented definition ----create-mappables----> mappables
