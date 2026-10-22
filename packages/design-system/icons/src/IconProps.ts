import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  // Width and height, in px or any CSS length; 24 by default
  size?: number | string;
};

// Any icon component
export type Icon = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>;
