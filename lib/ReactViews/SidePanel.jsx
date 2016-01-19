'use strict';
var React = require('react');
var SearchBox = require('./SearchBox.jsx');
var ModalTriggerButton = require('./ModalTriggerButton.jsx');
var Legend = require('./Legend.jsx');
var renderAndSubscribe = require('./renderAndSubscribe');

var btnAdd = 'Add Data';
var btnRemove = 'Remove All';

// the sidepanel
// TO DO:  rename this into workbench
// This get re-rendered when nowViewingItem changes
var SidePanel = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    removeAll: function() {
        this.props.terria.nowViewing.removeAll();
    },

    render: function() {
        return renderAndSubscribe(this, function() {
            var terria = this.props.terria;
            var nowViewing = this.props.terria.nowViewing.items;
            var content = null;
            var remove = null;

            if (nowViewing && nowViewing.length > 0) {
                remove = (<li><button onClick={this.removeAll} className='btn now-viewing__remove'>{btnRemove}</button></li>);
                content = nowViewing.map(function(item, i) {
                    return (<Legend nowViewingItem={item} key={i} />);
                });
            }
            return (<div>
                <SearchBox terria={terria} dataSearch={false}/>
                <div className="now-viewing hide-if-searching">
                  <ul className="now-viewing__control list-reset clearfix">
                    <li><ModalTriggerButton btnHtml={btnAdd} classNames = 'now-viewing__add'/></li>
                    {remove}
                  </ul>
                    {(nowViewing && nowViewing.length > 0) ? (<label className='block label-now-viewing-group'> Data Sets </label>) : null}
                    <ul className="now-viewing__content list-reset">
                        {content}
                    </ul>
                </div>
            </div>);
        });
    }
});
module.exports = SidePanel;
