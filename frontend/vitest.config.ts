import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";
// Bound DOM worker concurrency to avoid CPU starvation on developer machines.
export default mergeConfig(viteConfig, defineConfig({ test: { maxWorkers: 4 } }));
