'use strict';

import React from 'react';
import buildShareLink from './BuildShareLink';
import ObserverModelMixin from '../../../ObserveModelMixin';

const SharePanel = React.createClass({
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        userPropWhiteList: React.PropTypes.array,
        shortenUrls: React.PropTypes.bool,
        isOpen: React.PropTypes.bool.isRequired
    },

    getDefaultProps() {
        return {
            userPropWhiteList: ['hideExplorerPanel', 'activeTabId'],
            shortenUrls: true
        };
    },

    getInitialState() {
        return {
            shortenUrls: this.props.shortenUrls && this.props.terria.getLocalProperty('shortenShareUrls')
        };
    },

    isUrlShortenable() {
        return this.props.terria.urlShortener && this.props.terria.urlShortener.isUsable;
    },

    shouldShorten() {
        return this.props.shortenUrls && this.isUrlShortenable;
    },

    render() {
        const shareLink = this.props.isOpen && buildShareLink(this.props.terria);

        return (
            <div>
                <If condition={this.props.isOpen}>
                    <label className='label label--setting-panel dd-panel__section'>Share</label>
                    <img></img>
                    <label className="dd-panel__section">
                        To copy to clipboard, click the link below and press CTRL+C or ⌘+C:
                        <input type="text" value={shareLink.longUrl} readOnly/>
                    </label>
                    <label className="dd-panel__section">
                        To embed, copy this code to embed this map into an HTML page:
                        <input type="text"/>
                    </label>
                    <label className="dd-panel__section">
                        <input type="checkbox"/>
                        Shorten the share URL using a web service
                    </label>
                </If>
            </div>
        );
    }
});

export default SharePanel;
