import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import 'mutationobserver-shim';

import TerriaViewerWrapper from '../Map/TerriaViewerWrapper';
import LocationBar from '../Map/Legend/LocationBar';
import DistanceLegend from '../Map/Legend/DistanceLegend';
import FeedbackButton from '../Feedback/FeedbackButton';
import ObserveModelMixin from '../ObserveModelMixin';
import BottomDock from '../BottomDock/BottomDock';
import FeatureDetection from 'terriajs-cesium/Source/Core/FeatureDetection';
import classNames from "classnames";

import Styles from './map-column.scss';

const isIE = FeatureDetection.isInternetExplorer();

/**
 * Right-hand column that contains the map, controls that sit over the map and sometimes the bottom dock containing
 * the timeline and charts.
 *
 * Note that because IE9-11 is terrible the pure-CSS layout that is used in nice browsers doesn't work, so for IE only
 * we use a (usually polyfilled) MutationObserver to watch the bottom dock and resize when it changes.
 */
const MapColumn = createReactClass({
    displayName: 'MapColumn',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
    },

    getInitialState() {
        return {};
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillMount() {
        if (isIE) {
            this.observer = new MutationObserver(this.resizeMapCell);
            window.addEventListener('resize', this.resizeMapCell, false);
        }
    },

    addBottomDock(bottomDock) {
        if (isIE) {
            this.observer.observe(bottomDock, {
                childList: true,
                subtree: true
            });
        }
    },

    newMapCell(mapCell) {
        if (isIE) {
            this.mapCell = mapCell;

            this.resizeMapCell();
        }
    },

    resizeMapCell() {
        if (this.mapCell) {
            this.setState({
                height: this.mapCell.offsetHeight
            });
        }
    },

    componentWillUnmount() {
        if (isIE) {
            window.removeEventListener('resize', this.resizeMapCell, false);
            this.observer.disconnect();
        }
    },

    render() {
        return (
            <div className={Styles.mapInner}>
                <div className={Styles.mapRow}>
                    <div className={classNames(Styles.mapCell, Styles.mapCellMap)} ref={this.newMapCell}>
                        <div className={Styles.mapWrapper}
                             style={{height: this.state.height || (isIE ? '100vh' : '100%')}}>
                            {/* <TerriaViewerWrapper terria={this.props.terria}
                                                 viewState={this.props.viewState}/> */}
                        </div>
                        <If condition={!this.props.viewState.hideMapUi()}>
                            <div className={Styles.locationDistance}>
                                {/* <LocationBar terria={this.props.terria}
                                             mouseCoords={this.props.viewState.mouseCoords}/>
                                <DistanceLegend terria={this.props.terria}/> */}
                            </div>
                        </If>
                        <If condition={!this.props.viewState.useSmallScreenInterface && this.props.terria.configParameters.feedbackUrl && !this.props.viewState.hideMapUi()}>
                            <div className={Styles.feedbackButtonWrapper}>
                                <FeedbackButton viewState={this.props.viewState}/>
                            </div>
                        </If>
                    </div>
                    <If condition={this.props.terria.configParameters.printDisclaimer}>
                        <div className={classNames(Styles.mapCell, 'print')}>
                            <a className={Styles.printDisclaimer}
                               href={this.props.terria.configParameters.printDisclaimer.url}>{this.props.terria.configParameters.printDisclaimer.text}
                            </a>
                        </div>
                    </If>
                </div>
                <If condition={!this.props.viewState.hideMapUi()}>
                    <div className={Styles.mapRow}>
                        <div className={Styles.mapCell}>
                            {/* <BottomDock terria={this.props.terria} viewState={this.props.viewState}
                                        domElementRef={this.addBottomDock}/> */}
                        </div>
                    </div>
                </If>
            </div>
        );
    },
});

export default MapColumn;
