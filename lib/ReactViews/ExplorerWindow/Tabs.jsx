import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import DataCatalogTab from './Tabs/DataCatalogTab.jsx';
import MyDataTab from './Tabs/MyDataTab/MyDataTab.jsx';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './tabs.scss';

const Tabs = createReactClass({
    displayName: 'Tabs',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        tabs: PropTypes.array
    },

    getTabs() {
        // This can be passed in as prop
        if (this.props.tabs) {
            return this.props.tabs;
        }

        const myDataTab = {
            name: 'My Data',
            title: 'my-data',
            category: 'my-data',
            panel: <MyDataTab terria={this.props.terria}
                                viewState={this.props.viewState}
            />
        };

        if (this.props.terria.configParameters.tabbedCatalog) {
            return [].concat(this.props.terria.catalog.group.items.filter(member => !member.isUserSupplied).map((member, i) => ({
                name: member.nameInCatalog,
                title: `data-catalog-${member.name}`,
                category: 'data-catalog',
                idInCategory: member.name,
                panel: <DataCatalogTab terria={this.props.terria}
                                       viewState={this.props.viewState}
                                       items={member.items || [member]}
                                       searchPlaceholder="Search whole catalogue"
                />
            })), [myDataTab])
        } else {
            return [
                {
                    name: 'Data Catalogue',
                    title: 'data-catalog',
                    category: 'data-catalog',
                    panel: <DataCatalogTab terria={this.props.terria}
                                        viewState={this.props.viewState}
                                        items={this.props.terria.catalog.group.items}
                    />
                },
                myDataTab
            ];
        }
    },

    activateTab(category, idInCategory) {
        this.props.viewState.activeTabCategory = category;
        if (this.props.terria.configParameters.tabbedCatalog) {
            this.props.viewState.activeTabIdInCategory = idInCategory;
            if (category === 'data-catalog') {
                const member = this.props.terria.catalog.group.items.find(m => m.name === idInCategory);
                // If member was found and member can be opened, open it (causes CkanCatalogGroups to fetch etc.)
                if (member && member.toggleOpen) {
                    member.isOpen = true;
                }
            }
        }
    },

    render() {
        const tabs = this.getTabs();
        const sameCategory = tabs.filter(t => t.category === this.props.viewState.activeTabCategory);
        const currentTab = sameCategory.find(t => t.idInCategory === this.props.viewState.activeTabIdInCategory) || sameCategory[0] || tabs[0];

        return (
            <div className={Styles.tabs}>
                <ul className={Styles.tabList} role="tablist">
                    <For each="item" index="i" of={tabs}>
                        <li key={i}
                            id={'tablist--' + item.title}
                            className={Styles.tabListItem}
                            role="tab"
                            aria-controls={'panel--' + item.title}
                            aria-selected={this.props.viewState.modalTabIndex === i}>
                            <button type='button'
                                    onClick={this.activateTab.bind(this, item.category, item.idInCategory)}
                                    className={classNames(Styles.btnTab, {[Styles.btnSelected]: this.props.viewState.modalTabIndex === i})}>
                                {item.name}
                            </button>
                        </li>
                    </For>
                </ul>

                <section
                    key={currentTab.title}
                    id={'panel--' + currentTab.title}
                    className={classNames(Styles.tabPanel, Styles.isActive)}
                    aria-labelledby={'tablist--' + currentTab.title}
                    role='tabpanel' tabIndex='0'>
                    <div className={Styles.panelContent}>
                        {currentTab.panel}
                    </div>
                </section>
            </div>
        );
    },
});

module.exports = Tabs;
