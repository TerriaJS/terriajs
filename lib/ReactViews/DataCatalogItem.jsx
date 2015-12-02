'use strict';

var DataCatalogItem = React.createClass({

  getInitialState: function() {
    return {
      isPreviewed: false
    };
  },

  addToPreview: function(event){
    event.preventDefault();
    this.setState({
      isPreviewed: true
    });
    previewUpdate.raiseEvent(this.props.item);
  },

  addToMap: function(event){
    event.preventDefault();
    this.props.item.isEnabled = !this.props.item.isEnabled;
    nowViewingUpdate.raiseEvent();
    //update preview as well
    previewUpdate.raiseEvent(this.props.item);
  },

  render: function(){
    var item = this.props.item;
    var iconClass = "icon " + (this.props.item.isEnabled === true ? "icon-minus" : "icon-add");
    return (
      <li className="clearfix data-catalog-item flex"><button onClick={this.addToMap} title="add to map" className="btn relative btn-add-to-map"><i className={iconClass}> </i></button><button onClick={this.addToPreview} className="btn btn-catalog-item relative">{item.name}</button></li>
      ) ;
  }
});

module.exports = DataCatalogItem;
