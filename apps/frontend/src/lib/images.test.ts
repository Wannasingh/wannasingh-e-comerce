import { describe, it, expect } from "vitest";

import { getStableImageUrl } from "./images";

describe("getStableImageUrl", () => {
  it("should return empty string for empty input", () => {
    expect(getStableImageUrl("")).toBe("");
  });

  it("should return original URL if it does not contain loremflickr.com", () => {
    const url = "https://example.com/image.jpg";
    expect(getStableImageUrl(url)).toBe(url);
  });

  it("should map loremflickr.com with random query param to a stable Google CDN image", () => {
    const url = "https://loremflickr.com/320/240?random=TECH-1";
    const result1 = getStableImageUrl(url);
    expect(result1).toContain("googleusercontent.com");

    const result2 = getStableImageUrl(url);
    expect(result2).toBe(result1); // Stable mapping
  });

  it("should fallback to original URL if loremflickr URL does not have valid random format", () => {
    const url = "https://loremflickr.com/320/240";
    expect(getStableImageUrl(url)).toBe(url);
  });
});
