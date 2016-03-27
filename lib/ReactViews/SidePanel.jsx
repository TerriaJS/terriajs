'use strict';

import BingMapsSearchProviderViewModel from '../ViewModels/BingMapsSearchProviderViewModel.js';
import GazetteerSearchProviderViewModel from '../ViewModels/GazetteerSearchProviderViewModel.js';
import NowViewingContainer from './NowViewing/NowViewingContainer.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import SidebarSearch from './SidebarSearch.jsx';
import SearchBox from './Search/SearchBox.jsx';

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

    getInitialState() {
        return {
            searchText: ''
        }
    },

    search(newText) {
        this.setState({
            searchText: newText
        });
    },

    render() {
        const terria = this.props.terria;
        return (
            <div className={'workbench__inner'}>
                <div className='workbench__header'>
                    <SearchBox onSearchTextChanged={this.search}/>
                    <div className='workbench__add-data'>
                        <button onClick={this.onAddDataClicked} className='btn'>Add Data</button>
                    </div>
                </div>
                <div className='workbench__body'>
                    {this.state.searchText.length > 0 && <SidebarSearch terria={this.props.terria}
                                                                         viewState={this.props.viewState}
                                                                         searches={[
                                                                             new BingMapsSearchProviderViewModel({terria}),
                                                                             new GazetteerSearchProviderViewModel({terria})
                                                                         ]}
                                                                        searchText={this.state.searchText}/>}
                    {this.state.searchText.length === 0 && this.renderNowViewing()}
                </div>
            </div>
        );
    },

    renderNowViewing() {
        if (this.props.terria.nowViewing.items && this.props.terria.nowViewing.items.length > 0) {
            return (
                <div className="now-viewing">
                    <ul className="now-viewing__header">
                        <li><label className='label'>Data Sets</label></li>
                        <li><label className='label--badge label'>{this.props.terria.nowViewing.items.length}</label></li>
                        <li><button onClick={this.removeAll} className='btn right btn-remove'>Remove All</button></li>
                    </ul>
                    <NowViewingContainer viewState={this.props.viewState}
                                         terria={this.props.terria}
                    />
                </div>
            );
        }
    },
});

module.exports = SidePanel;
