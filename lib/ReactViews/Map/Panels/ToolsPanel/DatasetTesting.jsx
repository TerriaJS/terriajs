'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import Styles from './tools-panel.scss';

const DatasetTesting = createReactClass({
    displayName: 'DatasetTesting',
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
      return {
        cacheFilter: 'all-opened',
        minZoomLevel: '5',
        maxZoomLevel: '5',
        useWMSTileCache: true,
        showMoreImageryLayerInfo: false,
        useProxyCache: false
      }
    },

    cacheTiles(){
      var requests = [];
      var promises = [];
      this.props.getAllRequests(['wms', 'esri-mapServer'], this.state .cacheFilter, requests, this.props.terria.catalog.group, promises);

      var that = this;
      when.all(promises, function() {
          console.log('Requesting tiles in zoom range ' + that.state.minZoomLevel + '-' + that.state.maxZoomLevel + ' from ' + requests.length + ' data sources.');
          that.props.requestTiles(that, requests, Number(that.state.minZoomLevel), Number(that.state.maxZoomLevel));
      });
    },

    render() {
        return (
          <div>
            <form>
              <h3>Dataset DatasetTesting</h3>
                <label>
                  <div>Select the dataset to test</div>
                  <select className={Styles.select} value={this.state.cacheFilter} onChange={(e)=>this.setState({cacheFilter: e.target.value})}>
                    <option value="all-opened">All Opened</option>
                    <option value="all-enabled">All Enabled</option>
                    <option value="all">All</option>
                  </select>
                </label>

                <label>
                  <div className={Styles.zoomRange}>Measure speed of tiles in zoom range:</div>
                  <input className={Styles.numberInput} type="number" value={this.state.minZoomLevel} onChange={(e)=>this.setState({minZoomLevel: e.target.value})}/>
                  <span> to </span>
                  <input className={Styles.numberInput} type="number" value={this.state.maxZoomLevel} onChange={(e)=>this.setState({maxZoomLevel: e.target.value})}/>
                </label>
                  <label className={Styles.checkbox}>
                      <input type="checkbox" value={this.state.useWMSTileCache} onChange={(e)=>this.setState({useWMSTileCache: e.target.value})}/>
                      Use WMS tile cache
                  </label>
                  <label className={Styles.checkbox}>
                      <input type="checkbox" value={this.state.useProxyCache} onChange={(e)=>this.setState({useProxyCache: e.target.value})}/>
                      Show more imagery layer info
                  </label>
                  <label className={Styles.checkbox}>
                      <input type="checkbox" value={this.state.moreImageryInfo} onChange={(e)=>this.setState({moreImageryInfo: e.target.value})}/>
                        Use proxy cache
                  </label>
                <button className={Styles.submit} type="button" value="Request Tiles" onClick={this.cacheTiles}> Request Tiles</button>
            </form>
            </div>
        );
    },
});

export default DatasetTesting;
