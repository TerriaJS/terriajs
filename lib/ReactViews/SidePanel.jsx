'use strict';

var SearchBox = require('./SearchBox.jsx');
var ModalTriggerButton = require('./ModalTriggerButton.jsx');
var Legend = require('./Legend.jsx');

var btnAdd = "Add Data";
var btnRemove = "Remove All";

var SidePanel = React.createClass({

  removeAll: function(){
    this.props.nowViewing.removeAll();
    nowViewingUpdate.raiseEvent();
  },

  render: function() {
    var nowViewing = this.props.nowViewing.items;
    var content = null;
    var remove =null;

    if(nowViewing && nowViewing.length > 0){
      remove = (<li className="now-viewing__remove col col-6 right-align"><button onClick={this.removeAll} className='btn'> Remove All </button></li>
    );
      content = nowViewing.map(function(item, i) {return (<Legend nowViewingItem={item} key={i} />)});
    }
    return (<div>
            <SearchBox />
            <div className="now-viewing">
              <ul className="now-viewing__control list-reset clearfix">
                <li className="now-viewing__add col col-6"><ModalTriggerButton btnText={btnAdd}/></li>
                {remove}
              </ul>
              <ul className="now-viewing__content list-reset">
                {content}
              </ul>
            </div>
        </div>
      );
  }
});
module.exports = SidePanel;
