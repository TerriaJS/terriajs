import React from 'react';
import classNames from 'classnames';

import addUserCatalogMember from '../../../../Models/addUserCatalogMember';
import ArcGisCatalogGroup from '../../../../Models/ArcGisCatalogGroup';
import ArcGisMapServerCatalogItem from '../../../../Models/ArcGisMapServerCatalogItem';
import createCatalogItemFromFileOrUrl from '../../../../Models/createCatalogItemFromFileOrUrl';
import Dropdown from '../../../Generic/Dropdown';
import FileInput from './FileInput.jsx';
import getDataType from '../../../../Core/getDataType';
import ObserveModelMixin from '../../../ObserveModelMixin';
import OpenStreetMapCatalogItem from '../../../../Models/OpenStreetMapCatalogItem';
import TerriaError from '../../../../Core/TerriaError';
import WebFeatureServiceCatalogGroup from '../../../../Models/WebFeatureServiceCatalogGroup';
import WebMapServiceCatalogGroup from '../../../../Models/WebMapServiceCatalogGroup';
import WebMapTileServiceCatalogGroup from '../../../../Models/WebMapTileServiceCatalogGroup';
import handleFile from '../../../../Core/handleFile';

import Styles from './add-data.scss';

const wfsUrlRegex = /\bwfs\b/i;

// Local and remote data have different dataType options
const remoteDataType = getDataType().remoteDataType;
const localDataType = getDataType().localDataType;

/**
 * Add data panel in modal window -> My data tab
 */
const AddData = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    getInitialState() {
        return {
            localDataType: localDataType[0], // By default select the first item (auto)
            remoteDataType: remoteDataType[0],
            activeTab: 'local', // By default local data tab is active
            remoteUrl: undefined // By default there's no remote url
        };
    },

    selectLocalOption(option) {
        this.setState({
            localDataType: option
        });
    },

    selectRemoteOption(option) {
        this.setState({
            remoteDataType: option
        });
    },

    changeTab(active) {
        this.setState({
            activeTab: active
        });
    },

    handleUploadFile(e) {
        try {
            handleFile(e, this.props.terria, this.state.localDataType, ()=> {
                this.props.viewState.myDataIsUploadView = false;
            });
        } catch (err) {
            this.props.terria.error.raiseEvent(new TerriaError({
                sender: this,
                title: err.title,
                message: err.message
            }));
        }
    },

    handleUrl(e) {
        const url = this.state.remoteUrl;
        e.preventDefault();
        this.props.terria.analytics.logEvent('addDataUrl', url);
        const that = this;
        let promise;
        if (that.state.remoteDataType.value === 'auto') {
            const wmsThenWfs = [loadWms, loadWfs];
            const wfsThenWms = [loadWfs, loadWms];
            const others = [loadWmts, loadMapServer, loadMapServerLayer, loadFile];

            let loadFunctions;

            // Does this look like a WFS URL?  If so, try that first (before WMS).
            // This accounts for the fact that a single URL often works as both WMS and WFS.
            if (wfsUrlRegex.test(url)) {
                loadFunctions = wfsThenWms.concat(others);
            } else {
                loadFunctions = wmsThenWfs.concat(others);
            }

            promise = loadAuto(that, loadFunctions, 0);
        } else if (that.state.remoteDataType.value === 'wms-getCapabilities') {
            promise = loadWms(that);
        } else if (that.state.remoteDataType.value === 'wfs-getCapabilities') {
            promise = loadWfs(that);
        } else if (that.state.remoteDataType.value === 'esri-group') {
            promise = loadMapServer(that).otherwise(() => {
                return loadMapServerLayer(that);
            });
        } else if (that.state.remoteDataType.value === 'open-street-map') {
            promise = loadOpenStreetMapServer(that);
        } else {
            promise = loadFile(that);
        }

        addUserCatalogMember(this.props.terria, promise).then(() => {
            this.props.viewState.myDataIsUploadView = false;
        });
    },

    onRemoteUrlChange(event) {
        this.setState({
            remoteUrl: event.target.value
        });
    },

    onFinishDroppingFile() {
        this.props.viewState.isDraggingDroppingFile = false;
    },

    renderTabs() {
        const tabs = [{
            id: 'local',
            caption: 'ADD LOCAL DATA'
        }, {
            id: 'web',
            caption: 'ADD WEB DATA'
        }];

        return (
            <ul className={Styles.tabList}>
                <For each="tab" of={tabs}>
                    <li className={Styles.tabListItem} key={tab.id}>
                        <button type='button' onClick={this.changeTab.bind(null, tab.id)}
                                className={classNames(Styles.tabListBtn, {[Styles.isActive]: this.state.activeTab === tab.id})}>
                            {tab.caption}
                        </button>
                    </li>
                </For>
            </ul>
        );
    },

    renderPanels() {
        const dropdownTheme = {
            dropdown: Styles.dropdown,
            list: Styles.dropdownList,
            isOpen: Styles.dropdownListIsOpen
        };

        return (
            <div className={Styles.tabPanels}>
                <If condition={this.state.activeTab === 'local'}>
                    <section className={Styles.tabPanel}>
                        <label className={Styles.label}><strong>Step 1:</strong> Select type of file to add: </label>
                        <Dropdown options={localDataType} selected={this.state.localDataType}
                                  selectOption={this.selectLocalOption} matchWidth={true} theme={dropdownTheme}/>
                        <label className={Styles.label}><strong>Step 2:</strong> Select a local data file to add:
                        </label>
                        <FileInput accept=".csv,.kml" onChange={this.handleUploadFile}/>
                    </section>
                </If>
                <If condition={this.state.activeTab === 'web'}>
                    <section className={Styles.tabPanel}>
                        <label className={Styles.label}><strong>Step 1:</strong> Select type of file to add: </label>
                        <Dropdown options={remoteDataType} selected={this.state.remoteDataType}
                                  selectOption={this.selectRemoteOption} matchWidth={true} theme={dropdownTheme}/>
                        <label className={Styles.label}><strong>Step 2:</strong> Enter the URL of the data file or web
                            service:
                        </label>
                        <form className={Styles.urlInput}>
                            <input value={this.state.remoteUrl} onChange={this.onRemoteUrlChange}
                                   className={Styles.urlInputTextBox}
                                   type='text'
                                   placeholder='e.g. http://data.gov.au/geoserver/wms'/>
                            <button type='button' onClick={this.handleUrl} className={Styles.urlInputBtn}>
                                Add
                            </button>
                        </form>
                    </section>
                </If>
            </div>
        );
    },

    render() {
        return (
            <div className={Styles.inner}>
                {this.renderTabs()}
                {this.renderPanels()}
            </div>
        );
    }
});

/**
 * Loads data, automatically determining the format.
 *
 * @returns {Promise}
 */
function loadAuto(viewModel, loadFunctions, index) {
    const loadFunction = loadFunctions[index];
    return loadFunction(viewModel).otherwise(function () {
        return loadAuto(viewModel, loadFunctions, index + 1);
    });
}

/**
 * Loads a Web Map Service catalog group.
 *
 * @returns {Promise}
 */
function loadWms(viewModel) {
    const wms = new WebMapServiceCatalogGroup(viewModel.props.terria);
    wms.name = viewModel.state.remoteUrl;
    wms.url = viewModel.state.remoteUrl;

    return wms.load().then(function () {
        return wms;
    });
}

/**
 * Loads a Web Feature Service catalog group.
 *
 * @returns {Promise}
 */
function loadWfs(viewModel) {
    const wfs = new WebFeatureServiceCatalogGroup(viewModel.props.terria);
    wfs.name = viewModel.state.remoteUrl;
    wfs.url = viewModel.state.remoteUrl;

    return wfs.load().then(function () {
        return wfs;
    });
}

/**
 * Loads a Web Map Tile Service catalog group.
 *
 * @returns {Promise}
 */
function loadWmts(viewModel) {
    const wmts = new WebMapTileServiceCatalogGroup(viewModel.props.terria);
    wmts.name = viewModel.state.remoteUrl;
    wmts.url = viewModel.state.remoteUrl;

    return wmts.load().then(function () {
        return wmts;
    });
}

/**
 * Loads an ArcGis catalog group.
 *
 * @returns {Promise.<T>}
 */
function loadMapServer(viewModel) {
    const mapServer = new ArcGisCatalogGroup(viewModel.props.terria);
    mapServer.name = viewModel.state.remoteUrl;
    mapServer.url = viewModel.state.remoteUrl;

    return mapServer.load().then(function () {
        return mapServer;
    });
}

/**
 * Loads a single ArcGis layer.
 *
 * @returns {Promise.<T>}
 */
function loadMapServerLayer(viewModel) {
    const mapServer = new ArcGisMapServerCatalogItem(viewModel.props.terria);
    mapServer.name = viewModel.state.remoteUrl;
    mapServer.url = viewModel.state.remoteUrl;
    return mapServer.load().then(function () {
        return mapServer;
    });
}

/**
 * Loads an item from a open street map server.
 *
 * @param viewModel
 * @returns {Promise.<T>}
 */
function loadOpenStreetMapServer(viewModel) {
    const openStreetMapServer = new OpenStreetMapCatalogItem(viewModel.props.terria);
    openStreetMapServer.name = viewModel.state.remoteUrl;
    openStreetMapServer.url = viewModel.state.remoteUrl;

    return openStreetMapServer.load().then(function () {
        return openStreetMapServer;
    });
}

/**
 * Loads a catalog item from a file.
 */
function loadFile(viewModel) {
    return createCatalogItemFromFileOrUrl(viewModel.props.terria, viewModel.state.remoteUrl, viewModel.state.remoteDataType.value, true);
}

module.exports = AddData;
