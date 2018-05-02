'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {buildShareLink, buildShortShareLink, canShorten} from './BuildShareLink';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import MenuPanel from '../../../StandardUserInterface/customizable/MenuPanel.jsx';
import Clipboard from '../../../Clipboard';
import PrintView from './PrintView';
import Styles from './share-panel.scss';
import DropdownStyles from '../panel.scss';
import Icon from "../../../Icon.jsx";
import FileSaver from 'file-saver';
import zip from 'terriajs-cesium/Source/ThirdParty/zip';

const SharePanel = createReactClass({
    displayName: 'SharePanel',
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: PropTypes.object,
        userPropWhiteList: PropTypes.array,
        isOpen: PropTypes.bool,
        advancedIsOpen: PropTypes.bool,
        shortenUrls: PropTypes.bool,
        viewState: PropTypes.object.isRequired
    },

    getDefaultProps() {
        return {
            isOpen: false,
            advancedIsOpen: false,
            shortenUrls: false
        };
    },

    getInitialState() {
        return {
            shortenUrls: this.props.shortenUrls && this.props.terria.getLocalProperty('shortenShareUrls'),
            shareUrl: ''
        };
    },

    advancedOptions() {
        return this.state.advancedIsOpen;
    },

    toggleAdvancedOptions(e) {
        this.setState((prevState) => ({
            advancedIsOpen: !prevState.advancedIsOpen
        }));
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
            this.updateForShortening();
        }
    },

    openPrintView() {
        PrintView.create(this.props.terria, undefined, printWindow => {
            printWindow.print();
        });
    },

    download() {
        PrintView.create(this.props.terria, undefined, printWindow => {
            const html = printWindow.document.documentElement.outerHTML;
            const writer = new zip.BlobWriter();
            zip.createWriter(writer, function(zipWriter) {
                zipWriter.add('print.html', new zip.TextReader(html), function() {
                    zipWriter.close(function(blob) {
                        FileSaver.saveAs(blob, "print.zip");
                    });
                });
            }, message => {
                alert(message);
            });

            // const blob = new Blob([html], {
            //     type: "text/html;charset=utf-8"
            // });
            // FileSaver.saveAs(blob, "print.html");
        });
    },

    renderContent(iframeCode, shareUrlTextBox) {
      const supportedFormats = [
        {
            name: 'Web Page (HTML)'
        },
        {
            name: 'Microsoft Word (DOCX)'
        },
        {
            name: 'Adobe Acrobat (PDF)'
        }
      ];

      return (
        <div>
          <div className={Styles.clipboard}><Clipboard source={shareUrlTextBox} id='share-url'/></div>
          <div className={DropdownStyles.section}>
            <div>Download Map</div>
            <div className={Styles.explanation}>Download the map image, legends and dataset descriptions.</div>
            <div>
                {supportedFormats.map(this.renderDownloadFormatButton)}
            </div>
          </div>
          <div className={DropdownStyles.section}>
            <div>Print Map</div>
            <div className={Styles.explanation}>Open a printable version of this map.</div>
            <div>
                <button className={Styles.printButton} onClick={this.openPrintView}>Print</button>
            </div>
          </div>
          <div className={classNames(DropdownStyles.section, Styles.shortenUrl)}>
              <div className={Styles.btnWrapper}>
                  <button type='button' onClick={this.toggleAdvancedOptions} className={Styles.btnAdvanced}>
                      <span>Advanced options</span>
                      {this.advancedOptions()? <Icon glyph={Icon.GLYPHS.opened}/> : <Icon glyph={Icon.GLYPHS.closed}/>}
                  </button>
              </div>
              <If condition={this.advancedOptions()}>
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
          </div>
        </div>);
    },

    renderDownloadFormatButton(format) {
        return (
            <button key={format.name} className={Styles.formatButton} onClick={this.download}>{format.name}</button>
        );
    },

    render() {
        const dropdownTheme = {
            btn: Styles.btnShare,
            outer: Styles.sharePanel,
            inner: Styles.dropdownInner,
            icon: 'share'
        };

        const iframeCode = this.state.shareUrl.length ?
            `<iframe style="width: 720px; height: 600px; border: none;" src="${this.state.shareUrl}" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>`
            : '';

        const shareUrlTextBox = <input className={Styles.shareUrlfield} type="text" value={this.state.shareUrl}
               placeholder={this.state.placeholder} readOnly
               onClick={e => e.target.select()} id='share-url'/>;

        return (
            <div>
                <MenuPanel theme={dropdownTheme}
                        btnText="Share"
                        viewState={this.props.viewState}
                        btnTitle="Share your map with others"
                        onOpenChanged={this.onOpenChanged}
                        smallScreen={this.props.viewState.useSmallScreenInterface}>
                    <If condition={this.state.isOpen}>
                        {this.renderContent(iframeCode, shareUrlTextBox)}
                    </If>
                </MenuPanel>
                <If condition={this.state.print}>
                    <PrintView terria={this.props.terria} viewState={this.props.viewState} onClose={this.closePrintView} />
                </If>
            </div>
        );
    },
});

export default SharePanel;
