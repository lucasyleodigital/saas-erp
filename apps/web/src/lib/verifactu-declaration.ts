// Datos de la declaración responsable del sistema (art. 15 de la Orden HAC/1177/2024).
// Deben coincidir con SISTEMA_INFORMATICO en apps/api/src/modules/verifactu/verifactu-xml.ts.
// Cada versión nueva del sistema necesita su propia declaración: cambia version y la fecha.
export const VERIFACTU_DECLARATION = {
  nombreSistema: "YouWhole",
  idSistema: "YW",
  version: "1.0",
  soloVerifactu: true,
  multiplesObligados: true,
  productor: "Alex Lucas Torrubia",
  nif: "41003566V",
  direccion: "Carrer del Progrés, 27, buzón 28, 08850 Gavà (Barcelona), España",
  fecha: "2 de noviembre de 2026",
  lugar: "Gavà, España",
  email: "legal@youwhole.com",
  web: "https://youwhole.com",
} as const;
