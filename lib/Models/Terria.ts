import { observable } from 'mobx';
import defined from 'terriajs-cesium/Source/Core/defined';
import CesiumEvent from 'terriajs-cesium/Source/Core/Event';
import RuntimeError from 'terriajs-cesium/Source/Core/RuntimeError';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import URI from 'urijs';
import Class from '../Core/Class';
import ConsoleAnalytics from '../Core/ConsoleAnalytics';
import GoogleAnalytics from '../Core/GoogleAnalytics';
import instanceOf from '../Core/instanceOf';
import loadJson5 from '../Core/loadJson5';
import ModelReference from '../Traits/ModelReference';
import Catalog from './CatalogNew';
import { BaseModel } from './Model';
import NoViewer from './NoViewer';
import updateModelFromJson from './updateModelFromJson';
import ViewerMode from './ViewerMode';
import Workbench from './Workbench';
import PickedFeatures from '../Map/PickedFeatures';
import Mappable from './Mappable';

interface ConfigParameters {
    defaultMaximumShownFeatureInfos?: number;
    regionMappingDefinitionsUrl?: string;
    conversionServiceBaseUrl?: string;
    proj4ServiceBaseUrl?: string;
    corsProxyBaseUrl?: string;
    proxyableDomainsUrl?: string;
    shareUrl?: string;
    feedbackUrl?: string;
    initFragmentPaths?: string[];
    interceptBrowserPrint?: boolean;
    tabbedCatalog?: boolean;
}

interface StartOptions {
    configUrl: string;
}

type Analytics = any;

interface TerriaOptions {
    analytics?: Analytics;
}

export default class Terria {
    private models = new Map<string, BaseModel>();

    readonly error = new CesiumEvent();
    readonly beforeViewerChanged = new CesiumEvent();
    readonly afterViewerChanged = new CesiumEvent();
    readonly workbench = new Workbench();
    readonly catalog = new Catalog(this);
    readonly currentViewer = new NoViewer(this);

    /**
     * Gets or sets the instance to which to report Google Analytics-style log events.
     * If a global `ga` function is defined, this defaults to `GoogleAnalytics`.  Otherwise, it defaults
     * to `ConsoleAnalytics`.
     */
    readonly analytics: Analytics;

    @observable
    viewerMode = ViewerMode.CesiumTerrain;

    @observable
    readonly configParameters: ConfigParameters = {
        defaultMaximumShownFeatureInfos: 100,
        regionMappingDefinitionsUrl: 'build/TerriaJS/data/regionMapping.json',
        conversionServiceBaseUrl: 'convert/',
        proj4ServiceBaseUrl: 'proj4/',
        corsProxyBaseUrl: 'proxy/',
        proxyableDomainsUrl: 'proxyabledomains/',
        shareUrl: 'share',
        feedbackUrl: undefined,
        initFragmentPaths: [
            'init/'
        ],
        interceptBrowserPrint: true,
        tabbedCatalog: false
    };

    @observable
    baseMap: Mappable | undefined;

    @observable
    pickedFeatures: PickedFeatures | undefined;

    @observable
    readonly userProperties = new Map<string, any>();

    constructor(options: TerriaOptions = {}) {
        this.analytics = options.analytics;
        if (!defined(this.analytics)) {
            if (typeof window !== 'undefined' && defined((<any>window).ga)) {
                this.analytics = new GoogleAnalytics();
            } else {
                this.analytics = new ConsoleAnalytics();
            }
        }
    }

    getModelById<T extends BaseModel>(type: Class<T>, id: ModelReference): T | undefined {
        if (ModelReference.isRemoved(id)) {
            return undefined;
        } else {
            const model = this.models.get(id);
            if (instanceOf(type, model)) {
                return model;
            }

            // Model does not have the requested type.
            return undefined;
        }
    }

    addModel(model: BaseModel) {
        if (ModelReference.isRemoved(model.id)) {
            return;
        }

        if (this.models.has(model.id)) {
            throw new RuntimeError('A model with the specified ID already exists.')
        }

        this.models.set(model.id, model);
    }

    start(options: StartOptions) {
        var baseUri = new URI(options.configUrl).filename('');

        return loadJson5(options.configUrl).then((config: any) => {
            const initializationUrls = config.initializationUrls;
            return when.all(initializationUrls.map((initializationUrl: string) => {
                return loadJson5(buildInitUrlFromFragment('init/', generateInitializationUrl(baseUri, initializationUrl)).toString()).then((initData: any) => {
                    if (initData.catalog !== undefined) {
                        updateModelFromJson(this.catalog.group, 'definition', { members: initData.catalog });
                    }
                });
            }));

        });

    }

    getUserProperty(key: string) {
        return undefined;
    }
}

function generateInitializationUrl(baseUri: uri.URI, url: string) {
    if (url.toLowerCase().substring(url.length - 5) !== '.json') {
        return {
            baseUri: baseUri,
            initFragment: url
        };
    }
    return new URI(url).absoluteTo(baseUri).toString();
}

function buildInitUrlFromFragment(path: string, fragmentObject: any) {
    const uri = new URI(path + fragmentObject.initFragment + '.json');
    return fragmentObject.baseUri ? uri.absoluteTo(fragmentObject.baseUri) : uri;
}
