"use strict";

import createReactClass from 'create-react-class';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React from 'react';
import GroupMixin from '../../ModelMixins/GroupMixin';
import DataCatalogGroup from './DataCatalogGroup';
import DataCatalogItem from './DataCatalogItem';

/**
 * Component that is either a {@link CatalogItem} or a {@link DataCatalogMember} and encapsulated this choosing logic.
 */
export default observer(createReactClass({
    displayName: 'DataCatalogMember',

    propTypes: {
        member: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        manageIsOpenLocally: PropTypes.bool,
        overrideState: PropTypes.string,
        onActionButtonClicked: PropTypes.func
    },

    render() {
        if (GroupMixin.isMixedInto(this.props.member)) {
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
}));
