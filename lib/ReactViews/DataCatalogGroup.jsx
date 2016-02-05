'use strict';

import DataCatalogMember from './DataCatalogMember.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import Loader from './Loader.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import classNames from 'classnames';

const DataCatalogGroup = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        group: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
        /** Overrides whether to get the open state of the group from the group model or manage it internally */
        manageIsOpenLocally: React.PropTypes.bool
    },

    getDefaultProps() {
        return {
            manageIsOpenLocally: false
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
        } else {
            return this.props.group.isOpen;
        }
    },

    toggleOpen() {
        if (this.props.manageIsOpenLocally) {
            this.toggleStateIsOpen();
        } else {
            this.props.group.toggleOpen();
        }
    },

    render() {
        const group = this.props.group;

        return (
            <li>
                <button className={classNames('btn', 'btn-catalogue', {'is-open' : this.isOpen()})}
                        onClick={this.toggleOpen}>
                    {group.name}
                    <i className={classNames('icon', {'icon-caret-down': this.isOpen(), 'icon-caret-right': !this.isOpen()})}/>
                </button>
                {this.isOpen() && (
                    <ul className="data-catalog-group list-reset">
                        {this.renderGroup(group)}
                    </ul>
                )}
            </li>
        );
    },

    renderGroup(group) {
        const children =
                group.items.map(item => <DataCatalogMember key={item.uniqueId} member={item}
                                                           viewState={this.props.viewState}
                                                           overrideOpen={this.props.manageIsOpenLocally}/>);

        if (group.isLoading) {
            children.push(<Loader key="loader" />);
        }

        return children;
    }
});

module.exports = DataCatalogGroup;
