'use strict';

import React from 'react';
import {buildShareLink, buildShortShareLink, canShorten} from './BuildShareLink';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import DropdownPanel from '../DropdownPanel.jsx';

import Styles from './share-panel.scss';
import DropdownStyles from '../dropdown-panel.scss';
import Icon from "../../../Icon.jsx";

const SharePanel = React.createClass({
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        userPropWhiteList: React.PropTypes.array,
        isOpen: React.PropTypes.bool,
        shortenUrls: React.PropTypes.bool,
        viewState: React.PropTypes.object.isRequired
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
            <DropdownPanel theme={dropdownTheme}
                           btnText="Share"
                           viewState={this.props.viewState}
                           btnTitle="change settings"
                           onOpenChanged={this.onOpenChanged}>
                <If condition={this.state.isOpen}>
                    <div className={classNames(Styles.content, DropdownStyles.content)}>
                        <div className={DropdownStyles.section}>
                            <div className={Styles.imgShare} style={shareImgStyle}></div>
                            <div className={Styles.imgLink}>
                                <a href={this.state.imageUrl} target='_blank'>View full size image</a>
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
                                <button
                                    className={classNames(Styles.btn, {[Styles.btnCheckboxOn]: this.shouldShorten(), [Styles.btnCheckboxOff]: !this.shouldShorten()})}
                                    onClick={this.onShortenClicked}>
                                    {this.shouldShorten() ? <Icon glyph={Icon.GLYPHS.checkboxOn}/> : <Icon glyph={Icon.GLYPHS.checkboxOff}/>}
                                    Shorten the share URL using a web service
                                </button>
                            </div>
                        </If>
                    </div>
                </If>
            </DropdownPanel>
        );
    }
});

export default SharePanel;
