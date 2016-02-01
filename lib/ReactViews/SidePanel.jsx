'use strict';

import Chart from './Chart.jsx';
import React from 'react';
import SearchBox from './Search.jsx';
import NowViewingContainer from './NowViewingContainer.jsx';
import ObserveModelMixin from './ObserveModelMixin';

// the sidepanel
// TO DO:  rename this into workbench
// This get re-rendered when nowViewingItem changes
const SidePanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        mapSearchText: React.PropTypes.string,
        onMapSearchTextChanged: React.PropTypes.func,
        onActivateAddData: React.PropTypes.func,
        onActivateCatalogItemInfo: React.PropTypes.func,
        onSearchCatalog: React.PropTypes.func
    },

    removeAll() {
        this.props.terria.nowViewing.removeAll();
    },

    renderNowViewing(nowViewing) {
        if (nowViewing && nowViewing.length > 0) {
            return (
              <div>
                  <ul className="now-viewing__header list-reset clearfix">
                      <li className='col col-6'>
                        <label className='label-inline'>Data Sets</label>
                        <label className='label-badge label-inline'>{nowViewing.length}</label>
                      </li>
                      <li className='col col-6'>
                        <button onClick={this.removeAll} className='btn right btn-remove'>Remove All</button>
                      </li>
                  </ul>
                  <NowViewingContainer onActivateCatalogItemInfo={this.props.onActivateCatalogItemInfo} nowViewingItems={nowViewing} />
              </div>);
        }
    },

    renderCharts(nowViewing) {
        if (nowViewing && nowViewing.length > 0) {
            return (
              <div>
                  <ul className="now-viewing__header list-reset clearfix">
                      <li className='col col-6'><label className='label-inline'> Charts </label><label className='label-badge label-inline'> 1 </label></li>
                  </ul>
                  <div className='nowViewing-chart'>
                      <Chart />
                  </div>
              </div>);
        }
        return null;
    },

    render() {
        return (
            <div className='workbench__inner'>
              <div className='workbench__header workbench-add'>
                {this.props.onActivateAddData && <button onClick={this.props.onActivateAddData} className='now-viewing__add btn'>Add Data</button>}
              </div>
              <SearchBox terria={this.props.terria} searchText={this.props.mapSearchText} onSearchTextChanged={this.props.onMapSearchTextChanged} dataSearch={false} onSearchCatalog={this.props.onSearchCatalog} />
              <div className="now-viewing hide-on-search">
                {this.renderNowViewing(this.props.terria.nowViewing.items)}
                {this.renderCharts(this.props.terria.nowViewing.items)}
              </div>
            </div>);
    }
});

module.exports = SidePanel;
