import { action, observable } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";

/**
 * A component that passes its width to its child component.
 */
@observer
class Sized extends React.Component {
  @observable containerElement = undefined;
  @observable size = { width: 0, height: 0 };

  static propTypes = {
    children: PropTypes.func.isRequired
  };

  @action
  attachElement(el) {
    this.containerElement = el;
  }

  componentDidMount() {
    this.updateWidth();
    window.addEventListener("resize", this.updateWidth.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWidth.bind(this));
  }

  @action
  updateWidth() {
    if (this.containerElement) {
      const rect = this.containerElement.getBoundingClientRect();
      this.size = { width: rect.width, height: rect.height };
    }
  }

  render() {
    return (
      <div ref={this.attachElement.bind(this)}>
        {this.props.children(this.size)}
      </div>
    );
  }
}

export default Sized;
