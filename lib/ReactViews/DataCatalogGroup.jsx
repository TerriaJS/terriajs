'use strict';

var DataCatalogMember = require('./DataCatalogMember.jsx');
var Loader = require('./Loader.jsx');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var DataCatalogGroup = React.createClass({
  getInitialState: function() {
    return {
      isOpen: false,
      openId: ''
    };
  },

  handleClick: function() {
    this.props.onClick(this);
  },

  handleChildClick: function (i, obj) {
    var that = this;
    obj.props.member.isOpen = !obj.state.isOpen;
    obj.setState({
      isOpen : !obj.state.isOpen
    });

    if(obj.state.isOpen === false){
      when(obj.props.member.load()).then(function() {
        that.setState({
          openId : i
        });
      });
    }
  },

  render: function(){
    var group = this.props.group;
    var members = this.props.items;
    var content='';
    var iconClass;

    if(this.state.isOpen === true){
      var that = this;
      if(members && members.length > 0){
        content = members.map(function(member, i){return <DataCatalogMember  onClick={that.handleChildClick.bind(that, i)} member={member} items={member.items} key={i} />});
      } else{
        content = <Loader/> ;
      }
    }
    iconClass = 'icon icon-chevron-' + (this.state.isOpen ? 'down' : 'right');
    return (
      <li>
        <button className ='btn btn-catalogue' onClick={this.handleClick} >{group.name}<i className={iconClass}></i></button>
        <ul className="data-catalog-group list-reset">
        {content}
        </ul>
      </li>
      );
  }
});

module.exports = DataCatalogGroup;
