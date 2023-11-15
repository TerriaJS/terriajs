import { ComponentType, ReactNode, createContext, useContext } from "react";
import TerriaError from "../../Core/TerriaError";
import ViewState from "../../ReactViewModels/ViewState";

export const ViewStateContext = createContext<ViewState | undefined>(undefined);

interface ViewStateProviderProps {
  viewState: ViewState;
  children: ReactNode;
}

export const ViewStateProvider = ({
  viewState,
  children
}: ViewStateProviderProps) => (
  <ViewStateContext.Provider value={viewState}>
    {children}
  </ViewStateContext.Provider>
);

export const useViewState = () => {
  const viewState = useContext(ViewStateContext);
  if (!viewState)
    throw new TerriaError({ message: "ViewState is not defined!" });
  return viewState;
};

export const withViewState =
  <P extends WithViewState>(Component: ComponentType<P>) =>
  (props: Omit<P, "viewState">): JSX.Element =>
    (
      <ViewStateContext.Consumer>
        {(viewState) => {
          if (!viewState)
            throw new TerriaError({ message: "ViewState is not defined!" });
          return <Component {...(props as P)} viewState={viewState} />;
        }}
      </ViewStateContext.Consumer>
    );

export interface WithViewState {
  viewState: ViewState;
}
