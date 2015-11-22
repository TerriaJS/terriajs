var Mustache = require('mustache');

var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

var FeatureInfoSection = React.createClass({
  getInitialState: function() {
    return {
      isOpen: this.props.id === 0 ? true : false
    };
  },

  toggleSection: function(){
    this.setState({
      isOpen: !this.state.isOpen
    });
  },

  htmlFromFeature: function(feature, clock){
    // If a template is defined, render it using feature.properties, which is non-time-varying.
    // If no template is provided, show feature.description, which may be time-varying.
    var data = feature.properties;
    if (defined(this.props.template)) {
        return Mustache.render(this.props.template, data);
    }
    var description = feature.description.getValue(clock.currentTime);
    if (description.properties) {
        return JSON.stringify(description.properties);
    }
    return {__html: description};
  },

  render: function() {
    return (<li className="feature-info-panel__section"><button onClick={this.toggleSection} className='btn'>{this.state.isOpen? 'Collapse - ' : 'Show + '}</button><section aria-hidden={!this.state.isOpen} dangerouslySetInnerHTML={this.htmlFromFeature(this.props.feature, this.props.clock)}/></li>);
  }
});

//to do : handle if feature.description is time-varying

module.exports = FeatureInfoSection;
