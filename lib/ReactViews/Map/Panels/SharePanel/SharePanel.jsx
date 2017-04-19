'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {buildShareLink, buildShortShareLink, canShorten} from './BuildShareLink';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import MenuPanel from '../../../StandardUserInterface/customizable/MenuPanel.jsx';

import Styles from './share-panel.scss';
import DropdownStyles from '../panel.scss';
import Icon from "../../../Icon.jsx";

const SharePanel = createReactClass({
    displayName: 'SharePanel',
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: PropTypes.object,
        userPropWhiteList: PropTypes.array,
        isOpen: PropTypes.bool,
        shortenUrls: PropTypes.bool,
        viewState: PropTypes.object.isRequired
    },

    getDefaultProps() {
        return {
            isOpen: false,
            shortenUrls: false
        };
    },

    getInitialState() {
        return {
            shortenUrls: this.props.shortenUrls && this.props.terria.getLocalProperty('shortenShareUrls'),
            imageUrl: '',
            shareUrl: ''
        };
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

    isUrlShortenable() {
        return canShorten(this.props.terria);
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

    onOpenChanged(open) {
        this.setState({
            isOpen: open
        });

        if (open) {
            this.props.terria.currentViewer.captureScreenshot().then(dataUrl => {
                this.setState({
                    imageUrl: dataUrl
                });
            });

            this.updateForShortening();
        }
    },

    render() {
        const dropdownTheme = {
            btn: Styles.btnShare,
            outer: Styles.sharePanel,
            inner: Styles.dropdownInner,
            icon: 'share'
        };

        const iframeCode = this.state.shareUrl.length ?
            `<iframe style="width: 720px; height: 405px; border: none;" src="${this.state.shareUrl}" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>`
            : '';
        const shareImgStyle = {
            backgroundImage: 'url(' + this.state.imageUrl + ')'
        };

        return (
            <MenuPanel theme={dropdownTheme}
                       btnText="Share"
                       viewState={this.props.viewState}
                       btnTitle="Share your map with others"
                       onOpenChanged={this.onOpenChanged}
                       smallScreen={this.props.viewState.useSmallScreenInterface}>
                <If condition={this.state.isOpen}>
                        <div className={DropdownStyles.section}>
                            <div className={Styles.imgShare} style={shareImgStyle}></div>
                            <div className={Styles.linkWrapper}>
                                <a className={Styles.link} href={this.state.imageUrl} target='_blank'>View full size image</a>
                            </div>
                        </div>
                        <div className={DropdownStyles.section}>
                            <p className={Styles.paragraph}>To copy to clipboard, click the link below and press CTRL+C or ⌘+C:</p>
                            <input className={Styles.field} type="text" value={this.state.shareUrl}
                                   placeholder={this.state.placeholder} readOnly
                                   onClick={e => e.target.select()}/>
                        </div>
                        <div className={DropdownStyles.section}>
                            <p className={Styles.paragraph}>To embed, copy this code to embed this map into an HTML page:</p>
                            <input className={Styles.field} type="text" readOnly placeholder={this.state.placeholder}
                                   value={iframeCode}
                                   onClick={e => e.target.select()}/>
                        </div>
                        <If condition={this.isUrlShortenable()}>
                            <div className={classNames(DropdownStyles.section, Styles.shortenUrl)}>
                                <button onClick={this.onShortenClicked}>
                                    {this.shouldShorten() ? <Icon glyph={Icon.GLYPHS.checkboxOn}/> : <Icon glyph={Icon.GLYPHS.checkboxOff}/>}
                                    Shorten the share URL using a web service
                                </button>
                            </div>
                        </If>
                </If>
            </MenuPanel>
        );
    },
});

export default SharePanel;
