import { describe, expect, it, vi } from "vitest";
import {
  abreIntervencion,
  calculateModeScore,
  calculateResults,
  calculateTotal,
  getOpenRecommendations,
  getRecommendationsForMode,
  itemAbreIntervencion,
  itemsQueAbrenIntervencion,
  levelFor,
  sumAnswers,
  type Answers,
} from "@/lib/scoring";
import {
  ANSWER_OPTIONS,
  MODES,
  MODE_THRESHOLDS,
  TOTAL_THRESHOLDS,
  modeQuestions,
  questions,
} from "@/constants/questions";

// El catálogo real está vacío hasta que llegue el programa; para probar qué
// actividades se abren se usa uno de mentira con una recomendación por ítem.
vi.mock("@/constants/recommendations", async () => {
  const { catalogoDePrueba } = await import("@/test/catalogoDePrueba");
  return { allRecommendations: catalogoDePrueba() };
});

// Responde lo mismo a los 26 ítems.
const todoEn = (valor: number): Answers =>
  Object.fromEntries(questions.map((q) => [q.id, valor]));

describe("estructura del instrumento", () => {
  it("son 26 ítems repartidos entre los seis dominios sin solaparse", () => {
    expect(questions).toHaveLength(26);
    expect(MODES).toHaveLength(6);

    const repartidos = MODES.flatMap((mode) => modeQuestions[mode]);
    expect(repartidos).toHaveLength(26);
    // Sin duplicados: un ítem pertenece a un solo dominio.
    expect(new Set(repartidos).size).toBe(26);
    expect([...repartidos].sort((a, b) => a - b)).toEqual(
      questions.map((q) => q.id)
    );
  });

  it("la escala de respuesta va de 0 (nunca) a 4 (siempre)", () => {
    expect(ANSWER_OPTIONS.map((o) => o.value)).toEqual([0, 1, 2, 3, 4]);
    expect(ANSWER_OPTIONS[0].label).toBe("Nunca");
    expect(ANSWER_OPTIONS[4].label).toBe("Siempre");
  });

  it("los máximos de cada dominio son 4 puntos por ítem", () => {
    for (const mode of MODES) {
      expect(MODE_THRESHOLDS[mode].max).toBe(modeQuestions[mode].length * 4);
    }
    expect(TOTAL_THRESHOLDS.max).toBe(questions.length * 4);
  });

  it("los cortes son los de la tabla de calificación del documento", () => {
    // Dominios de 4 ítems: 0–5 / 6–11 / 12–16. De 5 ítems: 0–6 / 7–13 / 14–20.
    for (const mode of MODES) {
      const esperado =
        modeQuestions[mode].length === 5
          ? { bajoMax: 6, medioMax: 13, max: 20 }
          : { bajoMax: 5, medioMax: 11, max: 16 };
      expect(MODE_THRESHOLDS[mode]).toEqual(esperado);
    }
    expect(TOTAL_THRESHOLDS).toEqual({ bajoMax: 34, medioMax: 70, max: 104 });
  });
});

describe("levelFor", () => {
  const cortes = MODE_THRESHOLDS.sustancias;

  it("respeta las fronteras: el último bajo y el primero medio", () => {
    expect(levelFor(5, cortes)).toBe("BAJO");
    expect(levelFor(6, cortes)).toBe("MEDIO");
  });

  it("respeta las fronteras: el último medio y el primero alto", () => {
    expect(levelFor(11, cortes)).toBe("MEDIO");
    expect(levelFor(12, cortes)).toBe("ALTO");
  });

  it("un 0 es nivel bajo, no un dato ausente", () => {
    expect(levelFor(0, cortes)).toBe("BAJO");
  });

  it("las fronteras del total", () => {
    expect(levelFor(34, TOTAL_THRESHOLDS)).toBe("BAJO");
    expect(levelFor(35, TOTAL_THRESHOLDS)).toBe("MEDIO");
    expect(levelFor(70, TOTAL_THRESHOLDS)).toBe("MEDIO");
    expect(levelFor(71, TOTAL_THRESHOLDS)).toBe("ALTO");
  });
});

describe("sumAnswers", () => {
  it("suma los ítems pedidos y solo esos", () => {
    const answers: Answers = { 1: 4, 2: 3, 3: 0, 4: 2 };
    expect(sumAnswers(answers, [1, 2, 3])).toBe(7);
  });

  it("un ítem sin responder cuenta como 0", () => {
    expect(sumAnswers({ 1: 4 }, [1, 2, 3])).toBe(4);
  });
});

describe("calculateResults", () => {
  it("con todo en 0 los seis dominios salen BAJO, en 0", () => {
    const results = calculateResults(todoEn(0));
    for (const mode of MODES) {
      expect(results[mode].score).toBe(0);
      expect(results[mode].level).toBe("BAJO");
    }
  });

  it("con todo en 4 los seis dominios salen ALTO y en su máximo", () => {
    const results = calculateResults(todoEn(4));
    for (const mode of MODES) {
      expect(results[mode].score).toBe(MODE_THRESHOLDS[mode].max);
      expect(results[mode].level).toBe("ALTO");
    }
  });

  it("puntúa cada dominio solo con sus propios ítems", () => {
    // Todo en 0 salvo los ítems de finanzas, que van en 4.
    const answers = todoEn(0);
    for (const num of modeQuestions.finanzas) answers[num] = 4;

    const results = calculateResults(answers);
    expect(results.finanzas.score).toBe(20);
    expect(results.finanzas.level).toBe("ALTO");
    expect(results.riesgosInterpersonales.score).toBe(0);
    expect(calculateModeScore(answers, "finanzas")).toBe(20);
  });
});

describe("calculateTotal", () => {
  it("es la suma de los 26 ítems, con su propia escala", () => {
    const total = calculateTotal(todoEn(2));
    expect(total.score).toBe(52);
    expect(total.level).toBe("MEDIO");
    expect(total.max).toBe(104);
  });

  it("no se deduce del nivel de los dominios: puede haber total bajo con un dominio alto", () => {
    // Autoagresión al máximo y todo lo demás en 0. Es justo el caso que no
    // puede quedar escondido detrás de un total "bajo".
    const answers = todoEn(0);
    for (const num of modeQuestions.autoagresion) answers[num] = 4;

    expect(calculateResults(answers).autoagresion.level).toBe("ALTO");
    const total = calculateTotal(answers);
    expect(total.score).toBe(16);
    expect(total.level).toBe("BAJO");
  });
});

describe("qué abre intervención", () => {
  it("abre plan el nivel ALTO, que en esta escala es el de riesgo", () => {
    expect(abreIntervencion("ALTO")).toBe(true);
    expect(abreIntervencion("MEDIO")).toBe(false);
    expect(abreIntervencion("BAJO")).toBe(false);
  });

  it("un ítem abre actividad con 3 o 4, no con 0, 1 o 2 ni sin responder", () => {
    expect([0, 1, 2, 3, 4].map(itemAbreIntervencion)).toEqual([
      false,
      false,
      false,
      true,
      true,
    ]);
    expect(itemAbreIntervencion(undefined)).toBe(false);
  });

  it("itemsQueAbrenIntervencion devuelve los ítems del dominio en 3 o 4", () => {
    const answers = todoEn(0);
    const [a, b, c] = modeQuestions.sustancias;
    answers[a] = 4;
    answers[b] = 3;
    answers[c] = 2;

    expect(itemsQueAbrenIntervencion(answers, "sustancias")).toEqual([a, b]);
    expect(itemsQueAbrenIntervencion({}, "sustancias")).toEqual([]);
  });
});

describe("getRecommendationsForMode", () => {
  it("con nivel MEDIO no abre ninguna actividad, aunque haya un ítem en 4", () => {
    // 4 + 2 + 0 + 0 = 6: MEDIO en un dominio de cuatro ítems.
    const answers = todoEn(0);
    const [a, b] = modeQuestions.sustancias;
    answers[a] = 4;
    answers[b] = 2;

    const results = calculateResults(answers);
    expect(results.sustancias.level).toBe("MEDIO");
    expect(
      getRecommendationsForMode("sustancias", results.sustancias.level, answers)
    ).toEqual([]);
  });

  it("con el dominio en ALTO abre una recomendación por cada ítem en 3 o 4", () => {
    // 4 + 4 + 4 + 0 = 12: ALTO, y el último ítem no abre nada.
    const answers = todoEn(0);
    const items = modeQuestions.saludSomatica;
    for (const num of items.slice(0, 3)) answers[num] = 4;

    const results = calculateResults(answers);
    expect(results.saludSomatica.level).toBe("ALTO");

    const recs = getRecommendationsForMode("saludSomatica", "ALTO", answers);
    expect(recs.map((r) => r.relatedQuestion)).toEqual(items.slice(0, 3));
  });

  it("un dominio en ALTO siempre tiene algún ítem que abre actividad", () => {
    // Invariante del instrumento: con todos los ítems en 2 o menos, el dominio
    // no llega a ALTO (4·2=8 < 12, 5·2=10 < 14). Así nadie ve un dominio en
    // rojo y a la vez la pantalla de "no tienes actividades" —una vez cargado
    // el programa—. Si alguien baja un corte de ALTO por debajo de eso, esta
    // prueba avisa.
    for (const mode of MODES) {
      const answers = todoEn(0);
      for (const num of modeQuestions[mode]) answers[num] = 2;
      expect(calculateResults(answers)[mode].level).not.toBe("ALTO");
    }
  });
});

describe("getOpenRecommendations", () => {
  it("con todo en 4 se abren las 26 recomendaciones", () => {
    expect(getOpenRecommendations(todoEn(4))).toHaveLength(26);
  });

  it("con todo en 0 no se abre ninguna", () => {
    expect(getOpenRecommendations(todoEn(0))).toEqual([]);
  });
});
