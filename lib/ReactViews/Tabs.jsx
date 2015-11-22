'use strict';
var DataCatalog = require('./DataCatalog.jsx');
var WelcomeTab = require('./WelcomeTab.jsx');
var MyDataTab = require('./MyDataTab.jsx');
var CollectionsTab = require('./CollectionsTab.jsx');

function getName(str1, str2){
  return str1.concat(str2)
}

var items = ['welcome', 'data-catalog', 'collections' , 'my-data' ];

var Tabs = React.createClass({
  getInitialState: function() {
    return {
      activeTab: 1
    };
  },

  clickTab: function(i){
    this.setState({
      activeTab: i
    })
  },

  render: function() {
    var panels = [ <WelcomeTab />, <DataCatalog catalog={this.props.catalog} />, <CollectionsTab/>, <MyDataTab /> ];
    return (
      <div className="tabs clearfix">
      <ul className="tablist center list-reset mb0" role="tablist">
      {items.map(function(item, i ){
      return (<li onClick={this.clickTab.bind(this, i)} key={i} id={getName('tablist__', item)} className={getName('btn btn-tab tablist__', item)} role="tab" aria-controls={getName('panel__', item)} aria-selected={(this.state.activeTab == i) ? "true" : "false"} tabIndex="0">{item.replace(/-/g, ' ')}</li>)
      }, this)}
      </ul>

      {items.map(function(item, i){
        return(
          <section key={i} aria-hidden={(this.state.activeTab == i) ? "false" : "true"} id={getName('panel__', item)} className={getName('tab-panel panel__', item)}  aria-labelledby={getName('tablist__', item)} role="tabpanel" tabIndex="0">
          <h3 className="hide">{item.replace(/-/g, ' ')}</h3>
            {panels[i]}
          </section>
          )
        }, this)}
      </div>);
  }
});
module.exports = Tabs;
