var markdownToHtml = require('terriajs/lib/Core/markdownToHtml');

var DataPreview = React.createClass({
  getInitialState: function() {
    return {
      item: {
        name: 'Select a Dataset to see preview',
        description: ''
        }
    };
  },
  componentWillMount: function(){
    var that = this;
    emitter.subscribe('preview', function(data) {
      that.setState({
        item: data
      })
    });
  },

  addToMap: function() {
    this.state.item.isEnabled = true;
    emitter.dispatch('nowViewing', this.state.item);
  },

  render: function() {
    var item = this.state.item;
    var url = "http://placehold.it/600x300?text=preview" + item.name.replace(/\s+/g, '-').toLowerCase();

    return (<figure>
            <img src={url}/>
            <figcaption>
            <div className="title clearfix">
            <h4 className="col col-6">{item.name}</h4>
            <ul className="list-reset flex col col-6 search-preview-action">
            <li><button className="btn" title ="share this data"><i className="fa fa-share-alt"></i></button></li>
            <li><button onClick={this.addToMap} className="btn btn-primary" title ="add to map"><i className="fa fa-plus-circle"></i> Add to map</button></li>
            </ul>
            </div>
            <p dangerouslySetInnerHTML={{__html: markdownToHtml(item.description)}}></p>
            </figcaption>
            </figure>
            );
  }
});
module.exports = DataPreview;
