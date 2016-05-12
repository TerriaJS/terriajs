import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SidebarSearch from '../SidebarSearch.jsx';
import SearchBox from '../Search/SearchBox.jsx';
import NowViewing from '../NowViewing/NowViewing.jsx';

import Styles from './work_bench.scss';

const SidePanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    onAddDataClicked() {
        this.props.viewState.openAddData();
    },

    changeSearchText(newText) {
        this.props.viewState.searchState.locationSearchText = newText;
    },

    search() {
        this.props.viewState.searchState.searchLocations();
    },

    startLocationSearch() {
        this.props.viewState.searchState.showLocationSearch = true;
    },

    render() {
        const searchState = this.props.viewState.searchState;

        return (
            <div className={Styles.workBench}>
                <div className={Styles.header}>
                    <SearchBox onSearchTextChanged={this.changeSearchText}
                               onDoSearch={this.search}
                               onFocus={this.startLocationSearch}
                               searchText={searchState.locationSearchText} />
                    <div className={Styles.addData}>
                        <button type='button' onClick={this.onAddDataClicked} className={Styles.button}>Add Data</button>
                    </div>
                </div>
                <div className={Styles.body}>
                    <Choose>
                        <When
                            condition={searchState.locationSearchText.length > 0 && searchState.showLocationSearch}>
                            <SidebarSearch viewState={this.props.viewState} isWaitingForSearchToStart={searchState.isWaitingToStartLocationSearch} />
                        </When>
                        <When
                            condition={this.props.terria.nowViewing.items && this.props.terria.nowViewing.items.length > 0}>
                            <NowViewing viewState={this.props.viewState} terria={this.props.terria} />
                        </When>
                        <Otherwise>
                            <div className='workbench--empty'>
                                <div>Your workbench is empty</div>
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
