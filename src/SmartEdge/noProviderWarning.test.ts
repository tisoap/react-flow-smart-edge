import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  warnOnceNoProvider,
  __resetNoProviderWarning,
} from "./noProviderWarning";

describe("warnOnceNoProvider", () => {
  beforeEach(() => {
    __resetNoProviderWarning();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    __resetNoProviderWarning();
  });

  it("warns once in development and stays silent on repeat calls", () => {
    warnOnceNoProvider();
    warnOnceNoProvider();

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain(
      "SmartEdgeProvider",
    );
  });

  it("warns again after the reset hook is called", () => {
    warnOnceNoProvider();
    __resetNoProviderWarning();
    warnOnceNoProvider();

    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it("stays silent in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    warnOnceNoProvider();

    expect(console.warn).not.toHaveBeenCalled();
  });

  it("warns when there is no process global (browser ESM)", () => {
    vi.stubGlobal("process", undefined);

    warnOnceNoProvider();

    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
