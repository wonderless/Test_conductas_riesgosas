// Comprobaciones del catálogo real de recomendaciones. Hoy está vacío —el
// programa de intervención no ha llegado—, así que estas pruebas pasan sin
// comprobar nada; están para el día en que se cargue, que es cuando un error
// de transcripción puede colarse.
import { describe, expect, it } from "vitest";
import { MODES, modeQuestions, questionText } from "@/constants/questions";
import { allRecommendations } from "@/constants/recommendations";
import { getOpenRecommendations, type Answers } from "@/lib/scoring";

const todas = () => MODES.flatMap((mode) => allRecommendations[mode]);

describe("catálogo de recomendaciones", () => {
  it("cada dominio está vacío o tiene exactamente una recomendación por ítem", () => {
    // Un dominio a medio cargar es peor que uno vacío: la pantalla cuenta como
    // "con actividad" todo ítem respondido con 3 o 4, tenga o no su plan, y el
    // participante quedaría delante de un ítem sin nada que hacer.
    for (const mode of MODES) {
      const items = allRecommendations[mode].map((r) => r.relatedQuestion);
      if (items.length === 0) continue;
      expect([...items].sort((a, b) => a - b)).toEqual(
        [...modeQuestions[mode]].sort((a, b) => a - b)
      );
    }
  });

  it("el título de cada recomendación es el enunciado de su ítem", () => {
    // Si el documento del programa trae una variante del enunciado, manda el
    // instrumento.
    for (const rec of todas()) {
      expect(rec.title).toBe(questionText(rec.relatedQuestion));
    }
  });

  it("todas tienen dos días con al menos una actividad cada uno", () => {
    for (const rec of todas()) {
      expect(rec.days.map((d) => d.day)).toEqual([1, 2]);
      for (const day of rec.days) {
        expect(day.activities.length).toBeGreaterThan(0);
        for (const activity of day.activities) {
          expect(activity.title.trim()).not.toBe("");
          expect(activity.cuerpo.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("los identificadores y las claves de retroalimentación no se repiten", () => {
    const recs = todas();
    expect(new Set(recs.map((r) => r.id)).size).toBe(recs.length);
    for (const rec of recs) {
      expect(rec.id).toBe(`recItem${rec.relatedQuestion}`);
      for (const pregunta of rec.feedbackQuestions) {
        // La clave identifica la respuesta dentro de `activityFeedback` en
        // Firestore: si se repitiera, una respuesta pisaría a otra.
        expect(pregunta.key).toMatch(
          new RegExp(`^item${rec.relatedQuestion}Q\\d+$`)
        );
      }
    }
    const claves = recs.flatMap((r) => r.feedbackQuestions.map((q) => q.key));
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("con el catálogo vacío nadie recibe actividades, ni con todo en 4", () => {
    // Es lo que hace que, sin programa, nadie quede bloqueado con actividades
    // inexistentes. Con el catálogo cargado deja de aplicar.
    if (todas().length > 0) return;
    const todoEn4: Answers = Object.fromEntries(
      MODES.flatMap((m) => modeQuestions[m]).map((id) => [id, 4])
    );
    expect(getOpenRecommendations(todoEn4)).toEqual([]);
  });
});
