'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import FeatureInfoCatalogItem from './FeatureInfoCatalogItem.jsx';
import DragWrapper from '../DragWrapper.jsx';
import Loader from '../Loader.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import Entity from 'terriajs-cesium/Source/DataSources/Entity';
import Icon from "../Icon.jsx";
import { LOCATION_MARKER_DATA_SOURCE_NAME} from '../../Models/LocationMarkerUtils';

import Styles from './feature-info-panel.scss';
import classNames from 'classnames';

const FeatureInfoPanel = createReactClass({
    displayName: 'FeatureInfoPanel',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        printView: PropTypes.bool
    },

    ref: null,

    getInitialState() {
        return {
            left: null,
            right: null,
            top: null,
            bottom: null
        };
    },

    componentDidMount() {
        const createFakeSelectedFeatureDuringPicking = true;
        const terria = this.props.terria;
        this._pickedFeaturesSubscription = knockout.getObservable(terria, 'pickedFeatures').subscribe(() => {
            const pickedFeatures = terria.pickedFeatures;
            if (!defined(pickedFeatures)) {
                terria.selectedFeature = undefined;
            } else {
                if (createFakeSelectedFeatureDuringPicking) {
                    const fakeFeature = new Entity({
                        id: 'Pick Location'
                    });
                    fakeFeature.position = pickedFeatures.pickPosition;
                    terria.selectedFeature = fakeFeature;
                } else {
                    terria.selectedFeature = undefined;
                }
                if (defined(pickedFeatures.allFeaturesAvailablePromise)) {
                    pickedFeatures.allFeaturesAvailablePromise.then(() => {
                        // We only show features that are associated with a catalog item, so make sure the one we select to be
                        // open initially is one we're actually going to show.
                        const featuresShownAtAll = pickedFeatures.features.filter(x => defined(determineCatalogItem(terria.nowViewing, x)));
                        terria.selectedFeature = featuresShownAtAll.filter(featureHasInfo)[0];
                        if (!defined(terria.selectedFeature) && (featuresShownAtAll.length > 0)) {
                            // Handles the case when no features have info - still want something to be open.
                            terria.selectedFeature = featuresShownAtAll[0];
                        }
                    });
                }
            }
        });
    },

    componentWillUnmount() {
        if (defined(this._pickedFeaturesSubscription)) {
            this._pickedFeaturesSubscription.dispose();
            this._pickedFeaturesSubscription = undefined;
        }
    },

    isDragging() {
        return +this.ref.current.node.getAttribute('data-is-dragging');
    },

    getFeatureInfoCatalogItems() {
        const {catalogItems, featureCatalogItemPairs} = getFeaturesGroupedByCatalogItems(this.props.terria);

        return catalogItems
            .filter(catalogItem => defined(catalogItem))
            .map((catalogItem, i) => {
                // From the pairs, select only those with this catalog item, and pull the features out of the pair objects.
                const features = featureCatalogItemPairs.filter(pair => pair.catalogItem === catalogItem).map(pair => pair.feature);
                return (
                    <FeatureInfoCatalogItem
                        key={i}
                        viewState={this.props.viewState}
                        catalogItem={catalogItem}
                        features={features}
                        terria={this.props.terria}
                        onToggleOpen={this.toggleOpenFeature}
                        printView={this.props.printView}
                    />
                );
            });
    },

    close() {
        this.props.viewState.featureInfoPanelIsVisible = false;

        // give the close animation time to finish before unselecting, to avoid jumpiness
        setTimeout(() => {
            this.props.terria.pickedFeatures = undefined;
            this.props.terria.selectedFeature = undefined;
        }, 200);
    },

    toggleCollapsed(event) {
        if(!this.isDragging()) {
            this.props.viewState.featureInfoPanelIsCollapsed = !this.props.viewState.featureInfoPanelIsCollapsed;
        }
    },

    toggleOpenFeature(feature) {
        if(!this.isDragging()) {
            const terria = this.props.terria;
            if (feature === terria.selectedFeature) {
                terria.selectedFeature = undefined;
            } else {
                terria.selectedFeature = feature;
            }
        }
    },

    getMessageForNoResults() {
        if (this.props.terria.nowViewing.hasItems) {
            // feature info shows up becuase data has been added for the first time
            if (this.props.viewState.firstTimeAddingData) {
                this.props.viewState.firstTimeAddingData = false;
                return "Click on the map to learn more about a location";
            }
            // if clicking on somewhere that has no data
            return "No data is available here - try another location.";
        } else {
            return "Click 'Add Data' to add data to the map.";
        }
    },

   
    onClickSntsatelliteSuggestionBtn() {
      if (true){
       console.log('active satellite imagery layer');
      }
    },

        render() {
        const terria = this.props.terria;
        const viewState = this.props.viewState;

        const featureInfoCatalogItems = this.getFeatureInfoCatalogItems();
        const panelClassName = classNames(Styles.panel, {
            [Styles.isCollapsed]: viewState.featureInfoPanelIsCollapsed,
            [Styles.isVisible]: viewState.featureInfoPanelIsVisible
        });

        this.ref = React.createRef();
        return (
                <DragWrapper ref={this.ref}>
                    <div
                        className={panelClassName}
                        aria-hidden={!viewState.featureInfoPanelIsVisible}>
                        {!this.props.printView && <div className={Styles.header}>
                            <div className={Styles.btnPanelHeading}>
                                <span>Feature Information</span>
                                <button type='button' onClick={ this.toggleCollapsed } className={Styles.btnToggleFeature}>
                                    {this.props.viewState.featureInfoPanelIsCollapsed ? <Icon glyph={Icon.GLYPHS.closed}/> : <Icon glyph={Icon.GLYPHS.opened}/>}
                                </button>
                            </div>
                            <button type='button' onClick={ this.close } className={Styles.btnCloseFeature}
                                    title="Close data panel">
                                <Icon glyph={Icon.GLYPHS.close}/>
                            </button>
                        </div>}
                        <ul className={Styles.body}>
                            <Choose>
                                <When condition={viewState.featureInfoPanelIsCollapsed || !viewState.featureInfoPanelIsVisible}>
                                </When>
                                <When condition={defined(terria.pickedFeatures) && terria.pickedFeatures.isLoading}>
                                    <li><Loader/></li>
                                </When>
                                <When condition={!featureInfoCatalogItems || featureInfoCatalogItems.length === 0}>
                                    <li className={Styles.noResults}>{this.getMessageForNoResults()}</li>
                                </When>
                                <Otherwise>
                                    {featureInfoCatalogItems}
                                </Otherwise>
                            </Choose>
                            <button type='button' onClick={this.onClickSntsatelliteSuggestionBtn} className={Styles.satelliteSuggestionBtn}>Show satellite imagery at this location</button>
                        </ul>
                    </div>
                </DragWrapper>
        );
    },
});

/**
 * Returns an object of {catalogItems, featureCatalogItemPairs}.
 */
function getFeaturesGroupedByCatalogItems(terria) {
    if (!defined(terria.pickedFeatures)) {
        return {catalogItems: [], featureCatalogItemPairs: []};
    }
    const features = terria.pickedFeatures.features;
    const featureCatalogItemPairs = [];  // Will contain objects of {feature, catalogItem}.
    const catalogItems = []; // Will contain a list of all unique catalog items.

    features.forEach(feature => {
        // Why was this here? Surely changing the feature objects is not a good side-effect?
        // if (!defined(feature.position)) {
        //     feature.position = terria.pickedFeatures.pickPosition;
        // }
        const catalogItem = determineCatalogItem(terria.nowViewing, feature);
        featureCatalogItemPairs.push({
            catalogItem: catalogItem,
            feature: feature
        });
        if (catalogItems.indexOf(catalogItem) === -1) {  // Note this works for undefined too.
            catalogItems.push(catalogItem);
        }
    });

    return {catalogItems, featureCatalogItemPairs};
}

/**
 * Figures out what the catalog item for a feature is.
 *
 * @param nowViewing {@link NowViewing} to look in the items for.
 * @param feature Feature to match
 * @returns {CatalogItem}
 */
function determineCatalogItem(nowViewing, feature) {
    if (!defined(nowViewing)) {
        // So that specs do not need to define a nowViewing.
        return undefined;
    }

    // "Data sources" (eg. czml, geojson, kml, csv) have an entity collection defined on the entity
    // (and therefore the feature).
    // Then match up the data source on the feature with a now-viewing item's data source.
    //
    // Gpx, Ogr, WebFeatureServiceCatalogItem, ArcGisFeatureServerCatalogItem, WebProcessingServiceCatalogItem
    // all have a this._geoJsonItem, which we also need to check.
    let result;
    let i;
    let item;
    if (defined(feature.entityCollection) && defined(feature.entityCollection.owner)) {
        const dataSource = feature.entityCollection.owner;

        if (dataSource.name === LOCATION_MARKER_DATA_SOURCE_NAME) {
            return {
                name: 'Location Marker'
            };
        }

        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            item = nowViewing.items[i];
            if (item.dataSource === dataSource) {
                result = item;
                break;
            }
        }
        return result;
    }

    // If there is no data source, but there is an imagery layer (eg. ArcGIS),
    // we can match up the imagery layer on the feature with a now-viewing item.
    if (defined(feature.imageryLayer)) {
        const imageryLayer = feature.imageryLayer;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].imageryLayer === imageryLayer) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
}

/**
 * Determines whether the passed feature has properties or a description.
 */
function featureHasInfo(feature) {
    return (defined(feature.properties) || defined(feature.description));
}

module.exports = FeatureInfoPanel;
