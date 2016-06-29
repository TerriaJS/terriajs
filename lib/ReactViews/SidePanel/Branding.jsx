'use strict';
import defined from 'terriajs-cesium/Source/Core/defined';
import parseCustomHtmlToReact from '../../Models/parseCustomHtmlToReact';
import React from 'react';
import Styles from './branding.scss';

const Branding = React.createClass({
    propTypes: {
        terria: React.PropTypes.object.isRequired,
        version: React.PropTypes.string,
        onClick: React.PropTypes.func
    },

    render() {
        let brandingHtmlElements = this.props.terria.configParameters.brandBarElements;
        if (!defined(brandingHtmlElements)) {
            brandingHtmlElements = ['<a target="_blank" href="http://terria.io"><img src="images/terria_logo.png" height="52" title="Version: {{ version }}" /></a>'];
        }

        const version = this.props.version || 'Unknown';

        return (
            <div className={Styles.branding}>
                <For each="element" of={brandingHtmlElements}>
                    {parseCustomHtmlToReact(element.replace(/\{\{\s*version\s*\}\}/g, version))}
                </For>
            </div>
        );
    }
});

module.exports = Branding;
