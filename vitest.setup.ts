import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

class ResizeObserverStub implements ResizeObserver {
  // jsdom has no ResizeObserver; React Flow requires it for layout measurement.
  observe(): void {
    return;
  }

  unobserve(): void {
    return;
  }

  disconnect(): void {
    return;
  }
}

globalThis.ResizeObserver = ResizeObserverStub;

afterEach(() => {
  cleanup();
});
