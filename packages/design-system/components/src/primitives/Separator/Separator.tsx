import {
  Separator as AriaSeparator,
  type SeparatorProps as AriaSeparatorProps
} from "react-aria-components/Separator";
import "./Separator.css";

type SeparatorVariant = "primary" | "secondary" | "tertiary";

type SeparatorProps = AriaSeparatorProps & {
  variant?: SeparatorVariant;
};

const Separator = ({
  orientation = "horizontal",
  variant = "primary",
  ...props
}: SeparatorProps): React.ReactElement => {
  return (
    <AriaSeparator
      {...props}
      orientation={orientation}
      data-orientation={orientation}
      data-tds="separator"
      data-tds-variant={variant}
    />
  );
};

Separator.displayName = "Separator";

export { Separator };
export type { SeparatorVariant, SeparatorProps };
