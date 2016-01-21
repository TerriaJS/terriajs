'use strict';
const React = require('react');
const FeatureInfoSection = require('./FeatureInfoSection.jsx'),
    defined = require('terriajs-cesium/Source/Core/defined');

// Any Catalog in a feature-info-panel
const FeatureInfoCatalogItem = React.createClass({
    propTypes: {
        features: React.PropTypes.object,
        clock: React.PropTypes.object
    },

    render() {
        var content = null;
        var count = null;
        var maximumShownFeatureInfos = null;
        var featureInfoTemplate;
        var totalFeaturesCount = 0;

        var features = this.props.features;
        var clock = this.props.clock;

        if (defined(features.features)){
         //Display no more than defined number of feature infos
          totalFeaturesCount = features.features.length;
            if (defined(features.catalogItem)) {
                maximumShownFeatureInfos = features.catalogItem.maximumShownFeatureInfos;
                featureInfoTemplate = features.catalogItem.featureInfoTemplate;

                count = totalFeaturesCount > maximumShownFeatureInfos ? (<li className='p1'>{maximumShownFeatureInfos}{' of '}{totalFeaturesCount}{' results are shown '}</li>) : null;
                content = features.features.slice(0, maximumShownFeatureInfos).map(function(feature, i) {
                    return (<FeatureInfoSection key={i} catalogItemName={features.catalogItem.name} feature={feature} clock={clock} template={featureInfoTemplate} index={i}/>);
                });

            }
        } else if (defined(features.feature)){
            content = (<FeatureInfoSection feature={features.feature} clock={clock} index={0} />);
        }

        return (<li className ='feature-info__group'><ul className='list-reset feature-info-panel-sections'>{count}{content}</ul></li>);
    }
});
module.exports = FeatureInfoCatalogItem;
