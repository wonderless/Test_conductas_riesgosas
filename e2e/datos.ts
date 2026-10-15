// e2e/datos.ts
// Cuentas y datos que siembra global-setup.ts. Solo existen en los emuladores.
import { modeQuestions, questions } from "../src/constants/questions";
import type { Answers } from "../src/lib/scoring";

export const CLAVE = "Clave-e2e-123";

export const SUPERADMIN = { email: "superadmin@e2e.test" };
export const ADMIN = { email: "admin@e2e.test", codigo: "E2EADMIN" };
export const PARTICIPANTE_SEMBRADO = { email: "sembrado@e2e.test" };

export const DATOS_PERSONALES = {
  nombres: "Prueba",
  apellidos: "Extremo a Extremo",
  edad: 20,
  sexo: "Mujer",
  universidad: "Universidad de Prueba",
  carrera: "Psicología",
  ciclo: "5",
  departamento: "Lima",
};

// Etiqueta de cada opción de la escala, tal como la ve el participante y como
// la anuncia el `aria-label` de cada radio del formulario.
export const ETIQUETA_DE_PUNTAJE: Record<number, string> = {
  0: "0 Nunca",
  1: "1 Rara vez",
  2: "2 Algunas veces",
  3: "3 Casi siempre",
  4: "4 Siempre",
};

// Respuestas que dejan el dominio de sustancias en ALTO —sus cuatro ítems en
// 4— y los demás en BAJO, con todo en 0. Mientras el programa de intervención
// no esté cargado, ese dominio en riesgo no abre actividades.
export const respuestaPara = (id: number): number =>
  modeQuestions.sustancias.includes(id) ? 4 : 0;

// Las mismas respuestas en forma de documento, para sembrar directamente.
export const RESPUESTAS_SEMBRADAS: Answers = Object.fromEntries(
  questions.map((pregunta) => [pregunta.id, respuestaPara(pregunta.id)])
);

// Un participante que respondió todo con 0: ningún dominio en riesgo, ningún
// plan.
export const RESPUESTAS_SIN_RIESGO: Answers = Object.fromEntries(
  questions.map((pregunta) => [pregunta.id, 0])
);
