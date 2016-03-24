'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import FeatureInfoSection from './FeatureInfoSection.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';

// Any Catalog in a feature-info-panel
const FeatureInfoCatalogItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        features: React.PropTypes.object,
        clock: React.PropTypes.object,
        selectedFeature: React.PropTypes.object,
        onClickFeatureHeader: React.PropTypes.func
    },

    render() {
        let content = null;
        let count = null;
        let maximumShownFeatureInfos = null;
        let featureInfoTemplate;
        let totalFeaturesCount = 0;

        const features = this.props.features;
        const clock = this.props.clock;

        if (defined(features.features)) {
            // Display no more than defined number of feature infos
            totalFeaturesCount = features.features.length;
            if (defined(features.catalogItem)) {
                maximumShownFeatureInfos = features.catalogItem.maximumShownFeatureInfos;
                featureInfoTemplate = features.catalogItem.featureInfoTemplate;

                count = totalFeaturesCount > maximumShownFeatureInfos ? (<li className='p1'>{maximumShownFeatureInfos}{' of '}{totalFeaturesCount}{' results are shown '}</li>) : null;
                content = features.features.slice(0, maximumShownFeatureInfos).map((feature, i)=>{
                    return (<FeatureInfoSection key={i}
                                                catalogItem={features.catalogItem}
                                                feature={feature}
                                                clock={clock}
                                                template={featureInfoTemplate}
                                                isOpen={feature === this.props.selectedFeature}
                                                onClickHeader={this.props.onClickFeatureHeader}
                            />);
                });

            }
        } else if (defined(features.feature)) {
            content = (<FeatureInfoSection feature={features.feature}
                                           clock={clock}
                                           isOpen={features.feature === this.props.selectedFeature}
                                           onClickHeader={this.props.onClickFeatureHeader}
                        />);
        }

        return (<li className ='feature-info__group'><ul className='feature-info-panel__sections'>{count}{content}</ul></li>);
    }
});
module.exports = FeatureInfoCatalogItem;
