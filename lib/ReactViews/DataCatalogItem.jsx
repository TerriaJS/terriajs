var DataCatalogItem = React.createClass({

  getInitialState: function() {
    return {
      isPreviewed: false,
      isActive: false
    };
  },

  addToPreview: function(){
    this.setState({
      isPreviewed: true
    });
    previewUpdate.raiseEvent(this.props.item);
  },

  addToMap: function(){
    this.setState({
      isActive: true
    });

    this.props.item.isEnabled = !this.props.item.isEnabled;
    nowViewingUpdate.raiseEvent();
  },

  render: function(){
    var item = this.props.item;
    var iconClass = "fa " + (this.props.item.isEnabled === true ? "fa-minus-circle red" : "fa-plus-circle blue");
    return (
      <li className="clearfix"><button onClick={this.addToPreview} className="btn data-group__data-item col col-10">{item.name}</button><button onClick={this.addToMap} className="btn col col-2 "><i className={iconClass}> </i></button></li>
      ) ;
  }
});

module.exports = DataCatalogItem;
