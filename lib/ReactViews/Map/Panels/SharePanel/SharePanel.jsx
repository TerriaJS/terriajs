'use strict';
import React from 'react';
import DropdownPanel from '../DropdownPanel.jsx';

const SharePanel = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        userPropWhiteList: React.PropTypes.array,
        shortenUrls: React.PropTypes.bool
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
        return (
            <DropdownPanel btnClass="btn--map" btnText="Share" btnTitle="change settings" className="share-panel">
                <div>
                    <label className='label label--setting-panel'>Share</label>
                    <img></img>
                    <label>
                        To copy to clipboard, click the link below and press CTRL+C or ⌘+C:
                        <input type="text" />
                    </label>
                    <label>
                        To embed, copy this code to embed this map into an HTML page:
                        <input type="text" />
                    </label>
                    <label>
                        <input type="checkbox" />
                        Shorten the share URL using a web service
                    </label>
                </div>
            </DropdownPanel>
        );
    }
});

export default SharePanel;
