var ModalTriggerButton = React.createClass({
  controlModal: function (e) {
    //open modal window
    emitter.dispatch('openModalWindow', null);
  },

  render: function() {
    return <button onClick={this.controlModal} className="btn">{this.props.btnText}</button>;
  }
});
module.exports = ModalTriggerButton;
