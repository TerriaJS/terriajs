'use strict';
var Mustache = require('mustache');
var React = require('react');
var defined = require('terriajs-cesium/Source/Core/defined');

var FeatureInfoSection = React.createClass({
    propTypes: {
        template: React.PropTypes.object,
        feature: React.PropTypes.object,
        clock: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            isOpen: false
        };
    },

    toggleSection: function() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    htmlFromFeature: function(feature, clock) {
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
        return {
            __html: description
        };
    },

    render: function() {
        var iconClass = 'icon ' + (this.state.isOpen ? 'icon-show-less' : 'icon-show-more');
        return (<li className="feature-info-panel__section"><button onClick={this.toggleSection} className='btn'>{this.props.feature.properties.name}<i className={iconClass}></i></button><section className='feature-info-panel__content' aria-hidden={!this.state.isOpen} dangerouslySetInnerHTML={this.htmlFromFeature(this.props.feature, this.props.clock)}/></li>);
    }
});

//to do : handle if feature.description is time-varying

module.exports = FeatureInfoSection;
