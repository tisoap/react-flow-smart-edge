import { Redirect } from "@docusaurus/router";
import type { ReactElement } from "react";

export default function Home(): ReactElement {
  return <Redirect to="/docs" />;
}
