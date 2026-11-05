import type { ReactElement } from "react";
import { expect } from "vitest";
import { render } from "vitest-browser-react";

// Every lib/UI component puts its base class on its root, and a className it's
// given after it, so a map can add its own without losing it
export const expectClassNames = async (
  renderWith: (className?: string) => ReactElement,
  baseClass: string
): Promise<void> => {
  const plain = await render(renderWith());
  expect(plain.container.firstElementChild?.className).toBe(baseClass);
  await plain.unmount();

  const given = await render(renderWith("map-own"));
  expect(given.container.firstElementChild?.className).toBe(
    `${baseClass} map-own`
  );
  await given.unmount();
};
