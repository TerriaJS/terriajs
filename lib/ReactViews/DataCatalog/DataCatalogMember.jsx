"use strict";

import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';
import DataCatalogItem from './DataCatalogItem.jsx';
import DataCatalogGroup from './DataCatalogGroup.jsx';

/**
 * Component that is either a {@link CatalogItem} or a {@link DataCatalogMember} and encapsulated this choosing logic.
 */
export default React.createClass({
    mixins: [ObserveModelMixin],
    
    displayName: 'DataCatalogMember',

    propTypes: {
        member: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
        manageIsOpenLocally: React.PropTypes.bool
    },

    render() {
        if (this.props.member.isGroup) {
            return (
                <DataCatalogGroup group={this.props.member} viewState={this.props.viewState}
                                  manageIsOpenLocally={this.props.manageIsOpenLocally} />
            );
        } else {
            return (
                <DataCatalogItem item={this.props.member} viewState={this.props.viewState} />
            );
        }
    }
});
