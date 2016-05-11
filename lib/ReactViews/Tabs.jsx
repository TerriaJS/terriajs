'use strict';

import DataCatalogTab from './DataCatalogTab.jsx';
import MyDataTab from './MyDataTab.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import classNames from 'classnames';

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
                className={'tablist--' + item.title}
                id={'tablist--' + item.title}
                role="tab"
                aria-controls={'panel--' + item.title}
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
                id={'panel--' + item.title}
                className={classNames('tab-panel', 'panel--' + item.title, {'is-active': this.props.viewState.modalTabIndex === i})}
                aria-labelledby={'tablist--' + item.title}
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
