import React from 'react';
import ko from 'terriajs-cesium/Source/ThirdParty/knockout';

import ObserveModelMixin from '../ObserveModelMixin';
import ModalPopup from './ModalPopup';
import Tabs from './Tabs.jsx';

const ExplorerWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            isMounted: false
        };
    },

    onClose() {
        this.props.viewState.explorerPanelIsVisible = false;
        this.props.viewState.switchMobileView('nowViewing');
    },

    onStartAnimatingIn() {
        this.props.viewState.explorerPanelAnimating = true;
    },

    onDoneAnimatingIn() {
        this.props.viewState.explorerPanelAnimating = false;
    },

    componentWillMount() {
        this._pickedFeaturesSubscription = ko.pureComputed(this.isVisible, this).subscribe(this.onVisibilityChange);
    },

    componentWillUnmount() {
        this._pickedFeaturesSubscription.dispose();
    },

    isVisible() {
        return !this.props.viewState.useSmallScreenInterface && !this.props.viewState.hideMapUi() && this.props.viewState.explorerPanelIsVisible;
    },

    render() {
        return (
            <ModalPopup isVisible={this.isVisible()}
                        onClose={this.onClose}
                        onStartAnimatingIn={this.onStartAnimatingIn}
                        onDoneAnimatingIn={this.onDoneAnimatingIn}>
                <Tabs terria={this.props.terria} viewState={this.props.viewState}/>
            </ModalPopup>
        );
    }
});

module.exports = ExplorerWindow;
