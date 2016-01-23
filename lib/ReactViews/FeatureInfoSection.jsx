'use strict';
const Mustache = require('mustache');
const React = require('react');
const defined = require('terriajs-cesium/Source/Core/defined');

// Individual feature info section
const FeatureInfoSection = React.createClass({
    propTypes: {
        template: React.PropTypes.object,
        feature: React.PropTypes.object,
        clock: React.PropTypes.object,
        catalogItemName: React.PropTypes.string,
        index: React.PropTypes.number
    },

    getInitialState() {
        return {
            isOpen: this.props.index === 0
        };
    },

    componentWillReceiveProps() {
        this.setState({
            isOpen: this.props.index === 0
        });
    },

    toggleSection() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    htmlFromFeature(feature, clock) {
        // If a template is defined, render it using feature.properties, which is non-time-varying.
        // If no template is provided, show feature.description, which may be time-varying.
        const data = feature.properties;

        if (defined(this.props.template)) {
            return Mustache.render(this.props.template, data);
        }
        const description = feature.description.getValue(clock.currentTime);
        if (description.properties) {
            return JSON.stringify(description.properties);
        }
        return {
            __html: description
        };
    },

    renderIconClass() {
        return 'icon ' + (this.state.isOpen ? 'icon-chevron-down' : 'icon-chevron-right');
    },

    renderDataTitle() {
        if(defined(this.props.catalogItemName)) {
            return this.props.catalogItemName;
        }
        return 'data group';
    },

    render() {
        return (<li className={'feature-info-panel__section ' + (this.state.isOpen ? 'is-visible' : '')}><button onClick={this.toggleSection} className='btn btn-feature-name'>{this.renderDataTitle()}<i className={this.renderIconClass()}></i></button><section className='feature-info-panel__content' dangerouslySetInnerHTML={this.htmlFromFeature(this.props.feature, this.props.clock)}/></li>);
    }
});

// To do : handle if feature.description is time-varying

module.exports = FeatureInfoSection;
