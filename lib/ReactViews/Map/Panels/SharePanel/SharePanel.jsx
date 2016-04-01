'use strict';

import React from 'react';
import {buildShareLink, buildShortShareLink} from './BuildShareLink';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';

const SharePanel = React.createClass({
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        userPropWhiteList: React.PropTypes.array,
        isOpen: React.PropTypes.bool
    },

    getDefaultProps() {
        return {
            isOpen: false
        };
    },

    getInitialState() {
        return {
            imageUrl: '',
            shareUrl: ''
        };
    },

    componentWillMount() {
        this.props.terria.currentViewer.captureScreenshot().then(dataUrl => {
            this.setState({
                imageUrl: dataUrl
            });
        });

        this.updateForShortening();
    },

    updateForShortening() {
        this.setState({
            shareUrl: ''
        });

        if (this.shouldShorten()) {
            this.setState({
                placeholder: 'Shortening...'
            });

            buildShortShareLink(this.props.terria)
                .then(shareUrl => this.setState({shareUrl}))
                .otherwise(() => {
                    this.setUnshortenedUrl();
                    this.setState({
                        errorMessage: 'An error occurred while attempting to shorten the URL.  Please check your internet connection and try again.'
                    });
                });
        } else {
            this.setUnshortenedUrl();
        }
    },

    setUnshortenedUrl() {
        this.setState({
            shareUrl: buildShareLink(this.props.terria)
        });
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
        const localStoragePref = this.props.terria.getLocalProperty('shortenShareUrls');

        return this.isUrlShortenable() && (localStoragePref || !defined(localStoragePref));
    },

    onShortenClicked(e) {
        if (this.shouldShorten()) {
            this.props.terria.setLocalProperty('shortenShareUrls', false);
        } else if (this.isUrlShortenable()) {
            this.props.terria.setLocalProperty('shortenShareUrls', true);
        } else {
            return;
        }

        this.updateForShortening();
        this.forceUpdate();
    },

    render() {
        // Only generate it if we're currently open
        if (this.props.isOpen) {
            const iframeCode = this.state.shareUrl.length ? `<iframe style="width: 720px; height: 405px; border: none;"` +
                `src="${this.state.shareUrl}" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>` : '';

            return (
                <div>
                    <h3 className='dd_panel-header dd-panel__section'>Share</h3>
                    <div className="dd-panel__section">
                        <img src={this.state.imageUrl}/>
                    </div>
                    <label className="dd-panel__section">
                        To copy to clipboard, click the link below and press CTRL+C or ⌘+C:
                        <input className="field" type="text" value={this.state.shareUrl}
                               placeholder={this.state.placeholder} readOnly
                               onClick={e => e.target.select()}/>
                    </label>
                    <label className="dd-panel__section">
                        To embed, copy this code to embed this map into an HTML page:
                        <input className="field" type="text" readOnly placeholder={this.state.placeholder}
                               value={iframeCode}
                               onClick={e => e.target.select()}/>
                    </label>
                    <label className="dd-panel__section">
                        <input type="checkbox" checked={this.shouldShorten()} onChange={this.onShortenClicked}
                               disabled={!this.isUrlShortenable()}/>
                        Shorten the share URL using a web service
                    </label>
                </div>
            );
        }
    }
});

export default SharePanel;
