import { ReactNode } from "react";
import Text from "../../../Styled/Text";

function ErrorComponent({ children }: { children: ReactNode }) {
  return (
    <Text large textLight>
      {children}
    </Text>
  );
}

export default ErrorComponent;
