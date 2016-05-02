import arrayContains from '../Core/arrayContains';
import Branding from './Branding.jsx';
import FeatureInfoPanel from './FeatureInfo/FeatureInfoPanel.jsx';
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
        minimumLargeScreenWidth: React.PropTypes.number
    },

    mixins: [ObserveModelMixin],

    componentWillMount() {
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
            this.props.viewState.useSmallScreenInterface = this.shouldUseMobileInterface();
        };

        window.addEventListener('resize', this.resizeListener, false);
        this.resizeListener();
    },

    componentWillUnmount() {
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
     * Opens the explorer panel to show the welcome page.
     * @return {[type]} [description]
     */
    showWelcome() {
        this.props.viewState.openWelcome();
    },

    acceptDragDropFile() {
        this.props.viewState.openUserData();
        this.props.viewState.isDraggingDroppingFile = true;
    },

    shouldUseMobileInterface() {
        return document.body.clientWidth < (this.props.minimumLargeScreenWidth || 640);
    },

    render() {
        const terria = this.props.terria;
        const allBaseMaps = this.props.allBaseMaps;
        const terriaViewer = this.props.terriaViewer;

        return (
            <div>
                <div className='header'>
                    {this.props.viewState.useSmallScreenInterface && <MobileHeader terria={terria}
                                  viewState={this.props.viewState}
                    />}
                    <div className='workbench'>
                        <Branding onClick={this.showWelcome}
                                  terria={terria}
                        />
                        {!this.props.viewState.useSmallScreenInterface && <SidePanel terria={terria}
                                   viewState={this.props.viewState}
                        />}
                    </div>
                </div>
                <main>
                    {!this.props.viewState.useSmallScreenInterface && <ModalWindow terria={terria}
                                 viewState={this.props.viewState}
                    />}
                </main>
                <div className="map-nav">
                    <MapNavigation terria={terria}
                                   allBaseMaps={allBaseMaps}
                                   terriaViewer={terriaViewer}
                    />
                </div>
                <div className='notification'>
                    <Notification notification={this.props.viewState.getNextNotification()}
                                  onDismiss={this.closeNotification}
                    />
                    <MapInteractionWindow terria ={terria}/>
                </div>
                <ProgressBar terria={terria}/>
                <FeatureInfoPanel terria={terria}
                                  viewState={this.props.viewState}
                />
                <BottomDock terria={terria} viewState={this.props.viewState}/>
            </div>);
    }
});

module.exports = StandardUserInterface;
