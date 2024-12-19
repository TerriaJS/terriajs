import classNames from "classnames";
import { reaction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import Icon from "../Styled/Icon";
import Styles from "./drag-drop-notification.scss";
import { withViewState } from "./Context";

@observer
class DragDropNotification extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      showNotification: false
    };
  }

  static propTypes = {
    viewState: PropTypes.object
  };

  notificationTimeout = null;
  lastUploadedFilesReaction = null;

  componentDidMount() {
    // @ts-expect-error TS(2322): Type 'IReactionDisposer' is not assignable to type... Remove this comment to see the full error message
    this.lastUploadedFilesReaction = reaction(
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      () => this.props.viewState.lastUploadedFiles,
      () => {
        // @ts-expect-error TS(2769): No overload matches this call.
        clearTimeout(this.notificationTimeout);
        // show notification, restart timer
        this.setState({
          showNotification: true
        });
        // initialise new time out
        // @ts-expect-error TS(2322): Type 'Timeout' is not assignable to type 'null'.
        this.notificationTimeout = setTimeout(() => {
          this.setState({
            showNotification: false
          });
        }, 5000);
      }
    );
  }

  componentWillUnmount() {
    // @ts-expect-error TS(2769): No overload matches this call.
    clearTimeout(this.notificationTimeout);
    // @ts-expect-error TS(2721): Cannot invoke an object which is possibly 'null'.
    this.lastUploadedFilesReaction();
  }

  handleHover() {
    // reset timer on hover
    // @ts-expect-error TS(2769): No overload matches this call.
    clearTimeout(this.notificationTimeout);
  }

  handleMouseLeave() {
    // @ts-expect-error TS(2322): Type 'Timeout' is not assignable to type 'null'.
    this.notificationTimeout = setTimeout(() => {
      this.setState({
        showNotification: false
      });
    }, 4000);
  }

  handleClick() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.openUserData();
  }

  render() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const fileNames = this.props.viewState.lastUploadedFiles.join(",");
    return (
      <button
        className={classNames(Styles.notification, {
          // @ts-expect-error TS(2339): Property 'showNotification' does not exist on type... Remove this comment to see the full error message
          [Styles.isActive]: this.state.showNotification && fileNames.length > 0
        })}
        onMouseEnter={this.handleHover.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
        onClick={this.handleClick.bind(this)}
      >
        <div className={Styles.icon}>
          <Icon glyph={Icon.GLYPHS.upload} />
        </div>
        <div className={Styles.info}>
          <span className={Styles.filename}>
            {'"'}
            {fileNames}
            {'"'}
          </span>{" "}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on
          type 'Reado... Remove this comment to see the full error message
          {this.props.viewState.lastUploadedFiles.length > 1
            ? "have"
            : "has"}{" "}
          been added to <span className={Styles.action}>My data</span>
        </div>
      </button>
    );
  }
}

export default withViewState(DragDropNotification);
