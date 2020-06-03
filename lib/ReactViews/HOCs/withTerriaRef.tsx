import React from "react";
import PropTypes from "prop-types";

import ViewState from "../../ReactViewModels/ViewState";

const getDisplayName = (WrappedComponent: React.ComponentClass<any>) => {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
};

interface WithTerriaRefProps {
  viewState: ViewState;
}

/*
    HOC to set a ref and store it in viewState
*/
export const withTerriaRef = <P extends object>(
  WrappedComponent: React.ComponentClass<P>,
  refName: string
) => {
  class WithTerriaRef extends React.Component<P & WithTerriaRefProps> {
    public static readonly displayName = `WithTerriaRef(${getDisplayName(
      WrappedComponent
    )})`;
    hocRef: React.Ref<HTMLElement> | undefined = undefined;
    constructor(props: P & WithTerriaRefProps) {
      super(props);
      this.hocRef = React.createRef();
    }
    updateRef() {
      if (this.hocRef) {
        this.props.viewState.updateAppRef(refName, this.hocRef);
      }
    }
    componentDidMount() {
      this.updateRef();
    }
    componentDidUpdate() {
      this.updateRef();
    }
    componentWillUnmount() {
      this.props.viewState.deleteAppRef(refName);
    }
    render() {
      return (
        <WrappedComponent
          updateRefFromHOC={this.updateRef}
          refFromHOC={this.hocRef}
          {...this.props}
        />
      );
    }
  }
  return WithTerriaRef;
};
withTerriaRef.propTypes = {
  viewState: PropTypes.object.isRequired
};

export default withTerriaRef;
