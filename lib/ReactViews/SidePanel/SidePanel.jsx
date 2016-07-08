import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import SearchBox from '../Search/SearchBox.jsx';
import SidebarSearch from '../Search/SidebarSearch.jsx';
import Styles from './side-panel.scss';
import Workbench from '../Workbench/Workbench.jsx';
import Icon from "../Icon.jsx";

const SidePanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    componentDidMount() {
        this.subscribeToProps();
    },

    componentDidUpdate() {
        this.subscribeToProps();
    },

    componentWillUnmount() {
        this.unsubscribeFromProps();
    },

    subscribeToProps() {
        this.unsubscribeFromProps();

        // Close the search results when the Now Viewing changes (so that it's visible).
        this._nowViewingChangeSubscription = knockout.getObservable(this.props.terria.nowViewing, 'items').subscribe(() => {
            this.props.viewState.searchState.showLocationSearch = false;
        });
    },

    unsubscribeFromProps() {
        if (this._nowViewingChangeSubscription) {
            this._nowViewingChangeSubscription.dispose();
            this._nowViewingChangeSubscription = undefined;
        }
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
                        <button type='button' onClick={this.onAddDataClicked} className={Styles.button}>
                            <Icon glyph={Icon.GLYPHS.add}/>Add data
                        </button>
                    </div>
                </div>
                <div className={Styles.body}>
                    <Choose>
                        <When condition={searchState.locationSearchText.length > 0 && searchState.showLocationSearch}>
                            <SidebarSearch
                                terria={this.props.terria}
                                viewState={this.props.viewState}
                                isWaitingForSearchToStart={searchState.isWaitingToStartLocationSearch} />
                        </When>
                        <When
                            condition={this.props.terria.nowViewing.items && this.props.terria.nowViewing.items.length > 0}>
                            <Workbench viewState={this.props.viewState} terria={this.props.terria} />
                        </When>
                        <Otherwise>
                            <div className={Styles.workbenchEmpty}>
                                <div>Your workbench is empty</div>
                                <p><strong>Click 'Add Data' above to:</strong></p>
                                <ul>
                                    <li>Browse the Data Catalogue</li>
                                    <li>Load your own data onto the map</li>
                                </ul>
                                <p><Icon glyph={Icon.GLYPHS.bulb}/><strong>TIP:</strong> <em>All your active data sets will be listed
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
