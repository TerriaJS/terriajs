var Mustache = require('mustache');

var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

var FeatureInfoSection = React.createClass({
  htmlFromFeature: function(feature, clock){
    // If a template is defined, render it using feature.properties, which is non-time-varying.
    // If no template is provided, show feature.description, which may be time-varying.
    var data = feature.properties;
    // if (defined(viewModel.template)) {
    //     return Mustache.render(viewModel.template, data, viewModel.partials);
    // }
    var description = feature.description.getValue(clock.currentTime);
    if (description.properties) {
        return JSON.stringify(description.properties);
    }
    return {__html: description};
  },

  render: function() {
    return (<li className="feature-info-panel__section" dangerouslySetInnerHTML={this.htmlFromFeature(this.props.feature, this.props.clock)}/>);
  }
});

module.exports = FeatureInfoSection;
