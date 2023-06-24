import React from "react";

import Text from "../../../Styled/Text";

const ErrorComponent: React.FC = ({ children }) => {
  return (
    <Text large textLight>
      {children}
    </Text>
  );
};

export default ErrorComponent;
