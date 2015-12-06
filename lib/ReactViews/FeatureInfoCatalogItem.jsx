'use strict';
var React = require('react');
var FeatureInfoSection = require('./FeatureInfoSection.jsx'),
    defined = require('terriajs-cesium/Source/Core/defined');

var FeatureInfoCatalogItem = React.createClass({
    propTypes: {
        features: React.PropTypes.object,
        clock: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            isOpen: false
        };
    },
    toggleCatalog: function() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },
    render: function() {
        var content = null;
        var count = null;
        var maximumShownFeatureInfos = null;
        var featureInfoTemplate;
        var totalFeaturesCount = 0;

        var features = this.props.features;
        var clock = this.props.clock;

        if (defined(features.features)){
          totalFeaturesCount = features.features.length;
            if (defined(features.catalogItem)) {
                maximumShownFeatureInfos = features.catalogItem.maximumShownFeatureInfos;
                featureInfoTemplate = features.catalogItem.featureInfoTemplate;

                count = totalFeaturesCount > maximumShownFeatureInfos ? (<li className='p1'>{maximumShownFeatureInfos}{' of '}{totalFeaturesCount}{' results are shown '}</li>) : null;

                content = features.features.slice(0, maximumShownFeatureInfos).map(function(feature, i) {
                    return (<FeatureInfoSection key={i} feature={feature} clock={clock} template={featureInfoTemplate} />);
                });

            }
        }else if (features.feature){
            content = (<FeatureInfoSection feature={features.feature} clock={clock}/>);
        }

        return (<li className ='feature-info__group'><button className='btn' onClick={this.toggleCatalog}>{features.catalogItem ? features.catalogItem.name : 'Data without catalog name'}</button><ul aria-hidden={!this.state.isOpen} className='list-reset feature-info-panel-sections'>{count}{content}</ul></li>);
    }
});
module.exports = FeatureInfoCatalogItem;
