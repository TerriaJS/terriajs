'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import FeatureInfoSection from './FeatureInfoSection.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';

// Any Catalog in a feature-info-panel
const FeatureInfoCatalogItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        features: React.PropTypes.array,
        catalogItem: React.PropTypes.object,
        terria: React.PropTypes.object.isRequired
    },

    toggleOpenFeature(feature) {
        const terria = this.props.terria;
        if (feature === terria.selectedFeature) {
            terria.selectedFeature = undefined;
        } else {
            terria.selectedFeature = feature;
        }
    },

    render() {

        let content = null;
        let count = null;
        let maximumShownFeatureInfos = null;
        let featureInfoTemplate;
        let totalFeaturesCount = 0;

        const features = this.props.features;
        const catalogItem = this.props.catalogItem;
        const terria = this.props.terria;

        if (defined(features)) {
            // Display no more than defined number of feature infos
            totalFeaturesCount = features.length;
            if (defined(catalogItem)) {
                maximumShownFeatureInfos = catalogItem.maximumShownFeatureInfos;
                featureInfoTemplate = catalogItem.featureInfoTemplate;

                count = totalFeaturesCount > maximumShownFeatureInfos ? (<li className='p1'>{maximumShownFeatureInfos}{' of '}{totalFeaturesCount}{' results are shown '}</li>) : null;
                content = features.slice(0, maximumShownFeatureInfos).map((feature, i) => {
                    return (
                        <FeatureInfoSection key={i}
                            catalogItem={catalogItem}
                            feature={feature}
                            clock={terria.clock}
                            template={featureInfoTemplate}
                            isOpen={feature === terria.selectedFeature}
                            onClickHeader={this.toggleOpenFeature}
                        />
                    );
                });

            }
        // } else if (defined(features.feature)) {
        //     content = (<FeatureInfoSection feature={features.feature}
        //                                    clock={terria.clock}
        //                                    isOpen={features.feature === terria.selectedFeature}
        //                                    onClickHeader={this.toggleOpenFeature}
        //                 />);
        }

        return (
            <li className ='feature-info__group'>
                <ul className='feature-info-panel__sections'>
                    {count}{content}
                </ul>
            </li>
        );
    }
});
module.exports = FeatureInfoCatalogItem;
