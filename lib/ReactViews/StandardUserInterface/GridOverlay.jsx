'use strict';
import React from 'react';
import Styles from './grid-overlay.scss';

export default class GridOverlay extends React.Component {
    constructor(props) {
        super(props);
        this.state = { show: true };
        this.toggleBtn = this.toggleBtn.bind(this);
    }

    toggleBtn() {
        this.setState({
            show: !this.state.show
        });
    }

    render() {
        return (<div>
                 <button className={Styles.toggleBtn} onClick={this.toggleBtn}>toggle grid</button>
                 {this.state.show && <div className={Styles.wrapper}/>}
                </div>);
    }
}
