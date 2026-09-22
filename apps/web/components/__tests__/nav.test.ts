import { describe, it, expect } from "vitest";

describe("frontend build artifacts", () => {
  it("route manifest includes expected app routes", () => {
    const fs = require("fs");
    const path = require("path");
    const manifestPath = path.resolve(
      __dirname,
      "../../.next/app-build-manifest.json",
    );
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(Object.keys(manifest.routes || {}).length).toBeGreaterThan(0);
  });
});
