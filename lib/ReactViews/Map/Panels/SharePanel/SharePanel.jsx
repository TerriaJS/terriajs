'use strict';

import { buildShareLink, buildShortShareLink, canShorten } from './BuildShareLink';
import anyImageToPngBlob from '../../../../Map/anyImageToPngBlob';
import classNames from 'classnames';
import Clipboard from '../../../Clipboard';
import createGuid from 'terriajs-cesium/Source/Core/createGuid';
import createReactClass from 'create-react-class';
import dateformat from 'dateformat';
import defined from 'terriajs-cesium/Source/Core/defined';
import DropdownStyles from '../panel.scss';
import FileSaver from 'file-saver';
import flatten from '../../../../Core/flatten';
import Icon from "../../../Icon.jsx";
import Loader from '../../../Loader';
import loadImage from 'terriajs-cesium/Source/Core/loadImage';
import MenuPanel from '../../../StandardUserInterface/customizable/MenuPanel.jsx';
import ObserverModelMixin from '../../../ObserveModelMixin';
import PrintView from './PrintView';
import PropTypes from 'prop-types';
import React from 'react';
import Styles from './share-panel.scss';
import when from 'terriajs-cesium/Source/ThirdParty/when';
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
            shareUrl: '',
            creatingPrintView: false,
            creatingDownload: false
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

    print() {
        this.createPrintView(true, true);
    },

    showPrintView() {
        this.createPrintView(false, false);
    },

    createPrintView(hidden, printAutomatically) {
        this.setState({
            creatingPrintView: true
        });

        let iframe;
        if (hidden) {
            iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
        }

        PrintView.create(this.props.terria, iframe ? iframe.contentWindow : undefined, printWindow => {
            if (iframe) {
                // Remove the hidden iframe after printing.
                // Note that if printAutomatically is false, this will never be invoked
                // so the hidden iframe will hang around in the DOM forever.
                printWindow.onafterprint = function() {
                    document.body.removeChild(iframe);
                };
            }

            if (printAutomatically) {
                // First try printing with execCommand, because, in IE11, `printWindow.print()`
                // prints the entire page instead of just the embedded iframe.
                const result = printWindow.document.execCommand('print', true, null);
                if (!result) {
                    printWindow.print();
                }
            }
        }, printWindow => {
            this.setState({
                creatingPrintView: false
            });
        });
    },

    download() {
        const imageNames = {};
        function getUniqueImageName(image) {
            let name = image.alt;
            if (!name || name.length === 0) {
                // Find a parent element with the 'layer-title' class.
                let node = image.parentNode;
                while (node) {
                    const titleNode = node.getElementsByClassName('layer-title')[0];
                    if (titleNode) {
                        name = titleNode.textContent.trim();
                        break;
                    }
                    node = node.parentNode;
                }
            }

            if (!name || name.length === 0) {
                name = 'image';
            }

            if (imageNames[name] && imageNames[name] !== image) {
                // Name already exists, add a number to make it unique.
                for (let i = 1; i < 100; ++i) {
                    const candidate = name + '-' + i;
                    if (!imageNames[candidate] || imageNames[candidate] === image) {
                        name = candidate;
                        break;
                    }
                }

                if (imageNames[name] && imageNames[name] !== image) {
                    // Give up and use a guid
                    name = createGuid();
                }
            }

            imageNames[name] = image;

            return name;
        }

        this.setState({
            creatingDownload: true
        });

        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        PrintView.create(this.props.terria, iframe.contentWindow, printWindow => {
            const images = printWindow.document.getElementsByTagName('img');
            const imageBlobPromises = Array.prototype.map.call(images, function(image) {
                return anyImageToPngBlob(image).then(blob => {
                    const name = getUniqueImageName(image) + '.png';

                    // Squirrel away the original dimensions, because setting src with an inaccessible image
                    // (in this context) will cause the dimensions to change in some browsers.
                    image._originalDimensions = {
                        naturalWidth: image.naturalWidth,
                        naturalHeight: image.naturalHeight
                    };

                    image.src = name;
                    return [{
                        name: name,
                        reader: new zip.BlobReader(blob)
                    }];
                }).otherwise(e => {
                    // Could not create a blob for this image. Some possible reasons:
                    //    * It is a cross-origin image without CORS support so drawing it to a canvas tainted the canvas.
                    //    * The web browser doesn't support HTMLCanvasElement.toBlob or msToBlob
                    // So leave the image src as-is and hope for the best.
                    return undefined;
                });
            });

            const svgs = printWindow.document.getElementsByTagName('svg');
            const svgPromises = Array.prototype.map.call(svgs, function(svg) {
                const svgStyle = printWindow.document.createElement('style');
                svgStyle.innerHTML = PrintView.Styles;
                svg.insertBefore(svgStyle, svg.childNodes[0]);
                const svgText = new XMLSerializer().serializeToString(svg);
                const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
                return loadImage(url).then(image => {
                    return anyImageToPngBlob(image).then(blob => {
                        const uniqueName = getUniqueImageName(svg);

                        // Replace the SVG with the image
                        svg.parentNode.replaceChild(image, svg);
                        const pngName = uniqueName + '.png';
                        image.src = pngName;

                        // Add both the SVG and the generated PNG to the ZIP.
                        return [{
                            name: uniqueName + '.svg',
                            reader: new zip.TextReader(svgText)
                        }, {
                            name: pngName,
                            reader: new zip.BlobReader(blob)
                        }];
                    });
                });
            });

            const resourcePromises = imageBlobPromises.concat(svgPromises);

            when.all(resourcePromises).then(resources => {
                const writer = new zip.BlobWriter();
                zip.createWriter(writer, zipWriter => {
                    const html = printWindow.document.documentElement.outerHTML;

                    // Create a tweaked version of the HTML for MS Word, which has terrible CSS support
                    const images = printWindow.document.getElementsByTagName('img');
                    Array.prototype.forEach.call(images, function(image) {
                        if (image._originalDimensions && image._originalDimensions.naturalWidth > 560) {
                            image.height = image._originalDimensions.naturalHeight * 560 / image._originalDimensions.naturalWidth;
                            image.width = 560;
                        }
                    });
                    const wordHtml = printWindow.document.documentElement.outerHTML;

                    // Collect all the resources we'll be adding to the ZIP file.
                    const allResources = [{
                        name: 'index.html',
                        reader: new zip.TextReader(html)
                    }, {
                        name: 'index.doc',
                        reader: new zip.TextReader(wordHtml)
                    }, ...flatten(resources).filter(imageResource => imageResource !== undefined)];

                    // And add them.
                    let resourceIndex = 0;

                    const addNextResource = () => {
                        if (resourceIndex >= allResources.length) {
                            zipWriter.close(blob => {
                                FileSaver.saveAs(blob, this.props.terria.appName + ' ' + dateformat(new Date(), 'yyyymmdd\'T\'HHMMss') + '.zip');
                                this.setState({
                                    creatingDownload: false
                                });
                            });
                        } else {
                            const resource = allResources[resourceIndex];
                            ++resourceIndex;
                            zipWriter.add(resource.name, resource.reader, addNextResource);
                        }
                    };

                    addNextResource();
                }, message => {
                    this.setState({
                        creatingDownload: false
                    });
                    this.props.terria.error.raiseEvent({
                        title: 'Error creating ZIP file',
                        message: 'An error occurred while creating a ZIP file for download.  Technical details, if any, are below:\n<pre>\n' + message + '\n</pre>'
                    });
                });
            });
        });
    },

    renderContent(iframeCode, shareUrlTextBox) {
      const supportedFormats = [
        {
            name: 'Download (ZIP)'
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
            <div className={Styles.printViewLoader}>
                {this.state.creatingDownload && <Loader message="Creating download..." />}
            </div>
          </div>
          <div className={DropdownStyles.section}>
            <div>Print Map</div>
            <div className={Styles.explanation}>Open a printable version of this map.</div>
            <div>
                <button className={Styles.printButton} onClick={this.print} disabled={this.state.creatingPrintView}>Print</button>
                <button className={Styles.printButton} onClick={this.showPrintView} disabled={this.state.creatingPrintView}>Show Print View</button>
                <div className={Styles.printViewLoader}>
                    {this.state.creatingPrintView && <Loader message="Creating print view..." />}
                </div>
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
            <button key={format.name} className={Styles.formatButton} onClick={this.download} disabled={this.state.creatingDownload}>{format.name}</button>
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
            </div>
        );
    },
});

export default SharePanel;
