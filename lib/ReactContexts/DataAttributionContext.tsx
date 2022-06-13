import React, {
  Context as ReactContext,
  createContext,
  FC,
  useCallback,
  useContext,
  useMemo
} from "react";

interface IDataAttributionContext {
  dataAttributionVisible: boolean;
  showDataAttribution: () => void;
  hideDataAttribution: () => void;
}

const Context = createContext<IDataAttributionContext | null>(null);

export const DataAttributionContextProvider: FC = ({ children }) => {
  const [dataAttributionVisible, setDataAttributionVisible] = React.useState(
    false
  );

  const showDataAttribution = useCallback(() => {
    setDataAttributionVisible(true);
  }, [setDataAttributionVisible]);

  const hideDataAttribution = useCallback(() => {
    setDataAttributionVisible(false);
  }, [setDataAttributionVisible]);

  const contextValue = useMemo(
    () => ({
      dataAttributionVisible,
      showDataAttribution,
      hideDataAttribution
    }),
    [dataAttributionVisible, showDataAttribution, hideDataAttribution]
  );
  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export const useDataAttributionContext = (): IDataAttributionContext => {
  const context = useContext<IDataAttributionContext>(
    Context as ReactContext<IDataAttributionContext>
  );
  if (!context) {
    throw new Error(
      "useDataAttributionContext must be used within a DataAttributionContextProvider"
    );
  }
  return context;
};
