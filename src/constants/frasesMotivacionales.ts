// src/constants/frasesMotivacionales.ts
//
// Frases que se muestran al culminar el día 1 de una actividad, mientras
// espera a que se abra el día 2.
//
// PENDIENTE: llegarán con el programa de intervención. Mientras las listas
// estén vacías no se muestra ninguna frase. Al cargarlas, palabra por palabra
// y sin las comillas que las rodeen en el documento. Si invitan a volver
// "mañana", solo encajan al cerrar el día 1, que es donde se muestran.
import type { Mode } from "@/constants/questions"

// Una lista por dominio.
export const FRASES_POR_MODO: Partial<Record<Mode, string[]>> = {}

// Valen para cualquier dominio.
export const FRASES_GENERALES: string[] = []

// Frase para una actividad: una de las de su dominio o una general. Sale de la
// actividad, no del azar, para que al recargar durante la espera se vea la
// misma frase y no otra; y como cada actividad da una distinta, quien tiene
// varias no lee siempre la misma. Sin frases cargadas devuelve null.
export const fraseMotivacional = (
  mode: Mode,
  recommendationId: string
): string | null => {
  const frases = [...(FRASES_POR_MODO[mode] ?? []), ...FRASES_GENERALES]
  if (frases.length === 0) return null
  let hash = 0
  for (const letra of recommendationId) {
    hash = (hash * 31 + letra.charCodeAt(0)) >>> 0
  }
  return frases[hash % frases.length]
}
