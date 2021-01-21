import React from "react";

const Text: any = require("../../../Styled/Text").Text;

const ErrorComponent: React.FC = ({ children }) => {
  return (
    <Text large textLight>
      {children}
    </Text>
  );
};

export default ErrorComponent;
