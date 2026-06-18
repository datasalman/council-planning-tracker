import { test } from "node:test";
import assert from "node:assert/strict";
import { inDateWindow } from "./index";

const FROM = "2026-05-19";
const TO = "2026-06-18";

// The window is inclusive of both ends. The boundary-day cases are the point:
// an Idox date parses to local midnight, so during BST the first day used to
// fall an hour short of a UTC-midnight bound and get dropped.

test("keeps an application received on the first day of the window", () => {
  assert.equal(inDateWindow("19 May 2026", FROM, TO), true);
});

test("keeps an application received on the last day of the window", () => {
  assert.equal(inDateWindow("18 Jun 2026", FROM, TO), true);
});

test("keeps a day inside the window", () => {
  assert.equal(inDateWindow("2 Jun 2026", FROM, TO), true);
});

test("drops a day before the window", () => {
  assert.equal(inDateWindow("18 May 2026", FROM, TO), false);
});

test("drops a day after the window", () => {
  assert.equal(inDateWindow("19 Jun 2026", FROM, TO), false);
});

test("keeps an application with no received date", () => {
  assert.equal(inDateWindow("", FROM, TO), true);
});

test("keeps an application whose received date won't parse", () => {
  assert.equal(inDateWindow("not a date", FROM, TO), true);
});
