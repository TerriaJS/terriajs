import React from 'react';
import arrayContains from '../../Core/arrayContains';
import Branding from './../SidePanel/Branding.jsx';
import DisclaimerHandler from '../../ReactViewModels/DisclaimerHandler';
import DragDropFile from './../DragDropFile.jsx';
import ExplorerWindow from './../ExplorerWindow/ExplorerWindow.jsx';
import FeatureInfoPanel from './../FeatureInfo/FeatureInfoPanel.jsx';
import FeedbackForm from '../Feedback/FeedbackForm.jsx';
import MapColumn from './MapColumn.jsx';
import MapInteractionWindow from './../Notification/MapInteractionWindow.jsx';
import MapNavigation from './../Map/MapNavigation.jsx';
import MobileHeader from './../Mobile/MobileHeader.jsx';
import Notification from './../Notification/Notification.jsx';
import ObserveModelMixin from './../ObserveModelMixin';
import ProgressBar from '../Map/ProgressBar.jsx';
import SidePanel from './../SidePanel/SidePanel.jsx';
import SettingPanel from '../Map/Panels/SettingPanel.jsx';
import SharePanel from '../Map/Panels/SharePanel/SharePanel.jsx';

import Styles from './standard-user-interface.scss';

const StandardUserInterface = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        allBaseMaps: React.PropTypes.array,
        viewState: React.PropTypes.object.isRequired,
        minimumLargeScreenWidth: React.PropTypes.number,
        version: React.PropTypes.string
    },

    getDefaultProps() {
        return {
            minimumLargeScreenWidth: 768
        };
    },

    componentWillMount() {
        const that = this;
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
        };

        window.addEventListener('resize', this.resizeListener, false);

        this.resizeListener();
        this.disclaimerHandler = new DisclaimerHandler(this.props.terria, this.props.viewState);
    },

    componentDidMount() {
        this._wrapper.addEventListener('dragover', this.dragOverListener, false);
    },

    componentWillUnmount() {
        window.removeEventListener('resize', this.resizeListener, false);
        document.removeEventListener('dragover', this.dragOverListener, false);
        this.disclaimerHandler.dispose();
    },

    acceptDragDropFile() {
        this.props.viewState.openUserData();
        this.props.viewState.isDraggingDroppingFile = true;
    },

    shouldUseMobileInterface() {
        return document.body.clientWidth < this.props.minimumLargeScreenWidth;
    },

    render() {
        const children = React.Children.toArray(this.props.children);
        const customElements = children.map(child =>
            React.cloneElement(child, {
                smallScreen: !!this.props.viewState.useSmallScreenInterface
            })
        ).reduce((soFar, child) => {
            if (child.type.location === 'menu') {
                soFar.menuItems.push(child);
            }

            return soFar;
        }, {
            menuItems: [
                <SettingPanel terria={this.props.terria} allBaseMaps={this.props.allBaseMaps}
                              viewState={this.props.viewState} key="settings"/>,
                <SharePanel terria={this.props.terria} viewState={this.props.viewState} key="share"/>
            ]
        });

        const terria = this.props.terria;
        const allBaseMaps = this.props.allBaseMaps;
        return (
            <div ref={(w) => this._wrapper = w}>
                <div className={Styles.ui}>
                    <div className={Styles.uiInner}>
                        <If condition={!this.props.viewState.isMapFullScreen && !this.props.viewState.hideMapUi()}>
                            <Choose>
                                <When condition={this.props.viewState.useSmallScreenInterface}>
                                    <MobileHeader terria={terria}
                                                  menuItems={customElements.menuItems}
                                                  viewState={this.props.viewState}
                                                  version={this.props.version}
                                    />
                                </When>
                                <Otherwise>
                                    <div className={Styles.sidePanel}>
                                        <Branding terria={terria} version={this.props.version}/>
                                        <SidePanel terria={terria} viewState={this.props.viewState}/>
                                    </div>
                                </Otherwise>
                            </Choose>
                        </If>

                        <section className={Styles.map}>
                            <ProgressBar terria={terria}/>
                            <MapColumn terria={terria} viewState={this.props.viewState} />
                            <If condition={!this.props.viewState.useSmallScreenInterface}>
                                <main>
                                    <ExplorerWindow terria={terria} viewState={this.props.viewState}/>
                                </main>
                            </If>
                        </section>
                    </div>
                </div>

                <If condition={!this.props.viewState.hideMapUi()}>
                    <MapNavigation terria={terria}
                                   viewState={this.props.viewState}
                                   allBaseMaps={allBaseMaps}
                                   menuItems={customElements.menuItems}
                    />
                </If>

                <Notification viewState={this.props.viewState}/>
                <MapInteractionWindow terria={terria}/>

                <If condition={this.props.terria.configParameters.feedbackUrl && !this.props.viewState.hideMapUi()}>
                    <aside className={Styles.feedback}>
                        <FeedbackForm viewState={this.props.viewState}/>
                    </aside>
                </If>

                <FeatureInfoPanel terria={terria}
                                  viewState={this.props.viewState}
                />
                <DragDropFile terria={this.props.terria}
                              viewState={this.props.viewState}
                />
            </div>
        );
    }
});

module.exports = StandardUserInterface;
