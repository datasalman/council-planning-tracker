// Several council portals reject requests that don't look like they come from a
// web browser, so every adapter sends the same desktop-browser User-Agent. All
// requests are read-only searches of public planning registers.
export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
