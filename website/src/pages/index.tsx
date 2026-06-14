import useBaseUrl from "@docusaurus/useBaseUrl";
import { Redirect } from "@docusaurus/router";
import type { ReactElement } from "react";

export default function Home(): ReactElement {
  return <Redirect to={useBaseUrl("/docs")} />;
}
