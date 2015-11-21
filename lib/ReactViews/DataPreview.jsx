'use strict';

var markdownToHtml = require('terriajs/lib/Core/markdownToHtml');

var DataPreview = React.createClass({
  getDefaultProps: function() {
    return {
      previewed: {
        name: 'Select a Dataset to see preview',
        description: ''
      }
    };
  },

  addToMap: function() {
    this.props.previewed.isEnabled = true;
    nowViewingUpdate.raiseEvent();
  },

  render: function() {
    var previewed = this.props.previewed;
    var url = "http://placehold.it/600x300?text=preview" + previewed.name.replace(/\s+/g, '-').toLowerCase();

    return (<figure>
      <img src={url}/>
      <figcaption>
      <div className="title clearfix">
      <h4 className="col col-6">{previewed.name}</h4>
      <ul className="list-reset flex col col-6 search-preview-action">
      <li><button className="btn" title ="share this data"><i className="fa fa-share-alt"></i></button></li>
      <li><button onClick={this.addToMap} className="btn btn-primary" title ="add to map"><i className="fa fa-plus-circle"></i> Add to map</button></li>
      </ul>
      </div>
      <p dangerouslySetInnerHTML={{__html: markdownToHtml(previewed.description)}}></p>
      </figcaption>
      </figure>
      );
  }
});
module.exports = DataPreview;
