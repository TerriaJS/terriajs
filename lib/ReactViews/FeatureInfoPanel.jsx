'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import FeatureInfoCatalogItem from './FeatureInfoCatalogItem.jsx';
import Loader from './Loader.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

const FeatureInfoPanel = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        isVisible: React.PropTypes.bool,
        isCollapsed: React.PropTypes.bool,
        onClose: React.PropTypes.func,
        onChangeFeatureInfoPanelIsCollapsed: React.PropTypes.func
    },

    getFeatures() {
        if (defined(this.props.terria.pickedFeatures)) {
            return addSectionsForFeatures(this.props.terria);
        }
    },

    renderContent(pickedFeatures) {
        const that = this;
        if (defined(this.props.terria.pickedFeatures)) {
            if (this.props.terria.pickedFeatures.isLoading === true) {
                return <Loader/>;
            }
            if (pickedFeatures && pickedFeatures.length > 0) {
                return pickedFeatures.map((features, i)=>{
                    return (<FeatureInfoCatalogItem key={i} features={features} clock={that.props.terria.clock} />);
                });
            }
            return <li className='no-results'> No results </li>;
        }
        return <li className='no-results'> No results </li>;
    },

    render() {
        const pickedFeatures = this.getFeatures();
        return (
            <div className={'feature-info-panel ' + (this.props.isCollapsed ? 'is-collapsed' : '')} aria-hidden={!this.props.isVisible}>
              <div className='feature-info-panel__header clearfix'>
                <button onClick={ this.props.onChangeFeatureInfoPanelIsCollapsed } className='btn col col-11'> Feature Info Panel </button>
                <button onClick={ this.props.onClose } className="btn btn-close col col-1" title="Close data panel"><i className="icon icon-close"></i></button>
              </div>
              <ul className="list-reset feature-info-panel__body">{this.renderContent(pickedFeatures)}</ul>
            </div>
            );
    }
});

// to add multiple catalog when several dataset turned on at the same time
function addSectionsForFeatures(terria) {
    const features = terria.pickedFeatures.features;
    const sections = [];
    let catalogItem;
    features.forEach((feature)=> {
        if (!defined(feature.position)) {
            feature.position = terria.pickedFeatures.pickPosition;
        }
        catalogItem = calculateCatalogItem(terria.nowViewing, feature);
        // if feature does not have a catalog item?
        if (!defined(catalogItem)) {
            sections.push({
                catalogItem: undefined,
                feature: feature
            });
        } else {
            let newItem = true;
            let existingItemIndex;
            for (let i = sections.length - 1; i >= 0; i--) {
                if (catalogItem === sections[i].catalogItem) {
                    newItem = false;
                    existingItemIndex = i;
                }
            }
            if (newItem === true) {
                sections.push({
                    catalogItem: catalogItem,
                    features: [feature]
                });
            } else {
                sections[existingItemIndex].features.push(feature);
            }
        }
    });
    return sections;
}

function calculateCatalogItem(nowViewing, feature) {
    // some data sources (czml, geojson, kml) have an entity collection defined on the entity
    // (and therefore the feature)
    // then match up the data source on the feature with a now-viewing item's data source
    let result;
    let i;
    if (!defined(nowViewing)) {
        // so that specs do not need to define a nowViewing
        return undefined;
    }
    if (defined(feature.entityCollection) && defined(feature.entityCollection.owner)) {
        const dataSource = feature.entityCollection.owner;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].dataSource === dataSource) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
    // If there is no data source, but there is an imagery layer (eg. ArcGIS)
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
    // otherwise, no luck
    return undefined;
}

module.exports = FeatureInfoPanel;
