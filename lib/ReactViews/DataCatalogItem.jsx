'use strict';
var React = require('react');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var DataCatalogItem = React.createClass({
    propTypes:{
        item: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            isPreviewed: false,
            status: 'disabled'
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
        var that = this;

        if (that.props.item.isEnabled === false) {
            that.setState({
                    status: 'loading'
                });
            when(that.props.item.load()).then(function() {
                that.setState({
                    status: 'loaded'
                });
            that.props.item.isEnabled = true;
            window.nowViewingUpdate.raiseEvent();
            });
        } else{
           this.props.item.isEnabled = false;
           window.nowViewingUpdate.raiseEvent();
           that.setState({
                    status: 'disabled'
                });
        }

        this.addToPreview(event);
    },

  render: function(){
    var item = this.props.item;
    var iconClass;

    // if (this.props.item.isEnabled === true){
    //     if (this.props.item.isLoading === true){
    //         iconClass = 'icon icon-loader';
    //     } else {
    //         iconClass = 'icon icon-minus';
    //     }
    // } else {
    //     iconClass = 'icon icon-add';
    // }
    switch(this.state.status) {
    case 'disabled':
        iconClass = 'icon icon-add';
        break;
    case 'loading':
        iconClass = 'icon icon-loader';
        break;
    case 'loaded':
        iconClass = 'icon icon-minus'
        break;
    default:
        iconClass = '';
    }

    return (
      <li className="clearfix data-catalog-item flex"><button onClick={this.addToMap} title="add to map" className='btn relative btn-add-to-map'><i className={iconClass}> </i></button><button onClick={this.addToPreview} className='btn btn-catalog-item relative'>{item.name}</button></li>
      );
    }
});

module.exports = DataCatalogItem;
