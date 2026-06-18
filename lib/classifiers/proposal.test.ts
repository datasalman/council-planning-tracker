import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyProposal } from "./proposal";

// The classifier matches on whole words, so these cases lock in the behaviour
// that the earlier naive substring matcher got wrong: short use-class codes
// leaking into addresses, "erection of" swallowing every extension as a new
// build, and plurals being missed.

test("tags a straightforward loft conversion", () => {
  const tags = classifyProposal("Loft conversion with rear dormer to dwellinghouse");
  assert.ok(tags.includes("Loft Conversions"));
  assert.ok(tags.includes("Dormer Windows"));
});

test("carries multiple tags for combined works", () => {
  const tags = classifyProposal(
    "Two storey rear extension and loft conversion to single dwelling"
  );
  assert.ok(tags.includes("Two-Storey Extensions"));
  assert.ok(tags.includes("Rear Extensions"));
  assert.ok(tags.includes("Loft Conversions"));
});

test("matches plurals as well as singulars", () => {
  const tags = classifyProposal("Single storey rear extensions to two properties");
  assert.ok(tags.includes("Rear Extensions"));
});

test("'erection of' an extension is not mistaken for a new build", () => {
  const tags = classifyProposal("Erection of a single storey rear extension");
  assert.ok(tags.includes("Rear Extensions"));
  assert.ok(!tags.includes("New Build"), "should not tag New Build");
});

test("a genuine new build is tagged", () => {
  const tags = classifyProposal("Erection of 4 new dwellings with associated parking");
  assert.ok(tags.includes("New Build"));
});

test("a road reference does not trigger a commercial use-class tag", () => {
  const tags = classifyProposal("New vehicular access onto the A12 trunk road");
  assert.ok(!tags.includes("Commercial / Mixed Use"), "A12 must not read as class A1");
});

test("a real use-class change is tagged commercial", () => {
  const tags = classifyProposal("Change of use from Class A1 retail to restaurant");
  assert.ok(tags.includes("Commercial / Mixed Use"));
  assert.ok(tags.includes("Change of Use"));
});

test("'publication' does not match the 'pub' keyword", () => {
  const tags = classifyProposal("Publication of a notice in the local press");
  assert.ok(!tags.includes("Commercial / Mixed Use"));
});

test("a studio flat is not tagged as a garden structure", () => {
  const tags = classifyProposal("Conversion of dwelling into two self-contained studio flats");
  assert.ok(!tags.includes("Garage / Outbuilding / Garden Structure"));
});

test("a garage conversion reads as a change of use", () => {
  const tags = classifyProposal("Conversion of garage into habitable room");
  assert.ok(tags.includes("Change of Use"));
});

test("tree work is still classified, just low priority", () => {
  const tags = classifyProposal("Crown reduction of an oak protected by a TPO");
  assert.ok(tags.includes("Trees & Hedgerows (TPO)"));
});

test("falls back to Other/Unclassified when nothing matches", () => {
  assert.deepEqual(classifyProposal("Variation of a planning obligation"), [
    "Other/Unclassified",
  ]);
  assert.deepEqual(classifyProposal(""), ["Other/Unclassified"]);
});
