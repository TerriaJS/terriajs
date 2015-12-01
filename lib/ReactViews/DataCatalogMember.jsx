'use strict';
var DataCatalogItem = require('./DataCatalogItem.jsx');
var Loader = require('./Loader.jsx');
var DataCatalogMember = React.createClass({
  getInitialState: function() {
    return {isOpen: false};
  },

  handleClick: function() {
    this.props.onClick(this);
  },

  render: function(){
    var member = this.props.member;
    var items = this.props.items;

    var content ='';

    if(this.state.isOpen === true ){
      if(items && items.length > 0){
        content = items.map(function(item, i){return <DataCatalogItem item={item} key={i} />});
      } else{
        content = <Loader/>
      }
    }
    var iconClass = 'icon icon-chevron-' + (this.state.isOpen ? 'down' : 'right');
    return (
      <li>
      <button onClick={this.handleClick} className="btn data-group"><i className={iconClass}></i>{member.name}</button>
      <ul className='list-reset'>
      {content}
      </ul>
      </li>
      );
  }
});

module.exports = DataCatalogMember;
