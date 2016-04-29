import arrayContains from '../Core/arrayContains';
import Branding from './Branding.jsx';
import FeatureInfoPanel from './FeatureInfo/FeatureInfoPanel.jsx';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import MapNavigation from './Map/MapNavigation.jsx';
import MobileHeader from './Mobile/MobileHeader.jsx';
import ModalWindow from './ModalWindow.jsx';
import Notification from './Notification/Notification.jsx';
import MapInteractionWindow from './Notification/MapInteractionWindow.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import SidePanel from './SidePanel.jsx';
import ProgressBar from './ProgressBar.jsx';
import BottomDock from './BottomDock/BottomDock.jsx';

const StandardUserInterface = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        allBaseMaps: React.PropTypes.array,
        terriaViewer: React.PropTypes.object,
        viewState: React.PropTypes.object,
    },

    mixins: [ObserveModelMixin],

    getInitialState() {
        return {
            // True if the feature info panel is visible.
            featureInfoPanelIsVisible: false,

            // True if the feature info panel is collapsed.
            featureInfoPanelIsCollapsed: false,

            useMobileInterface: this.shouldUseMobileInterface()
        };
    },

    componentWillMount() {
        this.pickedFeaturesSubscription = knockout.getObservable(this.props.terria, 'pickedFeatures').subscribe(() => {
            this.setState({
                featureInfoPanelIsVisible: true,
                featureInfoPanelIsCollapsed: false
            });
        }, this);

        const that = this;

        // TO DO(chloe): change window into a container
        this.dragOverListener = e => {
            if (!e.dataTransfer.types || !arrayContains(e.dataTransfer.types, 'Files')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            that.acceptDragDropFile();
        };

        window.addEventListener('dragover', this.dragOverListener, false);

        this.resizeListener = () => {
            const useMobileInterface = this.shouldUseMobileInterface();
            if (useMobileInterface !== this.state.useMobileInterface) {
                this.setState({
                    useMobileInterface: useMobileInterface
                });
            }
        };

        window.addEventListener('resize', this.resizeListener, false);
    },

    componentWillUnmount() {
        this.pickedFeaturesSubscription.dispose();
        window.removeEventListener('resize', this.resizeListener, false);
        window.removeEventListener('dragover', this.dragOverListener, false);
    },

    /**
     * Closes the current notification.
     */
    closeNotification() {
        this.props.viewState.notifications.splice(0, 1);
    },

    /**
     * Show feature info panel.
     */
    closeFeatureInfoPanel() {
        this.setState({
            featureInfoPanelIsVisible: false
        });
    },

    /**
     * Opens the explorer panel to show the welcome page.
     * @return {[type]} [description]
     */
    showWelcome() {
        this.props.viewState.openWelcome();
    },

    /**
     * Changes the open/collapse state of the feature info panel.
     */
    changeFeatureInfoPanelIsCollapsed() {
        this.setState({
            featureInfoPanelIsCollapsed: !this.state.featureInfoPanelIsCollapsed
        });
    },

    acceptDragDropFile() {
        this.props.viewState.openUserData();
        this.props.viewState.isDraggingDroppingFile = true;
    },

    shouldUseMobileInterface() {
        // 640 must match the value of the $sm SASS variable.
        return document.body.clientWidth < 640;
    },

    render() {
        const terria = this.props.terria;
        const allBaseMaps = this.props.allBaseMaps;
        const terriaViewer = this.props.terriaViewer;

        return (
            <div>
                <div className='header'>
                    {this.state.useMobileInterface && <MobileHeader terria={terria}
                                  viewState={this.props.viewState}
                    />}
                    <div className='workbench'>
                        <Branding onClick={this.showWelcome}
                                  terria={terria}
                        />
                        {!this.state.useMobileInterface && <SidePanel terria={terria}
                                   viewState={this.props.viewState}
                        />}
                    </div>
                </div>
                <main>
                    {!this.state.useMobileInterface && <ModalWindow terria={terria}
                                 viewState={this.props.viewState}
                    />}
                </main>
                <div id="map-nav">
                    <MapNavigation terria={terria}
                                   allBaseMaps={allBaseMaps}
                                   terriaViewer={terriaViewer}
                    />
                </div>
                <div id='notification'>
                    <Notification notification={this.props.viewState.getNextNotification()}
                                  onDismiss={this.closeNotification}
                    />
                    <MapInteractionWindow terria ={terria}/>
                </div>
                <ProgressBar terria={terria}/>
                <FeatureInfoPanel terria={terria}
                                  viewState={this.props.viewState}
                                  isVisible={this.state.featureInfoPanelIsVisible}
                                  onClose={this.closeFeatureInfoPanel}
                                  isCollapsed={this.state.featureInfoPanelIsCollapsed}
                                  onChangeFeatureInfoPanelIsCollapsed={this.changeFeatureInfoPanelIsCollapsed}
                />
                <BottomDock terria={terria} viewState={this.props.viewState}/>
            </div>);
    }
});

module.exports = StandardUserInterface;
