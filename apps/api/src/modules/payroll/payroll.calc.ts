// Cálculo de nóminas (Régimen General, ejercicio 2026). Funciones puras, sin dependencias de Nest,
// para poder probarlas sin base de datos. El resultado es orientativo: no aplica convenios ni
// bonificaciones, no calcula AT/EP y el IRPF se puede editar en cada nómina.
//
// Fuentes:
//  - Cotización: Orden PJC/297/2026, de 30 de marzo (BOE-A-2026-7296),
//    https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7296 — topes, bases mínimas, MEI y
//    cotización de solidaridad fijados por el art. 3 del Real Decreto-ley 3/2026.
//  - IRPF: AEAT, "Algoritmo de cálculo del tipo de retención a cuenta del IRPF para los
//    rendimientos del trabajo personal, ejercicio 2026 (a partir de 10 de septiembre)",
//    https://sede.agenciatributaria.gob.es/static_files/Sede/Programas_ayuda/Retenciones/2026/Algoritmo%20Retenciones-2026_10sept.pdf

export type ContractType = "INDEFINIDO" | "TEMPORAL" | "PRACTICAS" | "AUTONOMO" | "OBRA_SERVICIO";

interface Rate { employer: number; employee: number } // en %

// ── Seguridad Social 2026 ──────────────────────────────────────────────────────

// Orden PJC/297/2026, art. 2.1 y art. 3: tope máximo, 5.101,20 €/mes en todos los grupos
export const SS_MAX_BASE = 5101.20;

// Orden PJC/297/2026, art. 3: bases mínimas. Grupos 1-7 en €/mes; grupos 8-11, 47,48 €/día
// (× 30 días = 1.424,40 €/mes para retribución mensual)
const SS_MIN_BASE_BY_GROUP: Record<number, number> = {
  1: 1989.30,
  2: 1649.70,
  3: 1435.20,
  4: 1424.40, 5: 1424.40, 6: 1424.40, 7: 1424.40,
  8: 1424.40, 9: 1424.40, 10: 1424.40, 11: 1424.40,
};
// Sin grupo asignado se usa la base mínima más baja (grupos 4-7)
const SS_DEFAULT_MIN_BASE = 1424.40;

// Orden PJC/297/2026, art. 4.a): contingencias comunes 28,30 %
const SS_COMMON: Rate = { employer: 23.60, employee: 4.70 };
// Orden PJC/297/2026, art. 16: mecanismo de equidad intergeneracional 0,90 % sobre la base de CC
const SS_MEI: Rate = { employer: 0.75, employee: 0.15 };
// Orden PJC/297/2026, art. 33.2.a).1.º: desempleo 7,05 % — indefinidos, formativos, relevo, sustitución
const SS_UNEMPLOYMENT_INDEFINITE: Rate = { employer: 5.50, employee: 1.55 };
// Orden PJC/297/2026, art. 33.2.a).2.º: desempleo 8,30 % — duración determinada
const SS_UNEMPLOYMENT_TEMPORARY: Rate = { employer: 6.70, employee: 1.60 };
// Orden PJC/297/2026, art. 33.2.b): FOGASA 0,20 % a cargo de la empresa
const SS_FOGASA: Rate = { employer: 0.20, employee: 0 };
// Orden PJC/297/2026, art. 33.2.c): formación profesional 0,70 %
const SS_TRAINING: Rate = { employer: 0.60, employee: 0.10 };
// Orden PJC/297/2026, art. 5: horas extraordinarias no motivadas por fuerza mayor, 28,30 %
const SS_OVERTIME: Rate = { employer: 23.60, employee: 4.70 };
// Orden PJC/297/2026, art. 17.1: cotización adicional de solidaridad sobre la retribución que excede la base máxima
const SS_SOLIDARITY: Array<Rate & { upTo: number }> = [
  { upTo: 5611.32, employer: 0.96, employee: 0.19 },  // 1,15 % hasta 5.611,32 €
  { upTo: 7651.80, employer: 1.04, employee: 0.21 },  // 1,25 % hasta 7.651,80 €
  { upTo: Infinity, employer: 1.22, employee: 0.24 }, // 1,46 % por encima
];

// ── IRPF 2026 (algoritmo AEAT) ─────────────────────────────────────────────────

// Algoritmo AEAT 2026, tabla 2 "Escala de retención" (art. 101.1 LIRPF)
const IRPF_SCALE = [
  { limit: 12450,    rate: 19 },
  { limit: 20200,    rate: 24 },
  { limit: 35200,    rate: 30 },
  { limit: 60000,    rate: 37 },
  { limit: 300000,   rate: 45 },
  { limit: Infinity, rate: 47 },
];
// Algoritmo AEAT 2026, "Mínimo personal y familiar", A1: mínimo del contribuyente
const IRPF_PERSONAL_MINIMUM = 5550;
// Algoritmo AEAT 2026, "Cálculo de los gastos deducibles", A: otros gastos con carácter general
const IRPF_OTHER_EXPENSES = 2000;
// Algoritmo AEAT 2026, tabla 1 (art. 81 RIRPF): límite excluyente de retención, situación 3 sin descendientes.
// No guardamos situación familiar ni descendientes, así que se usa la situación 3 sin hijos.
const IRPF_EXEMPT_LIMIT = 15876;
// Algoritmo AEAT 2026, "Límite del 43 %" (art. 85.3 RIRPF): solo si la retribución no supera 35.200 €
const IRPF_CAP_MAX_RETRIB = 35200;
const IRPF_CAP_RATE = 0.43;
// Algoritmo AEAT 2026, "Límites generales mínimos": 2 % en contratos de duración inferior al año
const IRPF_MIN_RATE_SHORT_CONTRACT = 2;

// ── Utilidades ─────────────────────────────────────────────────────────────────

// Pasar por toFixed(6) quita el ruido de coma flotante (66,975 * 100 = 6697,4999…) antes de redondear
function cents(n: number): number {
  return Number((n * 100).toFixed(6));
}

// Redondeo al céntimo, 0,005 sube a 0,01 (REDONDEAR1 del algoritmo AEAT)
export function round2(n: number): number {
  return Math.round(cents(n)) / 100;
}

// Algoritmo AEAT: TRUNCAR, trunca el tipo en el segundo decimal (17,85964523 → 17,85)
function truncate2(n: number): number {
  return Math.floor(cents(n)) / 100;
}

function pct(amount: number, ratePct: number): number {
  return round2((amount * ratePct) / 100);
}

export function isTemporaryContract(contractType?: ContractType | null): boolean {
  return contractType === "TEMPORAL" || contractType === "OBRA_SERVICIO";
}

export function minBaseForGroup(group?: string | null): number {
  const n = parseInt(String(group ?? "").replace(/\D/g, ""), 10);
  return SS_MIN_BASE_BY_GROUP[n] ?? SS_DEFAULT_MIN_BASE;
}

// ── Seguridad Social ───────────────────────────────────────────────────────────

export interface SocialSecurityInput {
  // Retribución del mes que cotiza por contingencias comunes (salario + complementos + dietas sujetas)
  ordinaryPay: number;
  overtimePay?: number;
  contractType?: ContractType | null;
  contributionGroup?: string | null;
  // A tiempo parcial la Orden fija bases mínimas por hora (art. 38): no se aplica la mínima mensual
  partTime?: boolean;
}

export interface SocialSecurityLine {
  concept: "common" | "mei" | "unemployment" | "fogasa" | "training" | "overtime" | "solidarity";
  base: number;
  employeeRate: number;
  employerRate: number;
  employee: number;
  employer: number;
}

export interface SocialSecurityResult {
  commonBase: number;       // base de contingencias comunes (y MEI)
  professionalBase: number; // base de desempleo, FOGASA y FP (incluye horas extra)
  ssEmployeeRate: number;   // tipo nominal del trabajador (fracción, p. ej. 0.065)
  ssEmployerRate: number;   // tipo nominal de la empresa sin AT/EP (fracción)
  ssEmployee: number;
  ssEmployer: number;
  lines: SocialSecurityLine[];
}

export function computeSocialSecurity(input: SocialSecurityInput): SocialSecurityResult {
  const ordinaryPay = Math.max(0, input.ordinaryPay);
  const overtimePay = Math.max(0, input.overtimePay ?? 0);
  const minBase = input.partTime ? 0 : minBaseForGroup(input.contributionGroup);
  const clamp = (n: number) => round2(Math.min(SS_MAX_BASE, Math.max(minBase, n)));

  // Las horas extra no entran en la base de contingencias comunes (cotizan aparte, art. 5)
  // pero sí en la de contingencias profesionales, que es la de desempleo, FOGASA y FP (art. 33.1)
  const commonBase = clamp(ordinaryPay);
  const professionalBase = clamp(ordinaryPay + overtimePay);
  const unemployment = isTemporaryContract(input.contractType)
    ? SS_UNEMPLOYMENT_TEMPORARY
    : SS_UNEMPLOYMENT_INDEFINITE;

  const line = (concept: SocialSecurityLine["concept"], base: number, rate: Rate): SocialSecurityLine => ({
    concept,
    base,
    employeeRate: rate.employee,
    employerRate: rate.employer,
    employee: pct(base, rate.employee),
    employer: pct(base, rate.employer),
  });

  const lines = [
    line("common", commonBase, SS_COMMON),
    line("mei", commonBase, SS_MEI),
    line("unemployment", professionalBase, unemployment),
    line("fogasa", professionalBase, SS_FOGASA),
    line("training", professionalBase, SS_TRAINING),
  ];
  if (overtimePay > 0) lines.push(line("overtime", round2(overtimePay), SS_OVERTIME));

  // Solidaridad: por tramos sobre la retribución que supera la base máxima
  let prev = SS_MAX_BASE;
  const pay = ordinaryPay + overtimePay;
  for (const tier of SS_SOLIDARITY) {
    if (pay <= prev) break;
    const inTier = round2(Math.min(pay, tier.upTo) - prev);
    lines.push(line("solidarity", inTier, tier));
    prev = tier.upTo;
  }

  const nominal = [SS_COMMON, SS_MEI, unemployment, SS_FOGASA, SS_TRAINING];
  return {
    commonBase,
    professionalBase,
    ssEmployeeRate: round2(nominal.reduce((s, r) => s + r.employee, 0)) / 100,
    ssEmployerRate: round2(nominal.reduce((s, r) => s + r.employer, 0)) / 100,
    ssEmployee: round2(lines.reduce((s, l) => s + l.employee, 0)),
    ssEmployer: round2(lines.reduce((s, l) => s + l.employer, 0)),
    lines,
  };
}

// ── IRPF ───────────────────────────────────────────────────────────────────────

function irpfScale(base: number): number {
  let tax = 0;
  let prev = 0;
  for (const bracket of IRPF_SCALE) {
    if (base <= prev) break;
    tax += (Math.min(base, bracket.limit) - prev) * bracket.rate / 100;
    prev = bracket.limit;
  }
  return round2(tax);
}

// Algoritmo AEAT 2026, "Reducción por obtención de rendimientos del trabajo" (art. 20 LIRPF, RDL 4/2024)
function workIncomeReduction(netIncome: number): number {
  if (netIncome <= 14852) return 7302;
  if (netIncome <= 17673.52) return round2(7302 - 1.75 * (netIncome - 14852));
  if (netIncome < 19747.5) return round2(2364.34 - 1.14 * (netIncome - 17673.52));
  return 0;
}

export interface IRPFInput {
  annualGross: number;     // retribución íntegra anual prevista (RETRIB)
  annualSS: number;        // cotizaciones anuales del trabajador (COTIZACIONES)
  shortContract?: boolean; // contrato de duración inferior al año
}

// Tipo de retención en % siguiendo el algoritmo de la AEAT para situación familiar 3, sin
// descendientes, menor de 65 años, sin discapacidad ni movilidad geográfica.
export function calculateIRPFRate({ annualGross, annualSS, shortContract }: IRPFInput): number {
  const retrib = Math.max(0, annualGross);
  let quota = 0;

  if (retrib > IRPF_EXEMPT_LIMIT) {
    const netIncome = Math.max(0, retrib - annualSS);
    const otherExpenses = Math.min(IRPF_OTHER_EXPENSES, netIncome);
    const base = Math.max(0, netIncome - otherExpenses - workIncomeReduction(netIncome));

    quota = Math.max(0, irpfScale(base) - irpfScale(IRPF_PERSONAL_MINIMUM));
    if (retrib <= IRPF_CAP_MAX_RETRIB) {
      quota = Math.min(quota, (retrib - IRPF_EXEMPT_LIMIT) * IRPF_CAP_RATE);
    }
  }

  let rate = retrib > 0 ? truncate2((quota / retrib) * 100) : 0;
  // El algoritmo aplica el mínimo del 2 % también cuando la retribución está por debajo del límite excluyente
  if (shortContract && rate < IRPF_MIN_RATE_SHORT_CONTRACT) rate = IRPF_MIN_RATE_SHORT_CONTRACT;
  return rate;
}

// ── Nómina mensual ─────────────────────────────────────────────────────────────

export interface PayrollEmployeeContext {
  contractType?: ContractType | null;
  contributionGroup?: string | null;
  partTime?: boolean;
  shortContract?: boolean;
}

export interface PayrollOverrides {
  overtimePay?: number;
  bonuses?: number;
  otherDeductions?: number;
  irpfRate?: number;
  expenseReimbursement?: number;
  taxableAllowances?: number;
}

// monthlySalary: salario bruto mensual con las pagas extra prorrateadas (salario anual / 12)
export function computePayroll(monthlySalary: number, employee: PayrollEmployeeContext = {}, overrides?: PayrollOverrides) {
  const baseSalary = round2(monthlySalary);
  const overtimePay = round2(overrides?.overtimePay ?? 0);
  const bonuses = round2(overrides?.bonuses ?? 0);
  const taxableAllowances = round2(overrides?.taxableAllowances ?? 0);
  const expenseReimbursement = round2(overrides?.expenseReimbursement ?? 0);
  const grossSalary = round2(baseSalary + overtimePay + bonuses + taxableAllowances);

  const ssInput = {
    contractType: employee.contractType,
    contributionGroup: employee.contributionGroup,
    partTime: employee.partTime,
  };
  const ss = computeSocialSecurity({ ...ssInput, ordinaryPay: baseSalary + bonuses + taxableAllowances, overtimePay });

  let irpfRate = overrides?.irpfRate;
  if (irpfRate === undefined) {
    // Retribución anual prevista: el salario fijo de 12 meses y lo variable de este mes una sola vez
    const fixedSS = computeSocialSecurity({ ...ssInput, ordinaryPay: baseSalary }).ssEmployee;
    irpfRate = calculateIRPFRate({
      annualGross: baseSalary * 12 + (grossSalary - baseSalary),
      annualSS: fixedSS * 12 + (ss.ssEmployee - fixedSS),
      shortContract: employee.shortContract,
    });
  }

  const irpfAmount = round2(grossSalary * (irpfRate / 100));
  const otherDeductions = round2(overrides?.otherDeductions ?? 0);
  const netSalary = round2(grossSalary - ss.ssEmployee - irpfAmount - otherDeductions + expenseReimbursement);
  const totalCost = round2(grossSalary + ss.ssEmployer);

  return {
    baseSalary,
    overtimePay,
    bonuses,
    taxableAllowances,
    expenseReimbursement,
    grossSalary,
    ssEmployeeRate: ss.ssEmployeeRate,
    ssEmployerRate: ss.ssEmployerRate,
    ssEmployee: ss.ssEmployee,
    ssEmployer: ss.ssEmployer,
    irpfRate,
    irpfAmount,
    otherDeductions,
    netSalary,
    totalCost,
  };
}
