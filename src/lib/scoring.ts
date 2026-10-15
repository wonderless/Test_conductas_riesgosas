// src/lib/scoring.ts
// Puntuación del instrumento. Es lógica pura: recibe respuestas y devuelve
// puntajes y niveles, sin tocar Firestore ni React.
//
// Tenerla en un solo sitio es lo que garantiza que el participante y el
// administrador vean el mismo número para las mismas respuestas.
//
// No hay clave de respuestas correctas: en esta escala ninguna respuesta es
// "la buena". Cada ítem vale exactamente lo que el participante marcó, de 0 a
// 4, y el puntaje de un dominio es la suma de sus ítems.
//
// En esta escala puntuar ALTO es lo preocupante: cada ítem es una conducta de
// riesgo. Ningún componente debe comparar niveles con "BAJO" o "ALTO" para
// decidir si hay plan: para eso están `abreIntervencion` e
// `itemAbreIntervencion`, que leen la regla de questions.ts.
import {
  MODES,
  MODE_THRESHOLDS,
  TOTAL_THRESHOLDS,
  INTERVENTION_LEVEL,
  ITEM_INTERVENTION_MIN_SCORE,
  modeQuestions,
  questions,
  type LevelThresholds,
  type Mode,
} from "@/constants/questions"
import {
  allRecommendations,
  type RecommendationItem,
} from "@/constants/recommendations"

export type Level = "ALTO" | "MEDIO" | "BAJO"

// Las respuestas son el puntaje marcado en cada ítem, de 0 a 4.
export type Answers = Record<number, number>

export interface ModeScore {
  score: number
  level: Level
  // Máximo alcanzable en el dominio, para poder mostrar "9 de 16" sin que
  // cada pantalla tenga que ir a buscar el número de ítems.
  max: number
}

export type Results = Record<Mode, ModeScore>

// Un puntaje es bajo hasta `bajoMax` inclusive y medio hasta `medioMax`
// inclusive; de ahí para arriba, alto. Los cortes vienen del instrumento y
// viven en questions.ts.
export const levelFor = (score: number, thresholds: LevelThresholds): Level => {
  if (score <= thresholds.bajoMax) return "BAJO"
  if (score <= thresholds.medioMax) return "MEDIO"
  return "ALTO"
}

// Suma de los ítems indicados. Un ítem sin responder suma 0, que es lo que
// corresponde: los rangos del instrumento empiezan en 0 justamente para
// admitir escalas incompletas.
export const sumAnswers = (answers: Answers, questionNumbers: number[]): number =>
  questionNumbers.reduce(
    (total, questionNum) => total + (answers[questionNum] ?? 0),
    0
  )

export const calculateModeScore = (answers: Answers, mode: Mode): number =>
  sumAnswers(answers, modeQuestions[mode])

// Puntaje y nivel de los seis dominios a partir de las respuestas.
export const calculateResults = (answers: Answers): Results =>
  MODES.reduce((acc, mode) => {
    const score = calculateModeScore(answers, mode)
    acc[mode] = {
      score,
      level: levelFor(score, MODE_THRESHOLDS[mode]),
      max: MODE_THRESHOLDS[mode].max,
    }
    return acc
  }, {} as Results)

export interface TotalScore {
  score: number
  level: Level
  max: number
}

// Total de conductas riesgosas: la suma de los 26 ítems, con sus propios
// cortes. No es la media de los dominios ni se deduce de sus niveles, tiene su
// propia escala.
export const calculateTotal = (answers: Answers): TotalScore => {
  const score = sumAnswers(
    answers,
    questions.map((question) => question.id)
  )
  return {
    score,
    level: levelFor(score, TOTAL_THRESHOLDS),
    max: TOTAL_THRESHOLDS.max,
  }
}

// ¿Este nivel de dominio abre plan de actividades? Ver INTERVENTION_LEVEL.
export const abreIntervencion = (level: Level): boolean =>
  level === INTERVENTION_LEVEL

// ¿Este ítem abre una actividad, dentro de un dominio que abre plan? Un ítem
// sin responder no abre nada.
export const itemAbreIntervencion = (answer: number | undefined): boolean =>
  answer !== undefined && answer >= ITEM_INTERVENTION_MIN_SCORE

// Ítems de un dominio que abren actividad. Solo cuentan si el dominio entero
// abre plan: ver `getRecommendationsForMode`.
export const itemsQueAbrenIntervencion = (
  answers: Answers,
  mode: Mode
): number[] =>
  modeQuestions[mode].filter((questionNum) =>
    itemAbreIntervencion(answers[questionNum])
  )

// Recomendaciones que le tocan a un dominio.
//
// Dos filtros encadenados: el dominio tiene que estar en el nivel que abre
// plan y, dentro de él, se abre una recomendación por cada ítem que abre
// actividad. Es la regla provisional de questions.ts, a confirmar con el
// programa de intervención. Un dominio en cualquier otro nivel no abre nada,
// aunque tenga algún ítem suelto alto: si no, casi todo el mundo acabaría con
// actividades pendientes, y tenerlas bloquea el segundo intento.
export const getRecommendationsForMode = (
  mode: Mode,
  level: Level,
  answers: Answers
): RecommendationItem[] => {
  if (!abreIntervencion(level)) return []

  const abiertos = itemsQueAbrenIntervencion(answers, mode)
  return allRecommendations[mode].filter((rec) =>
    abiertos.includes(rec.relatedQuestion)
  )
}

// Todas las recomendaciones abiertas, de todos los dominios. Es lo que
// necesitan el panel de actividades y la regla del segundo intento.
export const getOpenRecommendations = (
  answers: Answers
): Array<{ mode: Mode; recommendation: RecommendationItem }> => {
  const results = calculateResults(answers)
  return MODES.flatMap((mode) =>
    getRecommendationsForMode(mode, results[mode].level, answers).map(
      (recommendation) => ({ mode, recommendation })
    )
  )
}
