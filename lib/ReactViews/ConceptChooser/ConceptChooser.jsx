import React from 'react';
import classNames from 'classnames';

import defined from 'terriajs-cesium/Source/Core/defined';
import ko from 'terriajs-cesium/Source/ThirdParty/knockout';

import ObserveModelMixin from '../ObserveModelMixin';
import SearchBox from '../Search/SearchBox';

import Styles from './concept-chooser.scss';

const SLIDE_DURATION = 300;

const ConceptChooser = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            isMounted: false,
            searchText: ''
        };
    },

    close() {
        this.props.viewState.conceptChooserIsVisible = false;
        // this.props.viewState.switchMobileView('nowViewing');
    },

    componentWillMount() {
        this.props.viewState.conceptChooserAnimating = true;

        this._pickedFeaturesSubscription = ko.pureComputed(this.isVisible, this).subscribe(this.onVisibilityChange);
        this.onVisibilityChange(this.isVisible());
    },

    componentDidMount() {
        this.escKeyListener = e => {
            if (e.keyCode === 27) {
                this.close();
            }
        };
        window.addEventListener('keydown', this.escKeyListener, true);
    },

    onVisibilityChange(isVisible) {
        if (isVisible) {
            this.slideIn();
        } else {
            this.slideOut();
        }
    },

    slideIn() {
        this.props.viewState.conceptChooserAnimating = true;

        this.setState({
            visible: true
        });
        setTimeout(() => {
            this.setState({
                slidIn: true
            });

            setTimeout(() => this.props.viewState.conceptChooserAnimating = false, SLIDE_DURATION);
        });
    },

    slideOut() {
        this.setState({
            slidIn: false
        });
        setTimeout(() => {
            this.setState({
                visible: false
            });
        }, SLIDE_DURATION);
    },

    componentWillUnmount() {
        window.removeEventListener('keydown', this.escKeyListener, false);

        this._pickedFeaturesSubscription.dispose();
    },

    isVisible() {
        return !this.props.viewState.useSmallScreenInterface && !this.props.viewState.hideMapUi() && this.props.viewState.conceptChooserIsVisible;
    },

    changeSearchText(newText) {
        this.setState({searchText: newText});
    },

    search() {
        alert('Not implemented yet.');
    },

    render() {
        const terria = this.props.terria;
        const visible = this.state.visible;
        const items = []; //= (
            // isSearching ?
            //     searchState.catalogSearchProvider.searchResults.map(result => result.catalogItem) :
            //     terria.catalog.group.items
        // ).filter(defined);


        return visible ? (
            <div className={Styles.modalWrapper}
                 id="concept-chooser-wrapper"
                 aria-hidden={!visible}>
                <div onClick={this.close}
                     id="modal-overlay"
                     className={Styles.modalOverlay}
                     tabIndex="-1"/>
                <div id="concept-chooser-panel"
                     className={classNames(Styles.conceptChooser, Styles.modalContent, {[Styles.isMounted]: this.state.slidIn})}
                     aria-labelledby="modalTitle"
                     aria-describedby="modalDescription"
                     role="dialog">
                    <button type='button'
                            onClick={this.close}
                            className={Styles.btnCloseModal}
                            title="Close data panel"
                            data-target="close-modal">
                        Done
                    </button>

                    <div className={Styles.heading}>A nice heading</div>
                    <SearchBox searchText={this.state.searchText}
                       onSearchTextChanged={this.changeSearchText}
                       onDoSearch={this.search}/>

                    <ul className={Styles.concept}>
                        <For each="item" of={items}>
                            <DataCatalogMember viewState={this.props.viewState}
                                               member={item}
                                               key={item.uniqueId}
                            />
                        </For>
                    </ul>
                </div>
            </div>
        ) : null;
    }
});

module.exports = ConceptChooser;
