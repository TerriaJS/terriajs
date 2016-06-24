'use strict';

import DataCatalogMember from './DataCatalogMember.jsx';
import Loader from '../Loader.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import classNames from 'classnames';
import Icon from "../Icon.jsx";


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

    render() {
        const group = this.props.group;
        let contents = null;
        if (this.isOpen()) {
            contents = (
                <ul className="data--catalog-group">
                    {group.isLoading && <li key="loader"><Loader /></li>}
                    {!group.isLoading && group.items.length === 0 && <li className="label no-results" key="empty"> This group is empty </li>}
                    {this.renderGroup(group)}
                </ul>
            );
        }
        return (
            <li>
                <button type='button' className={classNames('btn', 'btn-transparent', 'btn--catalog')} onClick={this.clickGroup}>

                    {this.isOpen() ? <Icon glyph={Icon.GLYPHS.folder}/> : <Icon glyph={Icon.GLYPHS.folderOpen}/>}
                    {group.name}
                    {this.isOpen() ? <Icon glyph={Icon.GLYPHS.opened}/> : <Icon glyph={Icon.GLYPHS.closed}/>}
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

        return children;
    }
});

module.exports = DataCatalogGroup;
