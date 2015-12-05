'use strict';
var React = require('react');
var SearchBox = require('./SearchBox.jsx');
var ModalTriggerButton = require('./ModalTriggerButton.jsx');
var Legend = require('./Legend.jsx');

var btnAdd = 'Add Data';
var btnRemove = 'Remove All';

var SidePanel = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    removeAll: function() {
        this.props.terria.nowViewing.removeAll();
        window.nowViewingUpdate.raiseEvent();
    },

    render: function() {
        var terria = this.props.terria;
        var nowViewing = this.props.terria.nowViewing.items;
        var content = null;
        var remove = null;

        if (nowViewing && nowViewing.length > 0) {
            remove = (<li className="now-viewing__remove"><button onClick={this.removeAll} className='btn'>{btnRemove}</button></li>);
            content = nowViewing.map(function(item, i) {
                return (<Legend nowViewingItem={item} key={i} />);
            });
        }
        return (<div>
            <SearchBox terria={terria}/>
            <div className="now-viewing">
              <ul className="now-viewing__control list-reset clearfix">
                <li className="now-viewing__add"><ModalTriggerButton btnText={btnAdd}/></li>
                {remove}
              </ul>
              {(nowViewing && nowViewing.length > 0) ? (<label className='block label-now-viewing-group'> Data Sets </label>) : null}
              <ul className="now-viewing__content list-reset">
                {content}
              </ul>
            </div>
        </div>);
    }
});
module.exports = SidePanel;
