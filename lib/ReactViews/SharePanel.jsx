'use strict';
var React = require('react');
// The share panel doesn't do anything yet
var SharePanel = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            isOpen: false
        };
    },

    componentWillMount: function(){

    },

    togglePanel: function() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    selectUrl : function(){

    },

    render: function() {

        //To do : aria-hidden={!this.state.isOpen}
        return (
            <div className ={'map-nav-panel setting-panel share-panel ' + (this.state.isOpen ? 'is-open' : '')}>
              <button onClick={this.togglePanel}  className='share-panel__button btn btn-map' title='share'><i className="icon icon-share"></i></button>
                <div className ='share-panel-inner setting-panel-inner'>
                    <figure className="setting-panel-section"> <img src="http://placehold.it/350x150"/> </figure>
                    <div className="share-panel__label setting-panel-section">
                    The following data sources will NOT be shared because they include data from this local system.
                    To share these data sources, publish their data on a web server and add them using
                    the URL instead of by dragging/dropping or selecting a local file.
                    </div>
                    <div className="setting-panel-section">
                        <label className="share-panel__label">To <strong>copy</strong> to clipboard, click the link below and press CTRL+C or &#8984;+C: </label>
                        <input readOnly type="text" size="100" className='block field' oncCick={this.selectUrl} />
                    </div>
                    <div className="setting-panel-section">
                        <label className="share-panel__label">To <strong>embed</strong>, copy this code to embed this map into an HTML page: </label>
                        <input readOnly type="text" size="100" className='block field' oncClick={this.selectUrl} />
                    </div>
                    <div className="setting-panel-section">
                        <label className="share-panel__label">
                            <input type="checkbox" className='share-panel__checkbox'/>Shorten the share URL using a web service
                        </label>
                    </div>
               </div>
              </div>
        );
    }
});
module.exports = SharePanel;
