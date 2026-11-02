// Casos calculados a mano con los tipos de la Orden PJC/297/2026 y el algoritmo de retenciones
// de la AEAT 2026 (ver cabecera de payroll.calc.ts). Ejecutar con: pnpm --filter @saas/api test
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { calculateIRPFRate, computePayroll, computeSocialSecurity, minBaseForGroup, round2 } from "./payroll.calc";

test("round2 redondea 0,005 hacia arriba pese a la coma flotante", () => {
  assert.equal(round2(66.975), 66.98);
  assert.equal(round2(1.425), 1.43);
  assert.equal(round2(2.1375), 2.14);
});

test("bases mínimas por grupo de cotización", () => {
  assert.equal(minBaseForGroup("01"), 1989.30);
  assert.equal(minBaseForGroup("2"), 1649.70);
  assert.equal(minBaseForGroup("03"), 1435.20);
  assert.equal(minBaseForGroup("07"), 1424.40);
  assert.equal(minBaseForGroup("10"), 1424.40); // 47,48 €/día × 30
  assert.equal(minBaseForGroup(null), 1424.40);
});

test("24.000 €/año, indefinido, grupo 5", () => {
  // Bruto mensual 2.000. SS trabajador: 94,00 CC + 3,00 MEI + 31,00 desempleo + 2,00 FP = 130,00
  // SS empresa: 472,00 CC + 15,00 MEI + 110,00 desempleo + 4,00 FOGASA + 12,00 FP = 613,00
  // IRPF: RETRIB 24.000, cotizaciones 1.560, rendimiento neto 22.440 (reducción art. 20 = 0),
  // base 22.440 - 2.000 = 20.440; cuota 4.297,50 - 1.054,50 = 3.243,00; límite 43 % = 3.493,32;
  // tipo 3.243 / 24.000 = 13,5125 % → 13,51 %; retención 2.000 × 13,51 % = 270,20
  const p = computePayroll(24000 / 12, { contractType: "INDEFINIDO", contributionGroup: "05" });
  assert.equal(p.grossSalary, 2000);
  assert.equal(p.ssEmployee, 130);
  assert.equal(p.ssEmployer, 613);
  assert.equal(p.ssEmployeeRate, 0.065);
  assert.equal(p.ssEmployerRate, 0.3065);
  assert.equal(p.irpfRate, 13.51);
  assert.equal(p.irpfAmount, 270.2);
  assert.equal(p.netSalary, 1599.8);
  assert.equal(p.totalCost, 2613);
});

test("contrato temporal: desempleo al 8,30 %", () => {
  // Trabajador: 94,00 + 3,00 + 32,00 (1,60 %) + 2,00 = 131,00
  // Empresa: 472,00 + 15,00 + 134,00 (6,70 %) + 4,00 + 12,00 = 637,00
  const p = computePayroll(2000, { contractType: "TEMPORAL", contributionGroup: "05" });
  assert.equal(p.ssEmployee, 131);
  assert.equal(p.ssEmployer, 637);
  assert.equal(p.ssEmployeeRate, 0.0655);
  assert.equal(p.ssEmployerRate, 0.3185);
});

test("17.100 €/año: reducción del art. 20 y límite del 43 %", () => {
  // Bruto 1.425. Trabajador: 66,98 + 2,14 + 22,09 + 1,43 = 92,64
  // Empresa: 336,30 + 10,69 + 78,38 + 2,85 + 8,55 = 436,77
  // IRPF: cotizaciones 1.111,68; rendimiento neto 15.988,32;
  // reducción 7.302 - 1,75 × 1.136,32 = 5.313,44; base 15.988,32 - 2.000 - 5.313,44 = 8.674,88
  // cuota 1.648,23 - 1.054,50 = 593,73 > límite (17.100 - 15.876) × 0,43 = 526,32
  // tipo 526,32 / 17.100 = 3,0779 % → 3,07 %; retención 1.425 × 3,07 % = 43,75
  const p = computePayroll(17100 / 12, { contractType: "INDEFINIDO", contributionGroup: "07" });
  assert.equal(p.ssEmployee, 92.64);
  assert.equal(p.ssEmployer, 436.77);
  assert.equal(p.irpfRate, 3.07);
  assert.equal(p.irpfAmount, 43.75);
  assert.equal(p.netSalary, 1288.61);
});

test("90.000 €/año: base topada en 5.101,20 y cotización de solidaridad", () => {
  // Bruto 7.500, base 5.101,20. Solidaridad: 510,12 en el tramo 1 y 1.888,68 en el tramo 2
  // Trabajador: 239,76 + 7,65 + 79,07 + 5,10 + 0,97 + 3,97 = 336,52
  // Empresa: 1.203,88 + 38,26 + 280,57 + 10,20 + 30,61 + 4,90 + 19,64 = 1.588,06
  // IRPF: cotizaciones 4.038,24; base 90.000 - 4.038,24 - 2.000 = 83.961,76
  // cuota 17.901,50 + 23.961,76 × 0,45 = 28.684,29 - 1.054,50 = 27.629,79; sin límite del 43 %
  // tipo 27.629,79 / 90.000 = 30,6997 % → 30,69 %; retención 7.500 × 30,69 % = 2.301,75
  const p = computePayroll(7500, { contractType: "INDEFINIDO", contributionGroup: "01" });
  assert.equal(p.ssEmployee, 336.52);
  assert.equal(p.ssEmployer, 1588.06);
  assert.equal(p.irpfRate, 30.69);
  assert.equal(p.irpfAmount, 2301.75);
  assert.equal(p.netSalary, 4861.73);

  const ss = computeSocialSecurity({ ordinaryPay: 7500, contributionGroup: "01" });
  assert.equal(ss.commonBase, 5101.2);
  const solidarity = ss.lines.filter((l) => l.concept === "solidarity");
  assert.deepEqual(solidarity.map((l) => l.base), [510.12, 1888.68]);
});

test("base mínima del grupo, salvo a tiempo parcial", () => {
  // Grupo 1 con 1.500 €: cotiza por 1.989,30 → CC trabajador 4,70 % = 93,50
  const full = computeSocialSecurity({ ordinaryPay: 1500, contributionGroup: "01" });
  assert.equal(full.commonBase, 1989.3);
  assert.equal(full.lines[0].employee, 93.5);
  const partial = computeSocialSecurity({ ordinaryPay: 1500, contributionGroup: "01", partTime: true });
  assert.equal(partial.commonBase, 1500);
});

test("horas extra: fuera de la base de CC y MEI, dentro de desempleo y FP, con su propio tipo", () => {
  // 2.000 + 200 de horas extra. Trabajador: 94,00 CC + 3,00 MEI + 34,10 desempleo (2.200)
  // + 2,20 FP (2.200) + 9,40 horas extra (4,70 % de 200) = 142,70
  const ss = computeSocialSecurity({ ordinaryPay: 2000, overtimePay: 200, contractType: "INDEFINIDO" });
  assert.equal(ss.commonBase, 2000);
  assert.equal(ss.professionalBase, 2200);
  assert.equal(ss.ssEmployee, 142.7);
});

test("IRPF: por debajo del límite excluyente no hay retención, salvo contrato inferior al año", () => {
  assert.equal(calculateIRPFRate({ annualGross: 15000, annualSS: 975 }), 0);
  assert.equal(calculateIRPFRate({ annualGross: 15876, annualSS: 1031.94 }), 0);
  assert.equal(calculateIRPFRate({ annualGross: 15000, annualSS: 975, shortContract: true }), 2);
});

test("IRPF editado a mano se respeta", () => {
  const p = computePayroll(2000, { contractType: "INDEFINIDO" }, { irpfRate: 10 });
  assert.equal(p.irpfRate, 10);
  assert.equal(p.irpfAmount, 200);
});
