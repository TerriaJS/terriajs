import React from 'react';
import classNames from 'classnames';

import DataCatalogMember from './DataCatalogMember.jsx';
import Loader from '../Loader.jsx';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './data-catalog-group.scss';

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

    render() {
        const group = this.props.group;

        return (
            <li className={Styles.root}>
                <button type='button'
                        className={classNames(
                            Styles.btnCatalog,
                            {[Styles.btnCatalogTopLevel]: this.isTopLevel()},
                            {[Styles.btnIsOpen]: this.isOpen()}
                        )}
                        onClick={this.clickGroup}>
                    <If condition={!this.isTopLevel()}>
                        <i className={classNames(
                            Styles.iconFolder,
                            {[Styles.iconFolderOpen]: this.isOpen()},
                            {[Styles.iconFolderClosed]: !this.isOpen()})}
                        />
                    </If>
                    {group.name}
                    <i className={classNames(
                        Styles.caret,
                        {[Styles.caretOpen]: this.isOpen()},
                        {[Styles.caretClosed]: !this.isOpen()},
                        {[Styles.caretLowerLevel]: !this.isTopLevel()}
                    )}/>
                </button>
                <If condition={this.isOpen()}>
                    <ul className={Styles.catalogGroup}>
                        <Choose>
                            <When condition={group.isLoading}>
                                <li key="loader"><Loader /></li>
                            </When>
                            <When condition={group.items.length === 0}>
                                <li className={classNames(Styles.label, Styles.labelNoResults)} key="empty">This group is empty</li>
                            </When>
                        </Choose>
                        <For each="item" of={group.items}>
                            <DataCatalogMember
                                key={item.uniqueId}
                                member={item}
                                viewState={this.props.viewState}
                                userData={this.props.userData}
                                overrideOpen={this.props.manageIsOpenLocally}
                            />
                        </For>
                    </ul>
                </If>
            </li>
        );
    }
});

module.exports = DataCatalogGroup;
