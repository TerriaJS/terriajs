'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import MenuPanel from '../../../StandardUserInterface/customizable/MenuPanel.jsx';
import DatasetTesting from './DatasetTesting';
import CountDatasets from './CountDatasets';
import OpenDatasets from './OpenDatasets';
import loadImage from 'terriajs-cesium/Source/Core/loadImage';
import loadWithXhr from 'terriajs-cesium/Source/Core/loadWithXhr';
import WebMercatorTilingScheme from 'terriajs-cesium/Source/Core/WebMercatorTilingScheme';
import Styles from './tools-panel.scss';
import DropdownStyles from '../panel.scss';
import Icon from "../../../Icon.jsx";
import CatalogGroup from '../../../../Models/CatalogGroup';
import when from 'terriajs-cesium/Source/ThirdParty/when';


let countValue = 1;

const ToolsPanel = createReactClass({
    displayName: 'ToolsPanel',
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            isOpen: false,
            resultsTitle: '',
            resultsMessage: ''
        };
    },

    onOpenChanged(open) {
        this.setState({
            isOpen: open
        });
    },

    countDatasets() {
        const totals = {
            name: undefined,
            groups: 0,
            items: 0,
            messages: [],
            subTotals: [],
            showResults: false
        };

        function counter(group, stats, path) {
            stats.name = group.name;

            let promises = [];


            for (var i = 0; i < group.items.length; ++i) {
                var item = group.items[i];
                if (item.countValue === countValue) {
                    continue;
                }
                item.countValue = countValue;
                if (typeof item.items !== 'undefined') {
                    var childStats = {
                        name: undefined,
                        groups: 0,
                        items: 0,
                        messages: [],
                        subTotals: []
                    };

                    path.push(item.name);

                    var loadPromise = item.load();
                    if (defined(loadPromise) && item.isLoading) {
                        promises.push(loadPromise.then(recurseAndUpdateTotals.bind(undefined, item, stats, childStats, path.slice())).otherwise(reportLoadError.bind(undefined, item, stats, path.slice())));
                    } else {
                        promises.push(recurseAndUpdateTotals(item, stats, childStats, path));
                    }

                    path.pop();
                } else {
                    ++stats.items;
                }
            }

            return when.all(promises);
        }

        function recurseAndUpdateTotals(item, stats, childStats, path) {
            const promise = counter(item, childStats, path).then(function() {
                stats.groups += childStats.groups + 1;
                stats.items += childStats.items;
                stats.messages.push.apply(stats.messages, childStats.messages);
                stats.subTotals.push(childStats);
            });
            return promise;
        }

        function reportLoadError(item, stats, path) {
            stats.messages.push(path.join(' -> ') + ' failed to load.');
        }

        this.setState({
          showResults: true,
          resultsTitle: 'Dataset Count',
          resultsMessage: 'Loading and counting, please wait...'
        })


        ++countValue;

        const root = this.props.terria.catalog.group;
        const that = this;

        counter(root, totals, []).then(function() {
            let info = '<div>The catalog contains ' + totals.items + ' items in ' + totals.groups + ' groups.</div>';

            let i;
            let subTotals = totals.subTotals;
            for (i = 0; i < subTotals.length; ++i) {
                info += '<div>' + subTotals[i].name + ': ' + subTotals[i].items + ' items / ' + subTotals[i].groups + ' groups</div>';
            }

            info += '<div>&nbsp;</div>';

            const messages = totals.messages;
            for (i = 0; i < messages.length; ++i) {
                info += '<div>' + messages[i] + '</div>';
            }
            that.setState({
              resultsMessage: info
            })
        });
    },
    requestTiles(requests, minLevel, maxLevel) {
        const app = this.props.terria;

        let urls = [];
        let names = [];
        let blacklistGroups = [];
        let stats = [];
        let uniqueStats = [];
        let name;
        let blacklistGroup;
        let stat;
        let maxTilesPerLevel = -1; // only request this number of tiles per zoom level, randomly selected. -1 = no limit.

        loadImage.createImage = function(url, crossOrigin, deferred) {
            urls.push(url);
            names.push(name);
            blacklistGroups.push(blacklistGroup);
            stats.push(stat);
            if (defined(deferred)) {
                deferred.resolve();
            }
        };

        const oldMax = throttleRequestByServer.maximumRequestsPerServer;
        throttleRequestByServer.maximumRequestsPerServer = Number.MAX_VALUE;

        this.setState({
          showResults: true,
          resultsTitle: 'Dataset Testing',
          resultsMessage: ''
        })

        let i;
        for (i = 0; i < requests.length; ++i) {
            const request = requests[i];

            if (!request.provider.ready) {
              this.setState({
                resultsMessage: `Catalog item ${request.item.name} skipped because it did not get ready in time.`
              })
              continue;
            }

            let extent;
            if (request.provider.rectangle && request.item.rectangle) {
                extent = Rectangle.intersection(request.provider.rectangle, request.item.rectangle);
            } else if (request.provider.rectangle) {
                extent = request.provider.rectangle;
            } else if (request.item.rectangle) {
                extent = request.item.rectangle;
            }

            if (!defined(extent)) {
                extent = app.homeView.rectangle;
            }

            name = request.item.name;
            blacklistGroup = request.blacklistGroup;

            let tilingScheme;
            const leaflet = app.leaflet;
            if (defined(leaflet)) {
                request.provider = request.item._imageryLayer;
                tilingScheme = new WebMercatorTilingScheme();
                leaflet.map.addLayer(request.provider);
            } else {
                tilingScheme = request.provider.tilingScheme;
            }

            stat = {
                name: name,
                success: {
                    min: 999999,
                    max: 0,
                    sum: 0,
                    number: 0,
                    slow: 0
                },
                error: {
                    min: 999999,
                    max: 0,
                    sum: 0,
                    number: 0
                }
            };
            uniqueStats.push(stat);

            for (let level = minLevel; level <= maxLevel; ++level) {
                const nw = tilingScheme.positionToTileXY(Rectangle.northwest(extent), level);
                const se = tilingScheme.positionToTileXY(Rectangle.southeast(extent), level);
                if (!defined(nw) || !defined(se)) {
                    // Extent is probably junk.
                    resultsMessage += '<div>Catalog item ' + request.item.name + ' level ' + level + ' skipped because its extent is not valid.</div>';
                    continue;
                }
                let potentialTiles = [];
                for (let y = nw.y; y <= se.y; ++y) {
                    for (let x = nw.x; x <= se.x; ++x) {
                        potentialTiles.push({"x": x, "y": y, "z": level});
                    }
                }
                // randomly select up to maxTilesPerLevel of those tiles
                let t=1;
                while (potentialTiles.length > 0 && (maxTilesPerLevel === -1 || t++ <= maxTilesPerLevel)) {
                    let tnum;
                    if (maxTilesPerLevel < 0) {
                        // if there's no tile limit, revert to fetching all tiles in order, for predictability.
                        tnum = 0;
                    } else {
                        tnum = Math.floor(Math.random() * potentialTiles.length);
                    }
                    const tile = potentialTiles[tnum];
                    if (defined(leaflet)) {
                        loadImage.createImage(request.provider.getTileUrl(tile));
                    } else if (!defined(request.provider.requestImage(tile.x, tile.y, tile.z))) {
                        console.log('too many requests in flight');
                    }
                    potentialTiles.splice(tnum,1);

                }
            }
            if (defined(request.item._postCache)) {
                request.item._postCache();
            }
            if (request.enabledHere) {
                if (defined(leaflet)) {
                   leaflet.map.removeLayer(request.provider);
                }
                request.item._disable();
            }
        }

        this.setState({
          resultsMessage: `Requesting ${urls.length} URLs from ${requests.length}  data sources, at zooms ${minLevel}  to maxLevel`
        })

        loadImage.createImage = loadImage.defaultCreateImage;
        throttleRequestByServer.maximumRequestsPerServer = oldMax;

        let maxRequests = 1;
        let nextRequestIndex = 0;
        let inFlight = 0;
        let urlsRequested = 0;
        let showProgress = true;

        function doneUrl(stat, startTime, error) {
            const ellapsed = getTimestamp() - startTime;

            let resultStat;
            if (error) {
                resultStat = stat.error;
            } else {
                resultStat = stat.success;
                if (ellapsed > maxAverage) {
                    resultStat.slow ++;
                }
            }

            ++resultStat.number;
            resultStat.sum += ellapsed;

            if (ellapsed > resultStat.max) {
                resultStat.max = ellapsed;
            }
            if (ellapsed < resultStat.min) {
                resultStat.min = ellapsed;
            }

            --inFlight;
            doNext();
        }

        function getNextUrl() {
            let url;
            let stat;

            if (nextRequestIndex >= urls.length) {
                return undefined;
            }

            if (showProgress && nextRequestIndex > 0) {

              this.setState({
                resultsMessage: `loading ${Math.round(nextRequestIndex / urls.length * 100)}`
              })
            }

            url = urls[nextRequestIndex];
            name = names[nextRequestIndex]; //track for error reporting
            stat = stats[nextRequestIndex];
            blacklistGroup = blacklistGroups[nextRequestIndex];
            ++nextRequestIndex;

            return {
                url: url,
                name: name,
                stat: stat,
                blacklistGroup: blacklistGroup
            };
        }

        let last;
        let failedRequests = 0;
        let slowDatasets = 0;
        let totalDatasets = 0;

        let blacklist = {};

        let maxAverage = 400;
        let maxMaximum = 800;

        function doNext() {
            const next = getNextUrl();
            if (defined(last) && (!defined(next) || next.name !== last.name)) {
                let resultsMessage = this.state.resultsMessage;

                if (last.stat.error.number === 0) {
                    resultsMessage += last.stat.success.number + ' tiles <span style="color:green">✓</span>';
                } else {
                    resultsMessage += last.stat.success.number + last.stat.error.number + ' tiles (<span style="color:red">' + last.stat.error.number + ' failed</span>)';
                }
                if (last.stat.success.slow > 0) {
                    resultsMessage += ' (' + last.stat.success.slow + ' slow) ';
                }
                const average = Math.round(last.stat.success.sum / last.stat.success.number);
                resultsMessage += ' <span ' + (average > maxAverage ? 'style="color: red"' : '') + '>' +
                  'Average: ' + average + 'ms</span>&nbsp;';
                resultsMessage += '(<span ' + (last.stat.success.max > maxMaximum ? 'style="color: red"' : '') + '>' +
                  'Max: ' + Math.round(last.stat.success.max) + 'ms</span>)';
                resultsMessage += '</div>';

                if (this.state.moreImageryInfo) {
                    const uri = new URI(last.url);
                    const params = uri.search(true);
                    uri.search('');
                    resultsMessage += '<div>Server=' + uri.toString() + '</div>';
                    resultsMessage += '<div>Layers=' + params.layers + '</div>';
                }

                failedRequests += last.stat.error.number;

                if (average > maxAverage || last.stat.success.max > maxMaximum) {
                    ++slowDatasets;
                }
                totalDatasets++;
            }

            if (defined(next) && (!defined(last) || last.name !== next.name) ) {
                resultsMessage += '<h1>' + next.name + '</h1>' + (showProgress ? '<div class="tools-loading-message">Loading:</div' : '');
            }

            last = next;

            if (!defined(next)) {
                if (inFlight === 0) {
                    resultsMessage += '<h1>Summary</h1>';
                    resultsMessage += '<div>Finished ' + nextRequestIndex + ' URLs for ' + totalDatasets + ' datasets.</div>';
                    resultsMessage += '<div>Actual number of URLs requested: ' + urlsRequested + '</div>';
                    resultsMessage += '<div style="' + (failedRequests > 0 ? 'color:red' : '') + '">Failed tile requests: ' + failedRequests + '</div>';
                    resultsMessage += '<div style="' + (slowDatasets > 0 ? 'color:red' : '') + '">Slow datasets: ' + slowDatasets +
                    ' <i>(>' + maxAverage + 'ms average, or >' + maxMaximum + 'ms maximum)</i></div>';

                    const blacklistString = JSON.stringify(blacklist);
                    if (blacklistString.length > 2) {
                        resultsMessage += 'Suggested blacklist: <pre>' + JSON.stringify(blacklist) + '</pre>';
                    }
                }
            }

            const elPopup = document.getElementById('popup-window-content');
            if (elPopup !== null) {
                elPopup.scrollTop = elPopup.scrollHeight - elPopup.offsetHeight;
            }

            if (elPopup === null || !defined(next)) {
                return;
            }

            ++urlsRequested;
            ++inFlight;

            ++next.stat.number;

            let url = next.url;

            if (!this.state.useProxyCache) {
                url = url.replace('proxy/h', 'proxy/_0d/h');
            }

            if (!this.useWmsTileCache) {
                url = url.replace('tiled=true&', '');
            }

            const method = this.purgeProxyCache ? 'PURGE' : 'GET';


            const start = getTimestamp();
            loadWithXhr({
                method: method,
                url : url,
                timeout : 2000
            }).then(function() {
                doneUrl(next.stat, start, false);
            }).otherwise(function(e) {
                if (e && e.isTimeout) {
                    let blacklistGroup = blacklist[next.blacklistGroup];
                    if (!defined(blacklistGroup)) {
                        blacklistGroup = blacklist[next.blacklistGroup] = {};
                    }
                    blacklistGroup[next.name] = true;
                    resultsMessage += '<div><a href="' + next.url + '">Tile request</a> timed out (2 seconds).</div>';
                } else {
                    resultsMessage += '<div><a href="' + next.url + '">Tile request</a> returned error' + (e.statusCode ? (' (code ' + e.statusCode + ')') : '') + '</div>';
                }
                doneUrl(next.stat, start, true);
            });
        }

        this.setState({
          resultsMessage: resultsMessage
        })

        for (i = 0; i < maxRequests; ++i) {
            doNext();
        }
    },
    render() {
        const dropdownTheme = {
            btn: Styles.btnShare,
            outer: Styles.ToolsPanel,
            inner: Styles.dropdownInner,
            icon: 'settings'
        };

        return (
            <MenuPanel theme={dropdownTheme}
                       btnText="Tool"
                       viewState={this.props.viewState}
                       btnTitle="Advanced toolbox"
                       onOpenChanged={this.onOpenChanged}
                       smallScreen={this.props.viewState.useSmallScreenInterface}>
                <If condition={this.state.isOpen}>
                        <div className={DropdownStyles.section}>
                            <div className={Styles.this}>
                              <DatasetTesting terria={this.props.terria} viewState={this.props.viewState} requestTiles={this.requestTiles} getAllRequests={getAllRequests}/>
                              <CountDatasets terria={this.props.terria} viewState={this.props.viewState} countDatasets={this.countDatasets}/>
                              <OpenDatasets terria={this.props.terria} viewState={this.props.viewState}/>
                            </div>
                        </div>
                </If>
                {this.state.showResults && <div className={Styles.results}>
                  <div className={Styles.resultsHeader}>
                    <h3>{this.state.resultsTitle}</h3>
                    <button className={Styles.closeResultsBtn} onClick={()=>this.setState({showResults: false})}><Icon glyph={Icon.GLYPHS.close}/></button>
                  </div>
                  <div dangerouslySetInnerHTML={{__html: this.state.resultsMessage}} />
                </div>}
            </MenuPanel>
        );
    },
});

export default ToolsPanel;






function getAllRequests(types, mode, requests, group, promises, blacklistGroup) {
    function alreadyInRequests(item) {
        for (var i=0; i < requests.length; i++) {
            if (requests[i].item === item) {
                return true;
            }
        }
        return false;
    }
    function generateRequest(item, group, blacklistGroup) {
        return function() {
            var enabledHere = false;
            if (!item.isEnabled) {
                enabledHere = true;
                item._enable();
            }
            var imageryProvider;
            if (defined(item._imageryLayer)) {
                imageryProvider = item._imageryLayer.imageryProvider;
            }
            requests.push({
                item : item,
                blacklistGroup : blacklistGroup,
                group : group.name,
                enabledHere : enabledHere,
                provider : imageryProvider
            });
            return defined(imageryProvider) ? whenImageryProviderIsReady(imageryProvider) : undefined;
        };
    }


    for (var i = 0; i < group.items.length; ++i) {
        var item = group.items[i];
        if (item instanceof CatalogGroup) {
            if (item.isOpen || mode === 'all' || mode === 'enabled') {
                var currentBlacklistGroup = blacklistGroup;
                if (item.type !== 'group') {
                    currentBlacklistGroup = item.name;
                }
                getAllRequests(types, mode, requests, item, promises, currentBlacklistGroup);
            }
        } else if ((types.indexOf(item.type) !== -1) && (mode !== 'enabled' || item.isEnabled)) {

            if (!alreadyInRequests(item)) {
                    //this provides closure for the for loop inside the promise chain
                if (defined(item._preCache)) {
                    item._preCache();
                }

                var promise = when(item.load()).then( ( generateRequest ) (item, group, blacklistGroup) );

                promises.push(promise);
            }
        }
    }
}
