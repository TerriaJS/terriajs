import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import arrayContains from '../../Core/arrayContains';
import Branding from './../SidePanel/Branding.jsx';
import DragDropFile from './../DragDropFile.jsx';
import DragDropNotification from './../DragDropNotification.jsx';
import ExplorerWindow from './../ExplorerWindow/ExplorerWindow.jsx';
import FeatureInfoPanel from './../FeatureInfo/FeatureInfoPanel.jsx';
import FeedbackForm from '../Feedback/FeedbackForm.jsx';
import MapColumn from './MapColumn.jsx';
import MapInteractionWindow from './../Notification/MapInteractionWindow.jsx';
import MapNavigation from './../Map/MapNavigation.jsx';
import MenuBar from './../Map/MenuBar.jsx';
import ExperimentalFeatures from './../Map/ExperimentalFeatures.jsx';
import MobileHeader from './../Mobile/MobileHeader.jsx';
import Notification from './../Notification/Notification.jsx';
import ObserveModelMixin from './../ObserveModelMixin';
import ProgressBar from '../Map/ProgressBar.jsx';
import SidePanel from './../SidePanel/SidePanel.jsx';
import processCustomElements from './processCustomElements';
import FullScreenButton from './../SidePanel/FullScreenButton.jsx';
import StoryPanel from './../StoryPanel.jsx';
import StoryBuilder from './../StoryBuilder.jsx';

import { Small, Medium } from '../Generic/Responsive';
import classNames from 'classnames';
import 'inobounce';

import Styles from './standard-user-interface.scss';

/** blah */
const StandardUserInterface = createReactClass({
    displayName: 'StandardUserInterface',
    mixins: [ObserveModelMixin],

    propTypes: {
        /**
         * Terria instance
         */
        terria: PropTypes.object.isRequired,
        /**
         * All the base maps.
         */
        allBaseMaps: PropTypes.array,
        viewState: PropTypes.object.isRequired,
        minimumLargeScreenWidth: PropTypes.number,
        minimumMediumScreenWidth: PropTypes.number,
        version: PropTypes.string,
        children: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.element),
            PropTypes.element
        ])
    },

    getDefaultProps() {
        return {
            minimumMediumScreenWidth: 768,
            minimumLargeScreenWidth: 992,
        };
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillMount() {
        const that = this;
        let shouldUseLargeInterface = true;
        this.dragOverListener = e => {
            if (!e.dataTransfer.types || !arrayContains(e.dataTransfer.types, 'Files')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            that.acceptDragDropFile();
        };

        this.resizeListener = () => {
            this.props.viewState.useSmallScreenInterface = this.shouldUseMobileInterface();
            shouldUseLargeInterface = this.shouldUseLargeInterface();
        };

        window.addEventListener('resize', this.resizeListener, false);

        this.resizeListener();

        this.props.viewState.storyShown = shouldUseLargeInterface ? this.props.terria.stories && this.props.terria.stories.length : false;
        this.props.viewState.storyEnabled = this.props.viewState.storyShown; 
    },

    componentDidMount() {
        this._wrapper.addEventListener('dragover', this.dragOverListener, false);
    },

    componentWillUnmount() {
        window.removeEventListener('resize', this.resizeListener, false);
        document.removeEventListener('dragover', this.dragOverListener, false);
    },

    acceptDragDropFile() {
        this.props.viewState.isDraggingDroppingFile = true;
        // if explorer window is already open, we open my data tab
        if(this.props.viewState.explorerPanelIsVisible) {
        this.props.viewState.openUserData();
        }
    },

    shouldUseMobileInterface() {
        return document.body.clientWidth < this.props.minimumLargeScreenWidth;
    },
    
    shouldUseLargeInterface(){
        return document.body.clientWidth > this.props.minimumMediumScreenWidth;
    },

    render() {
        const customElements = processCustomElements(
            this.props.viewState.useSmallScreenInterface,
            this.props.children
        );
        
        const terria = this.props.terria;
        const allBaseMaps = this.props.allBaseMaps;
        
        const showStoryBuilder = !(this.props.viewState.storyEnabled && this.props.viewState.storyShown) && !this.props.viewState.useSmallScreenInterface;

        return (
            <div className={Styles.storyWrapper}>
                <div className={classNames(Styles.uiRoot, {[Styles.withStoryBuilder]: showStoryBuilder})} ref={w => (this._wrapper = w)}>
                    <div className={Styles.ui}>
                        <div className={Styles.uiInner}>
                            <If condition={!this.props.viewState.hideMapUi()}>
                                <Small>
                                    <MobileHeader
                                        terria={terria}
                                        menuItems={customElements.menu}
                                        viewState={this.props.viewState}
                                        version={this.props.version}
                                        allBaseMaps={allBaseMaps}
                                    />
                                </Small>
                                <Medium>
                                    <div
                                        className={classNames(Styles.sidePanel,
                                            this.props.viewState.topElement === 'SidePanel' ? 'top-element': '',
                                            {[Styles.sidePanelHide]: this.props.viewState.isMapFullScreen}
                                        )}
                                        tabIndex={0}
                                        onClick={()=> {this.props.viewState.topElement = 'SidePanel';}}
                                    >
                                        <Branding
                                            terria={terria}
                                            version={this.props.version}
                                        />
                                        <SidePanel
                                            terria={terria}
                                            viewState={this.props.viewState}
                                        />
                                    </div>
                                </Medium>
                            </If>
                            <Medium>
                                <div
                                    className={classNames(
                                        Styles.showWorkbenchButton,
                                        {
                                            [Styles.showWorkbenchButtonisVisible]: this
                                                .props.viewState.isMapFullScreen,
                                            [Styles.showWorkbenchButtonisNotVisible]: !this
                                                .props.viewState.isMapFullScreen
                                        }
                                    )}
                                >
                                    <FullScreenButton
                                        terria={this.props.terria}
                                        viewState={this.props.viewState}
                                        minified={false}
                                        btnText='Show workbench'
                                        animationDuration={250}
                                    />
                                </div>
                            </Medium>

                            <section className={Styles.map}>
                                <ProgressBar terria={terria} />
                                <MapColumn
                                    terria={terria}
                                    viewState={this.props.viewState}
                                    customFeedbacks = {customElements.feedback}
                                />
                                <main>
                                    <ExplorerWindow
                                        terria={terria}
                                        viewState={this.props.viewState}
                                    />
                                    <If
                                        condition={
                                            this.props.terria.configParameters
                                                .experimentalFeatures &&
                                            !this.props.viewState.hideMapUi()
                                        }
                                    >
                                        <ExperimentalFeatures
                                            terria={terria}
                                            viewState={this.props.viewState}
                                            experimentalItems={
                                                customElements.experimentalMenu
                                            }
                                        />
                                    </If>
                                </main>
                            </section>
                        </div>
                    </div>

                    <If condition={!this.props.viewState.hideMapUi()}>
                        <div
                            className={classNames({
                                [Styles.explorerPanelIsVisible]: this.props
                                    .viewState.explorerPanelIsVisible
                            })}
                        >
                            <MenuBar
                                terria={terria}
                                viewState={this.props.viewState}
                                allBaseMaps={allBaseMaps}
                                menuItems={customElements.menu}
                            />
                            <MapNavigation terria={terria}
                                        viewState={this.props.viewState}
                                        navItems={customElements.nav}
                            />
                        </div>
                    </If>

                    <Notification viewState={this.props.viewState}/>
                    <MapInteractionWindow terria={terria} viewState={this.props.viewState}/>

                    <If condition={!customElements.feedback.length && this.props.terria.configParameters.feedbackUrl && !this.props.viewState.hideMapUi()}>
                        <aside className={Styles.feedback}>
                            <FeedbackForm viewState={this.props.viewState}/>
                        </aside>
                    </If>

                    <div className={classNames(Styles.featureInfo, this.props.viewState.topElement === 'FeatureInfo' ? 'top-element': '', {
                        [Styles.featureInfoFullScreen]: this.props.viewState.isMapFullScreen
                    })} tabIndex={0} onClick={()=> {this.props.viewState.topElement = 'FeatureInfo';}}>
                        <FeatureInfoPanel terria={terria}
                                    viewState={this.props.viewState}
                        />
                    </div>
                    <DragDropFile terria={this.props.terria}
                                viewState={this.props.viewState}
                    />
                    <DragDropNotification lastUploadedFiles={this.props.viewState.lastUploadedFiles} viewState={this.props.viewState}/>
                    {this.props.viewState.storyEnabled && <StoryPanel terria={terria} viewState={this.props.viewState}/>}
                </div>
                {showStoryBuilder && <StoryBuilder terria={terria} viewState={this.props.viewState}/>}
            </div>
        );
    }
});

module.exports = StandardUserInterface;
