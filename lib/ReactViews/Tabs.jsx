'use strict';

import DataCatalogTab from './DataCatalogTab.jsx';
import MyDataTab from './MyDataTab.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import WelcomeTab from './WelcomeTab.jsx';

function getName(str1, str2) {
    return str1.concat(str2);
}

const Tabs = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        activeTabID: React.PropTypes.number,
        catalogSearchText: React.PropTypes.string,
        previewedCatalogItem: React.PropTypes.object,
        onCatalogSearchTextChanged: React.PropTypes.func,
        onActiveTabChanged: React.PropTypes.func,
        onPreviewedCatalogItemChanged: React.PropTypes.func
    },

    getTabs() {
      // This can be passed in as prop
        return [
            {
                title: 'welcome',
                panel: <WelcomeTab terria={this.props.terria} />
            },
            {
                title: 'data-catalog',
                panel: <DataCatalogTab terria={this.props.terria}
                                       searchText={this.props.catalogSearchText}
                                       previewedCatalogItem={this.props.previewedCatalogItem}
                                       onSearchTextChanged={this.props.onCatalogSearchTextChanged}
                                       onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                        />
            },
            {
                title: 'my-data',
                panel: <MyDataTab terria={this.props.terria}/>
            }
        ];
    },

    activateTab(i) {
        this.props.onActiveTabChanged(i);
    },

    renderTabs() {
        const that = this;
        return (that.getTabs().map((item, i) =>
                  <li key={i}
                    className={getName('tablist__', item.title)}
                    id={getName('tablist__', item.title)}
                    role="tab"
                    aria-controls={getName('panel__', item.title)}
                    aria-selected={that.props.activeTabID === i}>
                  <button onClick={that.activateTab.bind(that, i)}
                    className='btn btn-tab'>{item.title.replace(/-/g, ' ')}</button>
                    </li>
                    ));
    },

    renderPanels() {
        const that = this;
        return (that.getTabs().map((item, i) => <section
                    key={i}
                    aria-hidden={that.props.activeTabID !== i}
                    id={getName('panel__', item.title)}
                    className={getName('tab-panel panel__', item.title)}
                    aria-labelledby={getName('tablist__', item.title)}
                    role='tabpanel' tabIndex='0'>
                  <h3 className="hide">{item.title.replace(/-/g, ' ')}</h3>{item.panel}</section>));
    },

    render() {
        return (
            <div className="tabs clearfix">
          <ul className="tablist list-reset flex" role="tablist">
          {this.renderTabs()}
          </ul>
          {this.renderPanels()}
          </div>);
    }
});

module.exports = Tabs;
