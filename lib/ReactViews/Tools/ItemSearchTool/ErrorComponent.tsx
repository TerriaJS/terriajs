import React from "react";

import Text from "../../../Styled/Text";

const ErrorComponent = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text large textLight>
      {children}
    </Text>
  );
};

export default ErrorComponent;
