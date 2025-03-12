import { FC } from "react";

import Text from "../../../Styled/Text";

interface ErrorComponentProps {
  children: React.ReactNode;
}

const ErrorComponent: FC<ErrorComponentProps> = ({ children }) => {
  return (
    <Text large textLight>
      {children}
    </Text>
  );
};

export default ErrorComponent;
