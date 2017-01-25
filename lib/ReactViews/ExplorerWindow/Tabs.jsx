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
        let tabs = [];
        tabs.push({
                    name: this.props.terria.catalog.name,
                    title: 'data-catalog',
                    id: 'data-catalog',
                    panel: <DataCatalogTab terria={this.props.terria}
                                           viewState={this.props.viewState}
                                           content={this.props.terria.catalog}
                    />
                 });
        tabs.push({
                    name: 'My Data',
                    title: 'my-data',
                    id: 'my-data',
                    panel: <MyDataTab terria={this.props.terria}
                                      viewState={this.props.viewState}
                    />
                  });
        for (let i=0; i<this.props.terria.additionalCatalogs.length; i++) {
            const content = this.props.terria.additionalCatalogs[i];
            tabs.push({
                        name: content.name,
                        title: 'data-catalog',
                        id: content.id,
                        panel: <DataCatalogTab terria={this.props.terria}
                                               viewState={this.props.viewState}
                                               content={content}
                        />
                     });
        }
        return {tabs: tabs,
                activeTabIndex: 0};
    },

    activateTab(i) {
        this.setState({
            activeTabIndex: i
        });
        this.props.viewState.activeTab = this.state.tabs[i].id;
    },

    render() {
        var that = this;
        const item = this.state.tabs.filter(function(tab) { return tab.id === that.props.viewState.activeTab; })[0];
        const index = this.state.tabs.indexOf(item);

        return (
            <div className={Styles.tabs}>
                <ul className={Styles.tabList} role="tablist">
                    <For each="item" index="i" of={this.state.tabs}>
                        <li key={i}
                            id={'tablist--' + item.title}
                            className={Styles.tabListItem}
                            role="tab"
                            aria-controls={'panel--' + item.title}
                            aria-selected={index === i}>
                            <button type='button'
                                    onClick={this.activateTab.bind(this, i)}
                                    className={classNames(Styles.btnTab, {[Styles.btnSelected]: index === i})}>
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
