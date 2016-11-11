import React from 'react';

import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './mappable-preview.scss';
import parseCustomMarkdownToReact from '../Custom/parseCustomMarkdownToReact';

/**
 * A "preview" for CatalogGroup.
 */
const GroupPreview = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object.isRequired,
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
    },

    backToMap() {
        this.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        return (
            <div>
                <h3>{this.props.previewed.name}</h3>
                <div className={Styles.previewedInfo}>
                    <div className={Styles.url}>
                        <Choose>
                            <When
                                condition={this.props.previewed.description && this.props.previewed.description.length > 0}>
                                <div>
                                    <h4 className={Styles.h4}>Description</h4>
                                    {parseCustomMarkdownToReact(this.props.previewed.description, {catalogItem: this.props.previewed})}
                                </div>
                            </When>
                        </Choose>
                    </div>
                </div>
            </div>
        );
    }
});

export default GroupPreview;

