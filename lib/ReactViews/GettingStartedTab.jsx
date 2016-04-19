'use strict';
import React from 'react';
import renderMarkdownInReact from '../Core/renderMarkdownInReact';
// The welcome tab, not used in current design
const GettingStartedTab = React.createClass({
    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired
    },

    openAddData() {
        this.props.viewState.openAddData();
    },

    openUserData() {
        this.props.viewState.openUserData();
    },

    render() {
        return (<div className="panel-content">
                    <div className="panel__inner">
                        {renderMarkdownInReact(this.props.terria.welcome)}
                        <div className='panel-actions'>
                          <button className='btn btn-primary btn--first' onClick={this.openAddData} >Explore the Data Catalogue 22</button>
                          <button className='btn btn-primary btn--second' onClick={this.openUserData} >Load your own data</button>
                        </div>
                    </div>
                </div>);
    }
});
module.exports = GettingStartedTab;
