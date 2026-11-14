// The spec grammar a device rules turn is held to (shell/spec-grammar.mjs).
import assert from "node:assert/strict";
import { test } from "node:test";
import { check } from "../shell/spec-grammar.mjs";
const good = '<dyad-spec>{"title":"Parking fee tier","purpose":"Decide the fee tier from hours parked and vehicle.","fields":[{"name":"hours","kind":"number","min":0,"max":24},{"name":"vehicle","kind":"choice","values":["car","motorcycle","truck"]}],"outcomes":["free","standard","premium"],"rules":[{"when":[{"field":"hours","op":"=","value":0}],"then":"free"},{"when":[{"field":"vehicle","op":"is not","value":"truck"},{"field":"hours","op":">","value":12}],"then":"premium"}],"otherwise":"standard","properties":[{"kind":"never","when":[{"field":"hours","op":"=","value":0}],"then":"premium"}],"examples":[{"request":"0 truck","response":"free"},{"request":"13 car","response":"premium"}]}</dyad-spec>';
test("a whole spec is done and every prefix of it is partial", () => {
assert.equal(check(good), "done");
for (let k = 0; k < good.length; k++) assert.equal(check(good.slice(0, k)), "partial", "prefix " + k);
const cut = (s, from, to, by) => s.slice(0, s.indexOf(from)) + by + s.slice(s.indexOf(to));
assert.equal(check(cut(good, ',"properties":', ',"examples":', ',"properties":[]')), "done");
assert.equal(check(cut(good, ',"examples":', "}</dyad-spec>", ',"examples":[]')), "done");
});
test("form the checker would refuse cannot be written", () => {
const bad = [
  good.replace('"op":"=","value":0}],"then":"free"', '"op":"is","value":0}],"then":"free"'),
  good.replace('"field":"vehicle"', '"field":"car"'),
  good.replace('"value":"truck"}', '"value":"bus"}'),
  good.replace('"then":"free"', '"then":"cheap"'),               // not a declared outcome
  good.replace('"otherwise":"standard"', '"otherwise":"never"'),
  good.replace('"request":"0 truck"', '"request":"0 bus"'),
  good.replace('"request":"0 truck"', '"request":"truck 0"'),
  good.replace('"max":24', '"max":"24"'),
  good.replace('"title":', ' "title":'),
];
for (const b of bad) assert.equal(check(b), "fail", b.slice(0, 160));
});
