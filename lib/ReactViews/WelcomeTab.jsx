'use strict';
import React from 'react';
import renderMarkdownInReact from '../Core/renderMarkdownInReact';
// The welcome tab, not used in current design
const WelcomeTab = React.createClass({
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
                    <a className='btn btn--github' href='https://github.com/TerriaJS/terriajs' target="_blank">Fork on Github</a>
                    <div className="welcome__inner">
                        {renderMarkdownInReact(this.props.terria.welcome)}
                        <div className='welcome-actions'>
                          <button className='btn btn-primary btn--first' onClick={this.openAddData} >Explore the Data Catalog</button>
                          <button className='btn btn-primary btn--second' onClick={this.openUserData} >Load your own data</button>
                        </div>
                    </div>
                </div>);
    }
});
module.exports = WelcomeTab;
