import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import DataCatalogTab from './Tabs/DataCatalogTab.jsx';
import MyDataTab from './Tabs/MyDataTab/MyDataTab.jsx';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './tabs.scss';

const Tabs = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        tabs: PropTypes.array
    },

    getInitialState() {
        // This can be passed in as prop
        return {
            tabs: this.props.tabs || [
                {
                    name: 'Data Catalogue',
                    title: 'data-catalog',
                    panel: <DataCatalogTab terria={this.props.terria}
                                           viewState={this.props.viewState}
                    />
                },
                {
                    name: 'My Data',
                    title: 'my-data',
                    panel: <MyDataTab terria={this.props.terria}
                                      viewState={this.props.viewState}
                    />
                }
            ]
        };
    },

    activateTab(i) {
        this.props.viewState.modalTabIndex = i;
    },

    render() {
        const item = this.state.tabs[this.props.viewState.modalTabIndex];

        return (
            <div className={Styles.tabs}>
                <ul className={Styles.tabList} role="tablist">
                    <For each="item" index="i" of={this.state.tabs}>
                        <li key={i}
                            id={'tablist--' + item.title}
                            className={Styles.tabListItem}
                            role="tab"
                            aria-controls={'panel--' + item.title}
                            aria-selected={this.props.viewState.modalTabIndex === i}>
                            <button type='button'
                                    onClick={this.activateTab.bind(this, i)}
                                    className={classNames(Styles.btnTab, {[Styles.btnSelected]: this.props.viewState.modalTabIndex === i})}>
                                {item.name}
                            </button>
                        </li>
                    </For>
                </ul>

                <section
                    key={item.title}
                    id={'panel--' + item.title}
                    className={classNames(Styles.tabPanel, Styles.isActive)}
                    aria-labelledby={'tablist--' + item.title}
                    role='tabpanel' tabIndex='0'>
                    <div className={Styles.panelContent}>
                        {item.panel}
                    </div>
                </section>
            </div>
        );
    }
});

module.exports = Tabs;
