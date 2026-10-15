// src/constants/recommendations.ts
//
// Planes de actividades de la Escala de conductas riesgosas.
//
// VACÍO A PROPÓSITO: el programa de intervención todavía no ha llegado. Mientras
// esté vacío ningún participante recibe actividades, y por tanto nadie tiene
// segundo intento (ver testAccess.ts): el segundo intento existe para medir el
// efecto de las actividades.
//
// Al cargar el programa, este archivo pasa a ser la fuente y se edita a mano:
//
//   · Una recomendación por ítem, en el dominio al que pertenece el ítem en
//     questions.ts, con `id` "recItemN" y `relatedQuestion` N.
//   · `title` es el enunciado del ítem tal como está en questions.ts: si el
//     documento del programa trae una variante, manda el instrumento.
//   · El texto de cada ejercicio es el del documento, palabra por palabra: son
//     ejercicios clínicos y una paráfrasis los altera.
//   · Cada plan dura DOS días, con una espera de 12 horas entre ellos.
//   · Las claves de retroalimentación son "itemNQ1", "itemNQ2"…: identifican la
//     respuesta en Firestore y no pueden repetirse.
//
// A un participante solo se le abren los ítems que cumplen la regla de
// questions.ts (INTERVENTION_LEVEL e ITEM_INTERVENTION_MIN_SCORE).
import type { Mode } from "@/constants/questions"

export interface FeedbackQuestion {
  // Texto de la pregunta, que se responde SÍ / NO.
  question: string
  // Clave con la que se guarda la respuesta en Firestore.
  key: string
}

// El cuerpo de un ejercicio es una sucesión de párrafos y listas, porque en el
// documento original los hay intercalados: un párrafo que presenta, la lista de
// puntos y otro párrafo que cierra. Aplanarlo a una sola cadena perdía las
// viñetas y dejaba la pantalla plana.
export type ActivityBlock =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; puntos: string[] }

// Imagen que acompaña a un ejercicio. Solo algunos la llevan. El archivo va en
// public/imagenes/actividades/. `width` y `height` son las medidas reales del
// archivo en píxeles: con ellas el navegador reserva el hueco con la
// proporción correcta antes de que cargue, y la imagen se muestra entera, sin
// recortes. `alt` la describe en una línea para quien usa lector de pantalla.
export interface ImagenDeActividad {
  src: string
  alt: string
  width: number
  height: number
}

export interface Activity {
  title: string
  cuerpo: ActivityBlock[]
  imagen?: ImagenDeActividad
}

export interface DayActivities {
  day: number
  activities: Activity[]
}

export interface RecommendationItem {
  id: string
  // Ítem del instrumento que abre esta recomendación.
  relatedQuestion: number
  // Enunciado de ese ítem, que es también el título del plan.
  title: string
  days: DayActivities[]
  feedbackQuestions: FeedbackQuestion[]
}

export const allRecommendations: Record<Mode, RecommendationItem[]> = {
  sustancias: [],
  evitacionAcademica: [],
  saludSomatica: [],
  riesgosInterpersonales: [],
  finanzas: [],
  autoagresion: [],
}
