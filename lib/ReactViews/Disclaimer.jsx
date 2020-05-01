import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import NotificationWindow from "./Notification/NotificationWindow";
import defined from "terriajs-cesium/Source/Core/defined";

@observer
class Disclaimer extends React.Component {
  static displayName = "Disclaimer";

  static propTypes = {
    viewState: PropTypes.object,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
  }

  
  // confirm() {
  //   const notification = this.props.viewState.notifications[0];
  //   if (notification && notification.confirmAction) {
  //     notification.confirmAction();
  //   }

  //   this.close(notification);
  // }

  // deny() {
  //   const notification = this.props.viewState.notifications[0];
  //   if (notification && notification.denyAction) {
  //     notification.denyAction();
  //   }

  //   this.close(notification);
  // }

  // close(notification) {
  //   runInAction(() => {
  //     this.props.viewState.disclaimerSettings = undefined;
  //   });

  //   // Force refresh once the notification is dispached if .hideUi is set since once all the .hideUi's
  //   // have been dispatched the UI will no longer be suppressed causing a change in the view state.
  //   if (notification && notification.hideUi) {
  //     triggerResize();
  //   }
  // }

  render() {
    const disclaimer = this.props.viewState.disclaimerSettings;
    console.log(disclaimer);
    return (
      disclaimer && (
        <NotificationWindow
          title={disclaimer.title}
          message={disclaimer.message}
          confirmText={disclaimer.confirmText}
          denyText={disclaimer.denyText}
          onConfirm={this.confirm}
          onDeny={this.deny}
          type={
            defined(disclaimer.type) ? disclaimer.type : "disclaimer"
          }
          width={disclaimer.width}
          height={disclaimer.height}
        />
      )
    );
  }
}

export default withTranslation()(withTheme(Disclaimer));