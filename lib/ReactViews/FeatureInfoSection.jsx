'use strict';
var Mustache = require('mustache');
var React = require('react');
var defined = require('terriajs-cesium/Source/Core/defined');

var FeatureInfoSection = React.createClass({
    propTypes: {
        template: React.PropTypes.object,
        feature: React.PropTypes.object,
        clock: React.PropTypes.object,
        catalogItemName: React.PropTypes.string,
        index: React.PropTypes.number
    },

    getInitialState: function() {
        return {
            isOpen: this.props.index === 0 ? true : false
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
        var title = 'data group';
        if (defined(this.props.catalogItemName)){
            title = this.props.catalogItemName;
        }
        var iconClass = 'icon ' + (this.state.isOpen ? 'icon-chevron-down' : 'icon-chevron-right');
        return (<li className={'feature-info-panel__section ' + (this.state.isOpen ? 'is-visible' : '')}><button onClick={this.toggleSection} className='btn btn-feature-name'>{title}<i className={iconClass}></i></button><section className='feature-info-panel__content' dangerouslySetInnerHTML={this.htmlFromFeature(this.props.feature, this.props.clock)}/></li>);
    }
});

//to do : handle if feature.description is time-varying

module.exports = FeatureInfoSection;
