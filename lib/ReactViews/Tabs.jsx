'use strict';

import DataCatalogTab from './DataCatalogTab.jsx';
import MyDataTab from './MyDataTab.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import GettingStartedTab from './GettingStartedTab.jsx';
import classNames from 'classnames';

function getName(str1, str2) {
    return str1.concat(str2);
}

const Tabs = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    getInitialState() {
        // This can be passed in as prop
        return {
            tabs: this.props.tabs || [
                {
                    title: 'getting-started',
                    panel: <GettingStartedTab terria={this.props.terria}
                                       viewState={this.props.viewState}
                    />
                },
                {
                    title: 'data-catalogue',
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

    renderTabs() {
        return (this.state.tabs.map((item, i) =>
            <li key={i}
                className={getName('tablist--', item.title)}
                id={getName('tablist--', item.title)}
                role="tab"
                aria-controls={getName('panel--', item.title)}
                aria-selected={this.props.viewState.modalTabIndex === i}>
                <button type='button' onClick={this.activateTab.bind(this, i)}
                        className='btn btn--tab'>{item.title.replace(/-/g, ' ')}</button>
            </li>
        ));
    },

    renderPanels() {
        return this.state.tabs.map((item, i) => (
            <section
                key={item.title}
                aria-hidden={this.props.viewState.modalTabIndex !== i}
                id={getName('panel--', item.title)}
                className={classNames('tab-panel', getName('panel--', item.title), {'is-active': this.props.viewState.modalTabIndex === i})}
                aria-labelledby={getName('tablist--', item.title)}
                role='tabpanel' tabIndex='0'>
                <h2 className="hide">{item.title.replace(/-/g, ' ')}</h2>
                {item.panel}
            </section>
        ));
    },

    render() {
        return (
            <div className='tabs'>
                <ul className="tablist" role="tablist">
                    {this.renderTabs()}
                </ul>
                {this.renderPanels()}
            </div>);
    }
});

module.exports = Tabs;
