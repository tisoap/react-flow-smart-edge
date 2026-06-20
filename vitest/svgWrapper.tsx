import type { ReactNode } from "react";

/** Wraps SVG child elements so jsdom/React 19 do not warn during unit tests. */
export function SvgWrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <svg>{children}</svg>;
}
