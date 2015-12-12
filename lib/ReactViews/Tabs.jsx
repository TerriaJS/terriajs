'use strict';

var React = require('react');
var DataCatalog = require('./DataCatalog.jsx');
var MyDataTab = require('./MyDataTab.jsx');
// var CollectionsTab = require('./CollectionsTab.jsx');

function getName(str1, str2) {
    return str1.concat(str2);
}

var items = ['data-catalog','my-data'];

var Tabs = React.createClass({
    propTypes: {
      terria: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            activeTab: 0
        };
    },

    clickTab: function(i) {
        this.setState({
            activeTab: i
        });
    },

    render: function() {
        var panels = [<DataCatalog terria={this.props.terria}/>, <MyDataTab/>];
        return (
            <div className="tabs clearfix">
              <ul className="tablist list-reset flex" role="tablist">
              {items.map(function(item, i ){
              return (<li key={i} className={getName('tablist__', item)} id={getName('tablist__', item)} role="tab" aria-controls={getName('panel__', item)} aria-selected={(this.state.activeTab === i) ? 'true' : 'false'} ><button onClick={this.clickTab.bind(this, i)} className='btn btn-tab'>{item.replace(/-/g, ' ')}</button></li>);
              }, this)}
              </ul>

              {items.map(function(item, i){
                return (
                  <section key={i} aria-hidden={(this.state.activeTab === i) ? 'false' : 'true'} id={getName('panel__', item)} className={getName('tab-panel panel__', item)}  aria-labelledby={getName('tablist__', item)} role='tabpanel' tabIndex='0'>
                  <h3 className="hide">{item.replace(/-/g, ' ')}</h3>
                    {panels[i]}
                  </section>
                  );
                }, this)}
              </div>);
      }
});
module.exports = Tabs;
