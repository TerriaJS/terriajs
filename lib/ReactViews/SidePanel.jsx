'use strict';

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
                <div className='workbench__add-data'>
                    <button onClick={this.onAddDataClicked} className='btn'>Add Data</button>
                </div>
                <SidebarSearch terria={this.props.terria}
                               viewState={this.props.viewState}
                               searches={[
                            new BingMapsSearchProviderViewModel({terria}),
                            new GazetteerSearchProviderViewModel({terria})
                        ]}/>
                <div className="now-viewing hide-on-search">
                    {this.renderNowViewing(this.props.terria.nowViewing.items)}
                </div>
            </div>
        );
    },

    renderNowViewing(nowViewing) {
        if (nowViewing && nowViewing.length > 0) {
            return (
                <div>
                    <ul className="now-viewing__header">
                        <li>
                            <label className='label'>Data Sets</label>
                            <label className='label--badge label'>{nowViewing.length}</label>
                        </li>
                        <li>
                            <button onClick={this.removeAll} className='btn right btn-remove'>Remove All</button>
                        </li>
                    </ul>
                    <NowViewingContainer viewState={this.props.viewState}
                                         nowViewingItems={nowViewing}/>
                </div>
            );
        }
    },
});

module.exports = SidePanel;
