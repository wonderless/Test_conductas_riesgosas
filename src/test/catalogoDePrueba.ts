// src/test/catalogoDePrueba.ts
//
// Catálogo de recomendaciones de mentira, solo para las pruebas.
//
// El catálogo real está vacío hasta que llegue el programa de intervención, y
// con él vacío no hay forma de probar el plan de actividades ni la regla del
// segundo intento. Las pruebas que lo necesitan lo sustituyen por este con
// `vi.mock("@/constants/recommendations", ...)`: una recomendación por ítem,
// con la misma forma que tendrán las de verdad.
import { MODES, modeQuestions, questionText, type Mode } from "@/constants/questions"
import type { RecommendationItem } from "@/constants/recommendations"

const recomendacionDePrueba = (item: number): RecommendationItem => ({
  id: `recItem${item}`,
  relatedQuestion: item,
  title: questionText(item),
  days: [1, 2].map((day) => ({
    day,
    activities: [
      {
        title: `Actividad de prueba del ítem ${item}, día ${day}`,
        cuerpo: [{ tipo: "parrafo", texto: "Texto de prueba." }],
      },
    ],
  })),
  feedbackQuestions: [1, 2, 3].map((n) => ({
    question: `Pregunta de prueba ${n}`,
    key: `item${item}Q${n}`,
  })),
})

export const catalogoDePrueba = (): Record<Mode, RecommendationItem[]> =>
  Object.fromEntries(
    MODES.map((mode) => [mode, modeQuestions[mode].map(recomendacionDePrueba)])
  ) as Record<Mode, RecommendationItem[]>
