'use strict';
var React = require('react');
var ModalTriggerButton = require('./ModalTriggerButton.jsx');

var Branding = React.createClass({
    propTypes:{
      terria: React.PropTypes.object
    },

    render: function() {
        let imageUrl = './images/nationalmap-logo.png';
            return (<h1>
                    <ModalTriggerButton btnText={imageUrl} classNames = 'now-viewing__add'/>
                    </h1>);
    }
});
module.exports = Branding;
