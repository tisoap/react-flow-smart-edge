const MIGRATION_GUIDE_URL =
  "https://tisoap.github.io/react-flow-smart-edge/docs/migration/v5";

const NO_PROVIDER_MESSAGE =
  "[@tisoap/react-flow-smart-edge] A smart edge rendered without a " +
  "<SmartEdgeProvider> ancestor, so routing is disabled and the edge falls " +
  "back to its non-routed variant. Wrap your flow in <SmartEdgeProvider> to " +
  `enable routing. Migration guide: ${MIGRATION_GUIDE_URL}`;

let hasWarned = false;

/** Narrows an unknown value to a plain, indexable object shape. */
const isRecord = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === "object" && value !== null;

/**
 * True when running in a production bundle, where the developer warning must
 * stay silent. Reads the ambient `process` global (if any) through
 * `Reflect.get` rather than referencing the bare `process` identifier, so
 * this file type-checks without a dependency on `@types/node` (the app
 * tsconfig deliberately has no Node types) and so browser ESM builds without
 * a `process` global do not throw.
 */
const isProduction = (): boolean => {
  const maybeProcess: unknown = Reflect.get(globalThis, "process");
  const env: unknown = isRecord(maybeProcess) ? maybeProcess["env"] : undefined;
  return isRecord(env) && env["NODE_ENV"] === "production";
};

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
