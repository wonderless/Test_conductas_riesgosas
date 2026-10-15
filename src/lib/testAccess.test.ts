import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  evaluarAccesoAlTest,
  permiteEntrarAlTest,
  progresoDeActividades,
  type TestUserData,
} from "@/lib/testAccess";
import { getRecommendationsForMode, type Answers } from "@/lib/scoring";
import { MODES, modeQuestions, questions } from "@/constants/questions";
import { catalogoDePrueba } from "@/test/catalogoDePrueba";

// El catálogo real está vacío hasta que llegue el programa. Aquí se sustituye
// por uno que cada prueba puede llenar o vaciar: por defecto lleva una
// recomendación de mentira por ítem.
const catalogo = vi.hoisted(() => ({}) as Record<string, unknown[]>);
vi.mock("@/constants/recommendations", () => ({ allRecommendations: catalogo }));

beforeEach(() => {
  Object.assign(catalogo, catalogoDePrueba());
});

const fecha = (iso: string) => ({ toDate: () => new Date(iso) });

// Todo en 0: los seis dominios salen BAJO y ningún ítem abre actividades.
const sinRiesgo = (): Answers =>
  Object.fromEntries(questions.map((q) => [q.id, 0]));

// Deja el dominio de sustancias en ALTO con sus cuatro ítems en 4, que abren
// sus cuatro recomendaciones.
const sustanciasEnAlto = (): Answers => {
  const answers = sinRiesgo();
  for (const num of modeQuestions.sustancias) answers[num] = 4;
  return answers;
};

// Progreso con las cuatro recomendaciones de sustancias marcadas como
// completadas, tal y como lo escribe ResultsDisplay.completeActivity.
const progresoCompletoDeSustancias = (answers: Answers) => {
  const recs = getRecommendationsForMode("sustancias", "ALTO", answers);
  const porId: Record<string, { isCompleted: boolean }> = {};
  for (const rec of recs) porId[rec.id] = { isCompleted: true };
  return { sustancias: { recommendationProgress: porId } };
};

describe("evaluarAccesoAlTest", () => {
  it("deja entrar a quien no tiene expediente todavía", () => {
    const estado = evaluarAccesoAlTest(undefined);
    expect(estado.tipo).toBe("sin-intento");
    expect(permiteEntrarAlTest(estado)).toBe(true);
  });

  it("deja entrar a quien tiene expediente pero no ha hecho el test", () => {
    const estado = evaluarAccesoAlTest({});
    expect(estado.tipo).toBe("sin-intento");
    expect(permiteEntrarAlTest(estado)).toBe(true);
  });

  it("no ofrece segundo intento a quien no tiene ningún dominio en riesgo", () => {
    const estado = evaluarAccesoAlTest({
      answers: sinRiesgo(),
      lastTestDate: fecha("2020-01-01"),
    });

    expect(estado.tipo).toBe("sin-actividades-asignadas");
    expect(permiteEntrarAlTest(estado)).toBe(false);
  });

  it("sin programa cargado, un dominio en riesgo no abre el segundo intento", () => {
    // Con el catálogo vacío el plan tiene 0 actividades y 0 completadas. Contar
    // eso como "todas completadas" abría el segundo intento en el acto, sin
    // ninguna intervención que medir.
    for (const mode of MODES) catalogo[mode] = [];

    const estado = evaluarAccesoAlTest({
      answers: sustanciasEnAlto(),
      lastTestDate: fecha("2026-10-01"),
    });

    expect(estado.tipo).toBe("sin-actividades-asignadas");
    expect(permiteEntrarAlTest(estado)).toBe(false);
    expect(progresoDeActividades({ answers: sustanciasEnAlto() })).toEqual({
      completadas: 0,
      total: 0,
      tieneDominiosEnRiesgo: true,
    });
  });

  it("bloquea mientras queden actividades, por mucho tiempo que haya pasado", () => {
    const estado = evaluarAccesoAlTest({
      answers: sustanciasEnAlto(),
      lastTestDate: fecha("2020-01-01"),
    });

    expect(estado.tipo).toBe("actividades-pendientes");
    if (estado.tipo === "actividades-pendientes") {
      expect(estado.completadas).toBe(0);
      expect(estado.total).toBe(4);
    }
    expect(permiteEntrarAlTest(estado)).toBe(false);
  });

  it("sigue bloqueando si falta una sola actividad", () => {
    const answers = sustanciasEnAlto();
    const progreso = progresoCompletoDeSustancias(answers);
    const ids = Object.keys(progreso.sustancias.recommendationProgress);
    progreso.sustancias.recommendationProgress[ids[0]] = { isCompleted: false };

    const estado = evaluarAccesoAlTest({
      answers,
      lastTestDate: fecha("2026-09-01"),
      recommendationProgress: progreso,
    });

    expect(estado.tipo).toBe("actividades-pendientes");
    if (estado.tipo === "actividades-pendientes") {
      expect(estado.completadas).toBe(3);
      expect(estado.total).toBe(4);
    }
  });

  it("permite repetir en cuanto se completan todas, sin ninguna espera", () => {
    const answers = sustanciasEnAlto();

    const estado = evaluarAccesoAlTest({
      answers,
      // Mismo día en que hizo el test: no hay plazo que cumplir.
      lastTestDate: fecha(new Date().toISOString()),
      recommendationProgress: progresoCompletoDeSustancias(answers),
    });

    expect(estado.tipo).toBe("puede-repetir");
    expect(permiteEntrarAlTest(estado)).toBe(true);
  });

  it("cuenta las actividades de todos los dominios en riesgo, no solo del primero", () => {
    // Sustancias en 4 y además finanzas entero en 4: cinco ítems más.
    const answers = sustanciasEnAlto();
    for (const num of modeQuestions.finanzas) answers[num] = 4;

    const { total, tieneDominiosEnRiesgo } = progresoDeActividades({ answers });
    expect(tieneDominiosEnRiesgo).toBe(true);
    expect(total).toBe(
      modeQuestions.sustancias.length + modeQuestions.finanzas.length
    );
  });
});

describe("el segundo intento", () => {
  const baseConSegundo = (): TestUserData => {
    const answers = sustanciasEnAlto();
    return {
      answers,
      lastTestDate: fecha("2026-08-01"),
      recommendationProgress: progresoCompletoDeSustancias(answers),
      hasRetakenTest: true,
    };
  };

  it("deja continuar un segundo intento autorizado y aún sin enviar", () => {
    const estado = evaluarAccesoAlTest(baseConSegundo());
    expect(estado.tipo).toBe("segundo-intento-en-curso");
    expect(permiteEntrarAlTest(estado)).toBe(true);
  });

  it("cierra el acceso cuando el segundo intento ya se envió", () => {
    const estado = evaluarAccesoAlTest({
      ...baseConSegundo(),
      answers2: sinRiesgo(),
      lastTestDate2: fecha("2026-09-01"),
    });

    expect(estado.tipo).toBe("sin-intentos-restantes");
    expect(permiteEntrarAlTest(estado)).toBe(false);
  });

  it("mide las actividades del intento vigente, no las del primero", () => {
    // En el segundo intento no queda ningún dominio en riesgo: nada que hacer.
    const { total, tieneDominiosEnRiesgo } = progresoDeActividades({
      ...baseConSegundo(),
      answers2: sinRiesgo(),
    });

    expect(tieneDominiosEnRiesgo).toBe(false);
    expect(total).toBe(0);
  });
});
