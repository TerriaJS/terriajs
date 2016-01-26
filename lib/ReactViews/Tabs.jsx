'use strict';

const React = require('react');
const DataCatalogTab = require('./DataCatalogTab.jsx');
const MyDataTab = require('./MyDataTab.jsx');
const WelcomeTab = require('./WelcomeTab.jsx');

function getName(str1, str2) {
    return str1.concat(str2);
}

const Tabs = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        activeTab: React.PropTypes.number,
        toggleModalWindow: React.PropTypes.func,
        previewed: React.PropTypes.object,
        setPreview: React.PropTypes.func,
        defaultSearchText: React.PropTypes.string
    },

    getInitialState() {
        return {
            activeTab: this.props.activeTab
        };
    },

    clickTab(i) {
        this.props.toggleModalWindow(true, i, null);
    },

    getTabs() {
      // This can be passed in as prop
        return [
            {
                title: 'welcome',
                panel: <WelcomeTab terria= {this.props.terria} />
            },
            {
                title: 'data-catalog',
                panel: <DataCatalogTab terria={this.props.terria}
                                       defaultSearchText={this.props.defaultSearchText}
                                       previewed={this.props.previewed}
                                       setPreview={this.props.setPreview}
                        />
            },
            {
                title: 'my-data',
                panel: <MyDataTab terria={this.props.terria}/>
            }
        ];
    },

    renderTabs() {
        const that = this;
        return (that.getTabs().map((item, i) =>
                  <li key={i}
                    className={getName('tablist__', item.title)}
                    id={getName('tablist__', item.title)}
                    role="tab"
                    aria-controls={getName('panel__', item.title)}
                    aria-selected={that.props.activeTab === i}>
                  <button onClick={that.clickTab.bind(that, i)}
                    className='btn btn-tab'>{item.title.replace(/-/g, ' ')}</button>
                    </li>
                    ));
    },

    renderPanels() {
        const that = this;
        return (that.getTabs().map((item, i) => <section
                    key={i}
                    aria-hidden={that.props.activeTab !== i}
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
