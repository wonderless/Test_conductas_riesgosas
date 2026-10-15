// src/constants/interpretations.ts
//
// Interpretación psicológica de cada nivel de la Escala de conductas riesgosas.
//
// PENDIENTE: el documento de la escala solo trae los ítems y los cortes, no la
// interpretación de cada nivel. Hasta que llegue, estas tablas están vacías y
// las pantallas muestran el puntaje y el nivel sin texto debajo. Al cargarla,
// el texto va palabra por palabra, como venga en el documento: son las
// definiciones de los autores y el administrador las cita tal cual.
import type { Level } from "@/lib/scoring"
import type { Mode } from "@/constants/questions"

export interface Interpretation {
  // Nombre que el instrumento le da al nivel, cuando lo tiene.
  label?: string
  description: string
}

// Interpretación del total de conductas riesgosas (0–104).
export const TOTAL_INTERPRETATIONS: Partial<Record<Level, Interpretation>> = {}

// Interpretación de cada dominio por nivel.
export const MODE_INTERPRETATIONS: Partial<
  Record<Mode, Partial<Record<Level, Interpretation>>>
> = {}

export const interpretacionDeDominio = (
  mode: Mode,
  level: Level
): Interpretation | undefined => MODE_INTERPRETATIONS[mode]?.[level]

// Presenta las actividades de un dominio que abrió plan.
export const PLAN_INVITACION =
  "Con el propósito de reducir las conductas de riesgo de este dominio, se recomienda seguir con las siguientes actividades durante los próximos días."

// Se muestra al completar todas las actividades del primer intento, junto al
// botón para repetir el test al que invita. Texto provisional, a validar por el
// equipo cuando llegue el programa.
export const SPEECH_FINALIZACION: string[] = [
  "¡Felicidades! Has culminado el programa de actividades. El tiempo que le has dedicado demuestra un gran nivel de compromiso contigo mismo.",
  "Para poder revisar tu avance, te invitamos a completar nuevamente el test y obtener una nueva representación de tus resultados.",
  "¡Muchos éxitos!",
]
