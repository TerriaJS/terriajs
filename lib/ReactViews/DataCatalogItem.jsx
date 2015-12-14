'use strict';
var React = require('react');
var DataCatalogItem = React.createClass({
    propTypes:{
        item: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            isPreviewed: false
        };
    },

    addToPreview: function(event) {
        event.preventDefault();

        if (this.state.isPreviewed === false){
          window.previewUpdate.raiseEvent(this.props.item);
        }

        this.setState({
            isPreviewed: !this.state.isPreviewed
        });
    },

    addToMap: function(event) {
        event.preventDefault();
        this.props.item.isEnabled = !this.props.item.isEnabled;
        window.nowViewingUpdate.raiseEvent();
        this.addToPreview(event);
    },

  render: function(){
    var item = this.props.item;
    var iconClass;

    if (this.props.item.isEnabled === true){
        if (this.props.item.isLoading === true){
            iconClass = 'icon icon-loader';
        } else {
            iconClass = 'icon icon-minus';
        }
    } else {
        iconClass = 'icon icon-add';
    }

    return (
      <li className="clearfix data-catalog-item flex"><button onClick={this.addToMap} title="add to map" className='btn relative btn-add-to-map'><i className={iconClass}> </i></button><button onClick={this.addToPreview} className='btn btn-catalog-item relative'>{item.name}</button></li>
      );
    }
});

module.exports = DataCatalogItem;
