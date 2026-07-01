// Ejecutar con: node src/trucoReglas.test.js
"use strict";

const { resolverGanadorMano } = require("./trucoReglas");

let passed = 0;
let failed = 0;

function test(desc, bazas, manoEs, esperado) {
  const resultado = resolverGanadorMano(bazas, manoEs);
  const ok = resultado === esperado;
  if (ok) {
    passed++;
    console.log(`PASS  ${desc}`);
  } else {
    failed++;
    console.log(`FAIL  ${desc}`);
    console.log(`      esperado=${JSON.stringify(esperado)}  obtenido=${JSON.stringify(resultado)}`);
  }
}

// ─── 1 baza: siempre null ────────────────────────────────────────────
console.log("\n── 1 baza (siempre null) ──");
// Con 1 baza es imposible cerrar la mano.
test("1ª=A     → null", ["A"],     "A", null);
test("1ª=B     → null", ["B"],     "A", null);
test("1ª=parda → null", ["parda"], "A", null);

// ─── 2 bazas: cierres tempranos + casos que pasan a 3ª ───────────────
console.log("\n── 2 bazas ──");
// Regla 1: 2 ganadas reales → cierra.
test("A, A     → A   (Regla 1: 2 ganadas reales)", ["A","A"], "A", "A");
test("B, B     → B   (Regla 1: 2 ganadas reales)", ["B","B"], "A", "B");
// Regla 2: gana 1ª + parda 2ª → cierra a favor del ganador de 1ª.
test("A, parda → A   (Regla 2: gana 1ª + parda 2ª → cierra)", ["A","parda"], "A", "A");
test("B, parda → B   (Regla 2: gana 1ª + parda 2ª → cierra)", ["B","parda"], "A", "B");
// Regla 3: parda 1ª + gana 2ª → cierra a favor del ganador de 2ª.
test("parda, A → A   (Regla 3: parda 1ª + gana 2ª → cierra)", ["parda","A"], "A", "A");
test("parda, B → B   (Regla 3: parda 1ª + gana 2ª → cierra)", ["parda","B"], "A", "B");
// Regla 4: 1-1 → null, decide la 3ª.
test("A, B     → null (Regla 4: 1-1, decide la 3ª)", ["A","B"], "A", null);
test("B, A     → null (Regla 4: 1-1, decide la 3ª)", ["B","A"], "A", null);
// Regla 5: parda + parda → null, decide la 3ª.
test("parda,parda → null (Regla 5: doble parda, decide la 3ª)", ["parda","parda"], "A", null);

// ─── 3 bazas: b1=A (9 casos) ─────────────────────────────────────────
console.log("\n── 3 bazas, 1ª=A ──");
// Regla 1: algún bando acumula 2 ganadas reales.
test("A, A, A     → A (Regla 1: 3 ganadas)",            ["A","A","A"],      "A", "A");
test("A, A, B     → A (Regla 1: 2 ganadas en 1ª+2ª)",  ["A","A","B"],      "A", "A");
test("A, A, parda → A (Regla 1: 2 ganadas en 1ª+2ª)",  ["A","A","parda"],  "A", "A");
test("A, B, A     → A (Regla 1: 2 ganadas en 1ª+3ª)",  ["A","B","A"],      "A", "A");
test("A, B, B     → B (Regla 1: 2 ganadas en 2ª+3ª)",  ["A","B","B"],      "A", "B");
// Regla 8 (principio general): 1-1 tras 2 bazas + parda 3ª → gana 1ª baza real.
test("A, B, parda → A (Regla 8: 1-1 + parda 3ª → gana 1ª baza real = A)", ["A","B","parda"], "A", "A");
// Regla 2 cierra en 2ª: aunque se pase 3ª baza, la función devuelve A.
test("A, parda, A → A (Regla 2 cierra en 2ª; también Regla 1)",        ["A","parda","A"],      "A", "A");
test("A, parda, B → A (Regla 2 cierra en 2ª; 3ª no debería jugarse)",  ["A","parda","B"],      "A", "A");
test("A, parda,parda→A (Regla 2 cierra en 2ª)",                        ["A","parda","parda"],  "A", "A");

// ─── 3 bazas: b1=B (9 casos) ─────────────────────────────────────────
console.log("\n── 3 bazas, 1ª=B ──");
test("B, A, A     → A (Regla 1: 2 ganadas en 2ª+3ª)",  ["B","A","A"],      "A", "A");
test("B, A, B     → B (Regla 1: 2 ganadas en 1ª+3ª)",  ["B","A","B"],      "A", "B");
// Regla 8: 1-1 + parda 3ª → gana 1ª baza real = B.
test("B, A, parda → B (Regla 8: 1-1 + parda 3ª → gana 1ª baza real = B)", ["B","A","parda"], "A", "B");
test("B, B, A     → B (Regla 1: 2 ganadas en 1ª+2ª)",  ["B","B","A"],      "A", "B");
test("B, B, B     → B (Regla 1: 3 ganadas)",            ["B","B","B"],      "A", "B");
test("B, B, parda → B (Regla 1: 2 ganadas en 1ª+2ª)",  ["B","B","parda"],  "A", "B");
// Regla 2 cierra en 2ª.
test("B, parda, A → B (Regla 2 cierra en 2ª)",                         ["B","parda","A"],      "A", "B");
test("B, parda, B → B (Regla 2 cierra en 2ª; también Regla 1)",        ["B","parda","B"],      "A", "B");
test("B, parda,parda→B (Regla 2 cierra en 2ª)",                        ["B","parda","parda"],  "A", "B");

// ─── 3 bazas: b1=parda (9 casos) ─────────────────────────────────────
console.log("\n── 3 bazas, 1ª=parda ──");
test("parda, A, A     → A (Regla 1: 2 ganadas)",                ["parda","A","A"],      "A", "A");
// Regla 3 cierra en 2ª: aunque haya 3ª baza, la función devuelve el ganador de 2ª.
test("parda, A, B     → A (Regla 3 cierra en 2ª; 3ª no debería jugarse)", ["parda","A","B"],      "A", "A");
test("parda, A, parda → A (Regla 3 cierra en 2ª)",                        ["parda","A","parda"],  "A", "A");
test("parda, B, A     → B (Regla 3 cierra en 2ª)",                        ["parda","B","A"],      "A", "B");
test("parda, B, B     → B (Regla 1: 2 ganadas; también Regla 3)",         ["parda","B","B"],      "A", "B");
test("parda, B, parda → B (Regla 3 cierra en 2ª)",                        ["parda","B","parda"],  "A", "B");
// parda+parda → decide la 3ª (Regla 5/7/8).
test("parda,parda, A  → A (parda+parda → 3ª decide: A gana la 3ª)",  ["parda","parda","A"],      "A", "A");
test("parda,parda, B  → B (parda+parda → 3ª decide: B gana la 3ª)",  ["parda","parda","B"],      "A", "B");
// Regla 6: las 3 bazas son pardas → gana el mano.
test("parda,parda,parda → manoEs=A (Regla 6: 3 pardas → gana el mano)", ["parda","parda","parda"], "A", "A");

// ─── Extra: manoEs=B con 3 pardas ────────────────────────────────────
console.log("\n── Extra: manoEs=B ──");
test("parda,parda,parda con manoEs=B → B (Regla 6)", ["parda","parda","parda"], "B", "B");

// ─── Resumen ──────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${"─".repeat(52)}`);
console.log(`Total: ${total}   PASS: ${passed}   FAIL: ${failed}`);
if (failed > 0) process.exit(1);
