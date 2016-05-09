
import NowViewingContainer from './../NowViewing/NowViewingContainer.jsx';
import ObserveModelMixin from './../ObserveModelMixin';
import React from 'react';
import SidebarSearch from './../SidebarSearch.jsx';
import SearchBox from './../Search/SearchBox.jsx';

import Styles from './work_bench.scss';

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

    search(newText) {
        this.props.viewState.searchState.searchLocations(newText);
    },

    onSearchBoxFocus() {
        this.props.viewState.searchState.hideLocationSearch = false;
    },

    onEnterPressedInSearch() {
        this.props.viewState.searchState.goToFirstResult();
    },

    render() {
        return (
            <div className={Styles.workBench}>
                <div className={Styles.header}>
                    <SearchBox onSearchTextChanged={this.search}
                               onFocus={this.onSearchBoxFocus}
                               onEnterPressed={this.onEnterPressedInSearch}
                               initialText={this.props.viewState.searchState.locationSearchText}/>
                    <div className={Styles.addData}>
                        <button type='button' onClick={this.onAddDataClicked} className={Styles.button}>Add Data</button>
                    </div>
                </div>
                <div className={Styles.body}>
                    <Choose>
                        <When
                            condition={this.props.viewState.searchState.locationSearchText.length && !this.props.viewState.searchState.hideLocationSearch}>
                            <SidebarSearch viewState={this.props.viewState}/>
                        </When>
                        <When
                            condition={this.props.terria.nowViewing.items && this.props.terria.nowViewing.items.length > 0}>
                            <div className="now-viewing">
                                <ul className="now-viewing__header">
                                    <li><label className='label'>Data Sets</label></li>
                                    <li><label
                                        className='label--badge label'>{this.props.terria.nowViewing.items.length}</label>
                                    </li>
                                    <li className="now-viewing__remove">
                                        <button type='button' onClick={this.removeAll}
                                                className='btn right btn-remove'>Remove All
                                        </button>
                                        <i className="icon icon-remove"/>
                                    </li>
                                </ul>
                                <NowViewingContainer viewState={this.props.viewState}
                                                     terria={this.props.terria}
                                />
                            </div>
                        </When>
                        <Otherwise>
                            <div>
                                <h3>Your workbench is empty</h3>
                                <p><strong>Click 'Add Data' above to:</strong></p>
                                <ul>
                                    <li>Browse the Data Catalogue</li>
                                    <li>Load your own data onto the map</li>
                                </ul>
                                <p><strong>TIP:</strong> <em>All of your active data sets will be listed
                                    here</em></p>
                            </div>
                        </Otherwise>
                    </Choose>
                </div>
            </div>
        );
    },
});

module.exports = SidePanel;
