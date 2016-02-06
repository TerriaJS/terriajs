'use strict';

import React from 'react';
import SearchBox from './SearchBox.jsx';
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
                  <ul className="now-viewing__header">
                      <li><label className='label'>Data Sets</label></li>
                      <li><label className='label--badge label'>{nowViewing.length}</label></li>
                      <li><button onClick={this.removeAll} className='btn right btn-remove'>Remove All</button></li>
                  </ul>
                  <NowViewingContainer onActivateCatalogItemInfo={this.props.onActivateCatalogItemInfo} nowViewingItems={nowViewing} />
              </div>);
        }
    },

    render() {
        return (
            <div className='workbench__inner'>
              <div className='workbench__add-data'>
                {this.props.onActivateAddData && <button onClick={this.props.onActivateAddData} className='btn'>Add Data</button>}
              </div>
              <SearchBox terria={this.props.terria} searchText={this.props.mapSearchText} onSearchTextChanged={this.props.onMapSearchTextChanged} dataSearch={false} onSearchCatalog={this.props.onSearchCatalog} />
              <div className="now-viewing hide-on-search">
                {this.renderNowViewing(this.props.terria.nowViewing.items)}
              </div>
            </div>);
    }
});

module.exports = SidePanel;
