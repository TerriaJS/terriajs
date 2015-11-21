'use strict';

/*global require*/
var FeatureInfoSection = require('./FeatureInfoSection.jsx'),
    when = require('terriajs-cesium/Source/ThirdParty/when');



var FeatureInfoPanel = React.createClass({
  getInitialState: function() {
    return {
      pickedFeatures: undefined
    };
  },

  componentWillReceiveProps: function(){
    var that = this;
    if(this.props.isVisible === false){
      when(this.props.terria.pickedFeatures.allFeaturesAvailablePromise).then(function(){
        that.setState({
          pickedFeatures: that.props.terria.pickedFeatures.features.slice(0, 3)
        });
      });
    }
  },


  render: function() {
    var selectedFeature = this.state.pickedFeatures;
    var clock = this.props.terria.clock;
    var content = "Loading features";
    if(selectedFeature && selectedFeature.length > 0){
      content = selectedFeature.map(function(feature, i) {
          return (<FeatureInfoSection key={i} feature={feature} clock={clock} />);
        });
    }
    return(<ul className="feature-info-panel list-reset white" aria-hidden={!this.props.isVisible} >{content}</ul>);
  }
});

module.exports = FeatureInfoPanel;
