import "@testing-library/jest-dom";
import { vi } from "vitest";

// make fetch globally mockable
global.fetch = vi.fn();
