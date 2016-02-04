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
        viewState: React.PropTypes.object.isRequired
    },

    toggleOpen() {
        this.props.group.isOpen = !this.props.group.isOpen;
    },

    render() {
        const group = this.props.group;

        return (
            <li>
                <button className={classNames('btn', 'btn-catalogue', {'is-open' : group.isOpen})}
                        onClick={this.toggleOpen}>
                    {group.name}
                    <i className={classNames('icon', {'icon-caret-down': group.isOpen}, {'icon-caret-right': !group.isOpen})} />
                </button>
                {group.isOpen && (
                    <ul className="data-catalog-group list-reset">
                        {this.renderGroup(group)}
                    </ul>
                )}
            </li>
        );
    },

    renderGroup(group) {
        if (!group.isLoading) {
            return group.items.map(item => <DataCatalogMember key={item.uniqueId} member={item} viewState={this.props.viewState} />)
        } else {
            return <Loader/>;
        }
    }
});

module.exports = DataCatalogGroup;
