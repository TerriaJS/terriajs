import React, { useRef, useEffect } from "react";

export const VanillaChildren = ({ children }: { children: HTMLElement }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.appendChild(children);
  });

  return <div ref={ref} />;
};
