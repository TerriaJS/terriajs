import React from 'react';

import DataCatalogMember from './DataCatalogMember';
import CatalogGroup from './CatalogGroup';
import ObserveModelMixin from '../ObserveModelMixin';
import addedByUser from '../../Core/addedByUser';

const DataCatalogGroup = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        group: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
        /** Overrides whether to get the open state of the group from the group model or manage it internally */
        manageIsOpenLocally: React.PropTypes.bool,
        userData: React.PropTypes.bool
    },

    getDefaultProps() {
        return {
            manageIsOpenLocally: false,
            userData: false
        };
    },

    getInitialState() {
        return {
            /** Only used if manageIsOpenLocally === true */
            isOpen: false
        };
    },

    toggleStateIsOpen() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    isOpen() {
        if (this.props.manageIsOpenLocally) {
            return this.state.isOpen;
        }
        return this.props.group.isOpen;
    },

    toggleOpen() {
        if (this.props.manageIsOpenLocally) {
            this.toggleStateIsOpen();
        }
        this.props.group.toggleOpen();
    },

    clickGroup() {
        this.toggleOpen();
        this.props.viewState.viewCatalogItem(this.props.group);
    },

    isTopLevel() {
        const parent = this.props.group.parent;
        return !parent || !parent.parent;
    },

    isSelected() {
        return addedByUser(this.props.group) ?
            this.props.viewState.userDataPreviewedItem === this.props.group :
            this.props.viewState.previewedItem === this.props.group;
    },

    render() {
        const group = this.props.group;
        return (
            <CatalogGroup
                text={group.name}
                topLevel={this.isTopLevel()}
                open={this.isOpen()}
                loading={group.isLoading}
                emptyMessage="This group is empty"
                onClick={this.clickGroup}
                selected ={this.isSelected()}>
                <For each="item" of={group.items}>
                    <DataCatalogMember
                        key={item.uniqueId}
                        member={item}
                        viewState={this.props.viewState}
                        userData={this.props.userData}
                        overrideOpen={this.props.manageIsOpenLocally}
                    />
                </For>
            </CatalogGroup>
        );
    }
});

module.exports = DataCatalogGroup;
