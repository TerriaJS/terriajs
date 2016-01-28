'use strict';

import React from 'react';
import SearchBox from './SearchBox.jsx';
import NowViewingContainer from './NowViewingContainer.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import PureRenderMixin from 'react-addons-pure-render-mixin';

// the sidepanel
// TO DO:  rename this into workbench
// This get re-rendered when nowViewingItem changes
const SidePanel = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        onActivateAddData: React.PropTypes.func,
        onActivateCatalogItemInfo: React.PropTypes.func,
        onSearchCatalog: React.PropTypes.func
    },

    removeAll() {
        this.props.terria.nowViewing.removeAll();
    },

    renderContent(nowViewing) {
        if (nowViewing && nowViewing.length > 0) {
            return (
                <div className="now-viewing hide-on-search">
                  <ul className="now-viewing__header list-reset clearfix">
                    <li className='col col-6'>
                      <label className='label-inline'>Data Sets</label>
                      <label className='label-badge label-inline'>{nowViewing.length}</label>
                    </li>
                    <li className='col col-6'>
                      <button onClick={this.removeAll} className='btn right'>Remove All</button>
                    </li>
                  </ul>
                  <NowViewingContainer onActivateCatalogItemInfo={this.props.onActivateCatalogItemInfo} nowViewingItems={nowViewing} />
                </div>);
        }
    },

    render() {
        return (
            <div className='workbench__inner'>
              <div className='workbench__header workbench-add'>
                {this.props.onActivateAddData && <button className='btn now-viewing__add' onClick={this.props.onActivateAddData}>Add Data</button>}
              </div>
              <SearchBox terria={this.props.terria} dataSearch={false} onSearchCatalog={this.props.onSearchCatalog} />
              {this.renderContent(this.props.terria.nowViewing.items)}
            </div>);
    }
});

module.exports = SidePanel;
