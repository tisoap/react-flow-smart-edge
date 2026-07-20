const MIGRATION_GUIDE_URL =
  "https://tisoap.github.io/react-flow-smart-edge/docs/migration/v5";

const NO_PROVIDER_MESSAGE =
  "[@tisoap/react-flow-smart-edge] A smart edge rendered without a " +
  "<SmartEdgeProvider> ancestor, so routing is disabled and the edge falls " +
  "back to its non-routed variant. Wrap your flow in <SmartEdgeProvider> to " +
  `enable routing. Migration guide: ${MIGRATION_GUIDE_URL}`;

let hasWarned = false;

/**
 * True when running in a production bundle, where the developer warning must
 * stay silent. Guards the `process` reference behind a `typeof` check so
 * browser ESM builds without a `process` global do not throw.
 */
const isProduction = (): boolean =>
  typeof process !== "undefined" && process.env["NODE_ENV"] === "production";

/**
 * Warns exactly once per module lifetime that a smart edge rendered outside a
 * `SmartEdgeProvider`. Silent in production. Repeated calls (e.g. one per
 * unprovided edge) are no-ops after the first warning.
 */
export const warnOnceNoProvider = (): void => {
  if (hasWarned || isProduction()) return;
  hasWarned = true;
  console.warn(NO_PROVIDER_MESSAGE);
};

/**
 * Test hook: clears the module-level "already warned" flag so a test can
 * observe the first-warning behavior again.
 */
export const __resetNoProviderWarning = (): void => {
  hasWarned = false;
};
