import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import classNames from "classnames";

import Styles from "./file-input.scss";

// When uploading a file
// use an button element to have consistent stylying
const FileInput = createReactClass({
    propTypes: {
        onChange: PropTypes.func,
        accept: PropTypes.string
    },

    getInitialState() {
        return {
            value: "Browse for local data",
            hovered: false
        };
    },

    handleChange(e) {
        this.setState({
            value: e.target.value.split(/(\\|\/)/g).pop()
        });
        if (this.props.onChange) {
            this.props.onChange(e);
        }
    },

    render() {
        return (
            <form className={Styles.fileInput}>
                <input
                    type="file"
                    onChange={this.handleChange}
                    accept={this.props.accept}
                    className={Styles.input}
                />
                <label className={Styles.btnBrowseData}>
                    {this.state.value
                        ? this.state.value
                        : "Add local data file"}
                </label>
            </form>
        );
    }
});

module.exports = FileInput;
