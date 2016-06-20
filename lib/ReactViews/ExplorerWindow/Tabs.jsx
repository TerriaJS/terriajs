import React from 'react';
import classNames from 'classnames';

import DataCatalogTab from './Tabs/DataCatalogTab.jsx';
import MyDataTab from './Tabs/MyDataTab/MyDataTab.jsx';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './tabs.scss';

const Tabs = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
        tabs: React.PropTypes.array
    },

    getInitialState() {
        // This can be passed in as prop
        return {
            tabs: this.props.tabs || [
                {
                    title: 'data-catalog',
                    panel: <DataCatalogTab terria={this.props.terria}
                                           viewState={this.props.viewState}
                    />
                },
                {
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
                                {item.title.replace(/-/g, ' ')}
                            </button>
                        </li>
                    </For>
                </ul>

                <For each="item" index="i" of={this.state.tabs}>
                    <section
                        key={item.title}
                        aria-hidden={this.props.viewState.modalTabIndex !== i}
                        id={'panel--' + item.title}
                        className={classNames(Styles.tabPanel, {[Styles.isActive]: this.props.viewState.modalTabIndex === i})}
                        aria-labelledby={'tablist--' + item.title}
                        role='tabpanel' tabIndex='0'>
                        <div className={Styles.panelContent}>
                            {item.panel}
                        </div>
                    </section>
                </For>
            </div>
        );
    }
});

module.exports = Tabs;
