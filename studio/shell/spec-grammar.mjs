// The prism/spec/1 grammar a device model is held to while it writes an app's rules: one compact spec in a
// <dyad-spec> block, keys in a fixed order (title, purpose, fields, outcomes, rules, otherwise, properties,
// examples). A condition names a declared field, with an operator of that field's kind and, for a choice,
// one of its values; every answer is one of the declared outcomes; an example's request is the fields in
// order. The grammar fixes form, never meaning: which fields, rules and answers the request needs is the
// model's, and the checker and the approval card still judge them.
//   check(text) -> "fail" (no spec starts with text), "partial" (some does), "done" (text is a whole spec)
export const GRAMMAR_ID = "prism-spec-1/device-1";
const END = { end: true }, FAIL = { fail: true };
const NUM_OPS = ["<", "<=", ">", ">=", "=", "!="], CHOICE_OPS = ["is", "is not"];
const RESERVED = new Set(["invalid", "never", "always"]);
const isLow = (c) => c >= "a" && c <= "z", isDig = (c) => c >= "0" && c <= "9";

export function check(text) {
  let i = 0;
  const n = text.length;
  const peek = () => { if (i >= n) throw END; return text[i]; };
  const lit = (s) => { for (let k = 0; k < s.length; k++) { if (i >= n) throw END; if (text[i] !== s[k]) throw FAIL; i++; } };
  const str = (ok, max, done) => {
    lit('"'); let s = "";
    for (;;) {
      const c = peek();
      if (c === '"') { if (!done(s)) throw FAIL; i++; return s; }
      if (s.length >= max || !ok(c, s)) throw FAIL;
      s += c; i++;
    }
  };
  const oneOf = (list) => str((c, s) => list.some((w) => w.startsWith(s + c)), 64, (s) => list.includes(s));
  const word = () => str((c, s) => (s ? isLow(c) || isDig(c) || c === "-" : isLow(c)), 24, (s) => s.length > 0 && !s.endsWith("-") && !RESERVED.has(s));
  const name = () => str((c, s) => (s ? isLow(c) || isDig(c) : isLow(c)), 24, (s) => s.length > 0);
  const prose = (max) => str((c) => c >= " " && c <= "~" && c !== "\\", max, (s) => s.trim().length > 0);
  const int = () => {
    let s = "";
    for (;;) {
      if (i >= n) throw END;
      const c = text[i];
      if (!isDig(c)) break;
      if (s === "0" || s.length >= 6) throw FAIL;
      s += c; i++;
    }
    if (!s) throw FAIL;
    return +s;
  };
  const list = (item, min, max, empty = false) => {
    if (empty && peek() === "]") { i++; return 0; }
    let k = 0;
    for (;;) {
      item(); k++;
      const c = peek();
      if (c === ",") { if (k >= max) throw FAIL; i++; continue; }
      if (c === "]") { if (k < min) throw FAIL; i++; return k; }
      throw FAIL;
    }
  };
  const fields = [], outcomes = [];
  const field = () => {
    lit('{"name":');
    const nm = name();
    if (fields.some((f) => f.name === nm)) throw FAIL;
    lit(',"kind":');
    const f = { name: nm, kind: oneOf(["number", "choice"]), values: [] };
    if (f.kind === "number") { lit(',"min":'); f.min = int(); lit(',"max":'); f.max = int(); if (f.max < f.min) throw FAIL; }
    else { lit(',"values":['); list(() => { const v = word(); if (f.values.includes(v)) throw FAIL; f.values.push(v); }, 2, 32); }
    lit("}");
    fields.push(f);
  };
  const cond = () => {
    lit('{"field":');
    const nm = oneOf(fields.map((g) => g.name));
    const f = fields.find((x) => x.name === nm);
    lit(',"op":');
    oneOf(f.kind === "number" ? NUM_OPS : CHOICE_OPS);
    lit(',"value":');
    if (f.kind === "number") int(); else oneOf(f.values);
    lit("}");
  };
  const answer = () => oneOf(outcomes);
  // An example's request: each field's value in order, separated by single spaces.
  const request = () => {
    lit('"');
    for (let k = 0; k < fields.length; k++) {
      if (k) lit(" ");
      const f = fields[k];
      if (f.kind === "number") int();
      else { let s = ""; for (;;) { const c = peek(); if (c === " " || c === '"') break; if (!f.values.some((v) => v.startsWith(s + c))) throw FAIL; s += c; i++; } if (!f.values.includes(s)) throw FAIL; }
    }
    lit('"');
  };
  try {
    lit('<dyad-spec>{"title":'); prose(60);
    lit(',"purpose":'); prose(200);
    lit(',"fields":['); list(field, 1, 8);
    lit(',"outcomes":['); list(() => { const w = word(); if (outcomes.includes(w)) throw FAIL; outcomes.push(w); }, 2, 16);
    lit(',"rules":['); list(() => { lit('{"when":['); list(cond, 1, 8); lit(',"then":'); answer(); lit("}"); }, 1, 24);
    lit(',"otherwise":'); answer();
    lit(',"properties":['); list(() => { lit('{"kind":'); oneOf(["never", "always"]); lit(',"when":['); list(cond, 1, 8); lit(',"then":'); answer(); lit("}"); }, 1, 6, true);
    lit(',"examples":['); list(() => { lit('{"request":'); request(); lit(',"response":'); answer(); lit("}"); }, 1, 4, true);
    lit("}</dyad-spec>");
    return i === n ? "done" : "fail";
  } catch (e) {
    if (e === END) return "partial";
    if (e === FAIL) return "fail";
    throw e;
  }
}
