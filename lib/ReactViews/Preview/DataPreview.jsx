'use strict';

import GroupPreview from './GroupPreview';
import InvokeFunction from '../Analytics/InvokeFunction';
import MappablePreview from './MappablePreview';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import Styles from './data-preview.scss';

/**
 * Data preview section, for the preview map see DataPreviewMap
 */
const DataPreview = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object,
        previewed: React.PropTypes.object
    },

    backToMap() {
        this.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        const previewed = this.props.previewed;
        return (
            <div className={Styles.preview}>
                <Choose>
                    <When condition={previewed && previewed.isMappable}>
                        <div className={Styles.previewInner}>
                            <MappablePreview previewed={previewed} terria={this.props.terria}
                                             viewState={this.props.viewState}/>
                        </div>
                    </When>
                    <When condition={previewed && typeof previewed.invoke !== 'undefined'}>
                        <div className={Styles.previewInner}>
                            <InvokeFunction previewed={previewed}
                                            terria={this.props.terria}
                                            viewState={this.props.viewState}
                            />
                        </div>
                    </When>
                    <When condition={previewed && previewed.isGroup}>
                        <div className={Styles.previewInner}>
                            <GroupPreview previewed={previewed} terria={this.props.terria}
                                          viewState={this.props.viewState}/>
                        </div>
                    </When>
                    <Otherwise>
                        <div className={Styles.placeholder}>
                            <p>Select a dataset to see a preview</p>
                            <p>- OR -</p>
                            <button className={Styles.btnBackToMap} onClick={this.backToMap}>Go to the map</button>
                        </div>
                    </Otherwise>
                </Choose>
            </div>
        );
    }
});

module.exports = DataPreview;
