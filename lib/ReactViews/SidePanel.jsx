'use strict';

import Chart from './Chart.jsx';
import React from 'react';
import SidebarSearch from './SidebarSearch.jsx';
import NowViewingContainer from './NowViewingContainer.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import GazetteerSearchProviderViewModel from '../ViewModels/GazetteerSearchProviderViewModel.js';
import BingMapsSearchProviderViewModel from '../ViewModels/BingMapsSearchProviderViewModel.js';

// the sidepanel
// TO DO:  rename this into workbench
// This get re-rendered when nowViewingItem changes
const SidePanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    removeAll() {
        this.props.terria.nowViewing.removeAll();
    },

    onAddDataClicked() {
        this.props.viewState.openAddData();
    },

    render() {
        const terria = this.props.terria;

        return (
            <div className='workbench__inner'>
                <div className='workbench__header workbench-add'>
                    <button onClick={this.onAddDataClicked} className='now-viewing__add btn'>Add Data</button>
                </div>
                <SidebarSearch terria={this.props.terria}
                               viewState={this.props.viewState}
                               searches={[
                            new BingMapsSearchProviderViewModel({terria}),
                            new GazetteerSearchProviderViewModel({terria})
                        ]}/>
                <div className="now-viewing hide-on-search">
                    {this.renderNowViewing(this.props.terria.nowViewing.items)}
                    {this.renderCharts(this.props.terria.nowViewing.items)}
                </div>
            </div>
        );
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
                    <NowViewingContainer viewState={this.props.viewState}
                                         nowViewingItems={nowViewing}/>
                </div>
            );
        }
    },

    renderCharts(nowViewing) {
        if (nowViewing && nowViewing.length > 0) {
            return (
                <div>
                    <ul className="now-viewing__header list-reset clearfix">
                        <li className='col col-6'><label className='label-inline'> Charts </label><label
                            className='label-badge label-inline'> 1 </label></li>
                    </ul>
                    <div className='nowViewing-chart'>
                        <Chart />
                    </div>
                </div>);
        }
        return null;
    }
});

module.exports = SidePanel;
