import { test } from "node:test";
import assert from "node:assert/strict";
import { viewportParams } from "../public/api.js";
const bounds = (west, east, south = -4, north = -3) => ({
  getWest: () => west,
  getEast: () => east,
  getSouth: () => south,
  getNorth: () => north,
});
test("normaliza mapa cruzando antimeridiano e limita latitudes", () => {
  const result = Object.fromEntries(viewportParams(bounds(170, 190, -95, 95)));
  assert.deepEqual(result, {
    west: "170",
    east: "-170",
    south: "-90",
    north: "90",
  });
});
test("mapa exibindo o mundo todo consulta longitude completa", () => {
  assert.deepEqual(Object.fromEntries(viewportParams(bounds(-220, 220))), {
    west: "-180",
    east: "180",
    south: "-4",
    north: "-3",
  });
});
