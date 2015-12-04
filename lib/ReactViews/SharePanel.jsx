'use strict';
var SharePanel = React.createClass({
    getInitialState: function() {
        return {
            isOpen: false
        };
    },

    togglePanel: function() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    render: function() {

        //To do : aria-hidden={!this.state.isOpen}
        return (
            <div className ={'map-nav-panel share-panel ' + (this.state.isOpen? 'is-open': '')}>
              <button onClick={this.togglePanel}  className='share-panel__button btn btn-map' title='share'><i className="icon icon-share"></i></button>
                <div className ='share-panel-inner'>
                share this thing
               </div>
              </div>
        )
    }
});
module.exports = SharePanel;
