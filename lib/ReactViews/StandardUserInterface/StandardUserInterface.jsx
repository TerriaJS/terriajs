import arrayContains from '../../Core/arrayContains';
import Branding from './../SidePanel/Branding.jsx';
import FeatureInfoPanel from './../FeatureInfo/FeatureInfoPanel.jsx';
import MapNavigation from './../Map/MapNavigation.jsx';
import MobileHeader from './../Mobile/MobileHeader.jsx';
import ModalWindow from './../ModalWindow.jsx';
import Notification from './../Notification/Notification.jsx';
import MapInteractionWindow from './../Notification/MapInteractionWindow.jsx';
import ObserveModelMixin from './../ObserveModelMixin';
import React from 'react';
import WorkBench from './../SidePanel/WorkBench.jsx';
import ProgressBar from './../ProgressBar.jsx';
import BottomDock from './../BottomDock/BottomDock.jsx';
import TerriaViewerWrapper from './../TerriaViewerWrapper.jsx';
import DisclaimerHandler from '../../ReactViewModels/DisclaimerHandler';
import Styles from './standard-user-interface.scss';
import FeedbackButton from '../Feedback/FeedbackButton.jsx';
import FeedbackForm from '../Feedback/FeedbackForm.jsx';

const StandardUserInterface = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        allBaseMaps: React.PropTypes.array,
        viewState: React.PropTypes.object,
        minimumLargeScreenWidth: React.PropTypes.number,
        version: React.PropTypes.string
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

        document.addEventListener('dragover', this.dragOverListener, false);

        this.resizeListener = () => {
            this.props.viewState.useSmallScreenInterface = this.shouldUseMobileInterface();
        };

        window.addEventListener('resize', this.resizeListener, false);

        this.resizeListener();
        this.disclaimerHandler = new DisclaimerHandler(this.props.terria, this.props.viewState);
    },

    componentDidMount() {
        this.escKeyListener = (e)=>{
            let keycode;
            if (e === null) { // ie
                keycode = event.keyCode;
            } else { // mozilla
                keycode = e.which;
            }
            if(keycode === 27) {
                // close modal
                this.props.viewState.toggleModal(false);
                this.props.viewState.dispose();
            }
        };
        window.addEventListener('keydown', this.escKeyListener, true);
    },

    componentWillUnmount() {
        window.removeEventListener('resize', this.resizeListener, false);
        document.removeEventListener('dragover', this.dragOverListener, false);
        window.removeEventListener('keydown', this.escKeyListener, false);
        this.disclaimerHandler.dispose();
    },

    acceptDragDropFile() {
        this.props.viewState.openUserData();
        this.props.viewState.isDraggingDroppingFile = true;
    },

    shouldUseMobileInterface() {
        return document.body.clientWidth < (this.props.minimumLargeScreenWidth || 768);
    },

    render() {
        const terria = this.props.terria;
        const allBaseMaps = this.props.allBaseMaps;

        return (
            <div>
                <div className={Styles.ui}>
                    <div className={Styles.uiInner}>
                        <If condition={!this.props.viewState.isMapFullScreen && !this.props.viewState.hideMapUi()}>
                            <Choose>
                                <When condition={this.props.viewState.useSmallScreenInterface}>
                                    <MobileHeader terria={terria} viewState={this.props.viewState}
                                                  version={this.props.version}/>
                                </When>
                                <Otherwise>
                                    <div className={Styles.sidePanel}>
                                        <Branding terria={terria} version={this.props.version}/>
                                        <WorkBench terria={terria} viewState={this.props.viewState}/>
                                    </div>
                                </Otherwise>
                            </Choose>
                        </If>

                        <section className={Styles.map}>
                            <ProgressBar terria={terria}/>
                            <TerriaViewerWrapper terria={this.props.terria} viewState={this.props.viewState}/>
                            <If condition={!this.props.viewState.hideMapUi()}>
                                <BottomDock terria={terria} viewState={this.props.viewState}/>
                            </If>
                            <If condition={!this.props.viewState.useSmallScreenInterface}>
                                <main>
                                    <ModalWindow terria={terria} viewState={this.props.viewState}/>
                                </main>
                            </If>
                        </section>
                    </div>
                </div>

                <If condition={!this.props.viewState.hideMapUi()}>
                    <MapNavigation terria={terria}
                                   viewState={this.props.viewState}
                                   allBaseMaps={allBaseMaps}
                    />
                </If>

                <Notification viewState={this.props.viewState}/>
                <MapInteractionWindow terria={terria}/>

                <div className='feedback'>
                    <If condition={!this.props.viewState.useSmallScreenInterface}>
                        <FeedbackButton viewState={this.props.viewState}/>
                    </If>
                    <FeedbackForm viewState={this.props.viewState}/>
                </div>

                <FeatureInfoPanel terria={terria}
                                  viewState={this.props.viewState}
                />
            </div>
        );
    }
});

module.exports = StandardUserInterface;
