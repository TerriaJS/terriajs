'use strict';
const React = require('react');
const FeatureInfoSection = require('./FeatureInfoSection.jsx');
const defined = require('terriajs-cesium/Source/Core/defined');

// Any Catalog in a feature-info-panel
const FeatureInfoCatalogItem = React.createClass({
    propTypes: {
        features: React.PropTypes.object,
        clock: React.PropTypes.object
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
                    return (<FeatureInfoSection key={i} catalogItemName={features.catalogItem.name} feature={feature} clock={clock} template={featureInfoTemplate} index={i}/>);
                });

            }
        } else if (defined(features.feature)) {
            content = (<FeatureInfoSection feature={features.feature} clock={clock} index={0} />);
        }

        return (<li className ='feature-info__group'><ul className='list-reset feature-info-panel__sections'>{count}{content}</ul></li>);
    }
});
module.exports = FeatureInfoCatalogItem;
