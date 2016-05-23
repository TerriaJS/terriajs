'use strict';

import DataCatalogMember from './DataCatalogMember.jsx';
import Loader from '../Loader.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import classNames from 'classnames';

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

    render() {
        const group = this.props.group;
        let contents = null;
        if (this.isOpen()) {
            contents = (
                <ul className="data--catalog-group">
                    {this.renderGroup(group)}
                </ul>
            );
        }
        return (
            <li>
                <button type='button' className={classNames('btn', 'btn-transparent', 'btn--catalog', {'is-open': this.isOpen()})} onClick={this.toggleOpen}>
                    <i className={`btn--group-indicator ${this.isOpen() ? 'btn--folder-open' : 'btn--folder'}`}/>
                    {group.name}
                </button>
                {contents}
            </li>
        );
    },

    renderGroup(group) {
        const children = group.items.map(item => (
            <DataCatalogMember
                key={item.uniqueId}
                member={item}
                viewState={this.props.viewState}
                userData={this.props.userData}
                overrideOpen={this.props.manageIsOpenLocally}
            />
        ));

        if (group.isLoading) {
            children.push(<li key="loader"><Loader /></li>);
        } else if (group.items.length === 0) {
            children.push(<li className="label no-results" key="empty"> This group is empty </li>);
        }

        return children;
    }
});

module.exports = DataCatalogGroup;
