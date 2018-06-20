"use strict";

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../ObserveModelMixin';
import DataCatalogItem from './DataCatalogItem';
import DataCatalogGroup from './DataCatalogGroup';

/**
 * Component that is either a {@link CatalogItem} or a {@link DataCatalogMember} and encapsulated this choosing logic.
 */
export default createReactClass({
    mixins: [ObserveModelMixin],

    displayName: 'DataCatalogMember',

    propTypes: {
        member: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        manageIsOpenLocally: PropTypes.bool,
        overrideState: PropTypes.string,
        onActionButtonClicked: PropTypes.func
    },

    render() {
        if (this.props.member.isGroup) {
            return (
                <DataCatalogGroup group={this.props.member} viewState={this.props.viewState}
                                  manageIsOpenLocally={this.props.manageIsOpenLocally}
                                  overrideState={this.props.overrideState}
                                  onActionButtonClicked={this.props.onActionButtonClicked} />
            );
        } else {
            return (
                <DataCatalogItem item={this.props.member} viewState={this.props.viewState}
                                 overrideState={this.props.overrideState}
                                 onActionButtonClicked={this.props.onActionButtonClicked} />
            );
        }
    }
});
