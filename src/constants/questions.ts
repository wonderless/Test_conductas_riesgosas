// src/constants/questions.ts
// Escala de conductas riesgosas (Grajeda et al., 2026).
//
// Son 26 ítems que se responden en una escala de frecuencia de 0 a 4, y el
// nivel de cada dominio sale de *sumar* los puntajes de sus ítems. Todos los
// ítems describen una conducta de riesgo, así que más puntaje siempre significa
// MÁS riesgo: aquí el nivel ALTO es el preocupante, al revés que en una escala
// de recursos o habilidades. No hay ítems inversos que recodificar ni escala de
// veracidad: todos los ítems puntúan y el valor marcado es el puntaje.
//
// En el código cada dominio se llama `mode` (`Mode`, `MODES`, `modeQuestions`):
// el nombre viene del sistema del que se partió, donde las subescalas eran
// "modos de afrontamiento". En pantalla siempre se dice "dominio".

export interface Question {
  id: number
  text: string
}

// Las cinco opciones de respuesta. El valor es el puntaje que suma el ítem.
export interface AnswerOption {
  value: number
  label: string
}

export const ANSWER_OPTIONS: AnswerOption[] = [
  { value: 0, label: "Nunca" },
  { value: 1, label: "Rara vez" },
  { value: 2, label: "Algunas veces" },
  { value: 3, label: "Casi siempre" },
  { value: 4, label: "Siempre" },
]

// Consigna del instrumento, palabra por palabra. El documento la escribe de
// usted y así se deja.
export const CONSIGNA =
  "A continuación, se presenta una lista de conductas. Lea cada situación e indique con qué frecuencia la ha llevado a cabo durante los últimos 4 meses. Responda con total sinceridad; no hay respuestas buenas ni malas. Seleccione el número que corresponda a su caso: 0 (nunca) 1 (rara vez) 2 (algunas veces) 3 (casi siempre) y 4 (siempre)."

// Qué ítems componen cada dominio. Mantener esta asignación en un solo sitio es
// lo que garantiza que el participante y el administrador vean el mismo puntaje
// para las mismas respuestas.
export const modeQuestions = {
  sustancias: [1, 2, 3, 4],
  evitacionAcademica: [5, 6, 7, 8],
  saludSomatica: [9, 10, 11, 12],
  riesgosInterpersonales: [13, 14, 15, 16, 17],
  finanzas: [18, 19, 20, 21, 22],
  autoagresion: [23, 24, 25, 26],
}

export type Mode = keyof typeof modeQuestions

export const MODES = Object.keys(modeQuestions) as Mode[]

// Nombre de cada dominio tal como lo da el instrumento.
export const MODE_LABELS: Record<Mode, string> = {
  sustancias: "Consumo de Sustancias y Conductas Adictivas",
  evitacionAcademica: "Déficit de Autorregulación y Evitación Académica",
  saludSomatica: "Desatención de la Salud Biológica y Somática",
  riesgosInterpersonales: "Exposición a Riesgos Físicos e Interpersonales",
  finanzas: "Desorganización Financiera e Impulsividad Económica",
  autoagresion: "Respuestas Autoagresivas e Intolerancia al Malestar",
}

// Nombre corto, para las cabeceras de las tablas del administrador y las
// columnas del Excel, donde el nombre completo no cabe.
export const MODE_SHORT_LABELS: Record<Mode, string> = {
  sustancias: "Sustancias",
  evitacionAcademica: "Evitación académica",
  saludSomatica: "Salud",
  riesgosInterpersonales: "Riesgos interpersonales",
  finanzas: "Finanzas",
  autoagresion: "Autoagresión",
}

// Cortes de nivel, tal como los fija el instrumento. `bajoMax` es el último
// puntaje que todavía cuenta como bajo, y `medioMax` el último que cuenta como
// medio; de ahí para arriba es alto. Los máximos posibles son 4 puntos por
// ítem, así que cuadran con el número de ítems de cada dominio (4·4=16,
// 5·4=20) y con el total (26·4=104).
export interface LevelThresholds {
  bajoMax: number
  medioMax: number
  max: number
}

export const MODE_THRESHOLDS: Record<Mode, LevelThresholds> = {
  sustancias: { bajoMax: 5, medioMax: 11, max: 16 },
  evitacionAcademica: { bajoMax: 5, medioMax: 11, max: 16 },
  saludSomatica: { bajoMax: 5, medioMax: 11, max: 16 },
  riesgosInterpersonales: { bajoMax: 6, medioMax: 13, max: 20 },
  finanzas: { bajoMax: 6, medioMax: 13, max: 20 },
  autoagresion: { bajoMax: 5, medioMax: 11, max: 16 },
}

export const TOTAL_THRESHOLDS: LevelThresholds = {
  bajoMax: 34,
  medioMax: 70,
  max: 104,
}

// Qué abre el plan de actividades. PROVISIONAL: el documento de la escala solo
// trae los ítems y los cortes, y el programa de intervención todavía no ha
// llegado. Mientras tanto se sigue la misma lógica que el sistema de origen,
// dada la vuelta porque aquí lo preocupante es puntuar alto: un dominio en
// nivel ALTO abre plan, y dentro de él una actividad por cada ítem respondido
// con 3 (casi siempre) o 4 (siempre). Cuando llegue el programa hay que
// confirmar las dos cosas contra él.
//
// Con el catálogo de recomendaciones vacío, en la práctica no se abre ninguna.
export const INTERVENTION_LEVEL = "ALTO" as const
export const ITEM_INTERVENTION_MIN_SCORE = 3

export const questions: Question[] = [
  { id: 1, text: "Consumo alcohol o sustancias psicoactivas después de una mala experiencia en la universidad." }, // sustancias
  { id: 2, text: "Manejo vehículos motorizados o me desplazo como pasajero con un conductor bajo los efectos del alcohol o drogas." }, // sustancias
  { id: 3, text: "Consumo alcohol o drogas durante la noche previa a un examen o entrega de un trabajo importante." }, // sustancias
  { id: 4, text: "Mezclo dos o más sustancias psicoactivas distintas (ej. alcohol con medicamentos o energizantes) en un mismo día." }, // sustancias
  { id: 5, text: "Entrego hojas de examen en blanco o trabajos académicos incompletos." }, // evitación académica
  { id: 6, text: "No asisto el día de examen o de una exposición asignada." }, // evitación académica
  { id: 7, text: "Copio textualmente de los libros, de internet o de un compañero y lo entrego como si fuera mío." }, // evitación académica
  { id: 8, text: "Abandono la participación en trabajos de equipo antes de finalizar el producto, dejando la carga a otros integrantes." }, // evitación académica
  { id: 9, text: "Me paso más de 18 horas continuas sin comer algo." }, // salud
  { id: 10, text: "Estoy despierto durante más de 24 horas seguidas para cumplir con tareas incumplidas o permanecer en actividades de ocio." }, // salud
  { id: 11, text: "Permanezco con malestar físico o dolor corporal por más de 5 días sin acudir a una consulta médica." }, // salud
  { id: 12, text: "Me quedo en mi habitación o vivienda sin salir ni mantener interacción cara a cara durante más de 48 horas seguidas." }, // salud
  { id: 13, text: "Participo en discusiones o enfrentamientos que incluyen empujones, golpes o agresiones físicas directas." }, // riesgos interpersonales
  { id: 14, text: "Mantengo relaciones sexuales sin la utilización de métodos de barrera (como preservativos) con parejas ocasionales." }, // riesgos interpersonales
  { id: 15, text: "Asisto a encuentros presenciales en lugares aislados con personas que he contactado exclusivamente por aplicaciones o redes sociales." }, // riesgos interpersonales
  { id: 16, text: "Transmito, comparto o publico fotos o videos de contenido íntimo propio o de terceros a través de plataformas digitales." }, // riesgos interpersonales
  { id: 17, text: "Acepto consumir bebidas o alimentos que me ofrecen personas desconocidas cuando me encuentro en una fiesta o reunión festiva." }, // riesgos interpersonales
  { id: 18, text: "Utilizo el dinero asignado para la matrícula, pensión o alimentación en la compra de alcohol, apuestas u ocio." }, // finanzas
  { id: 19, text: "Solicito dinero prestado a amigos o prestamistas informales para financiar actividades de ocio o fiestas." }, // finanzas
  { id: 20, text: "Me gasto todo el dinero del mes durante la primera semana." }, // finanzas
  { id: 21, text: "Me endeudo usando tarjetas de crédito o aplicaciones de crédito sabiendo que no tengo ingresos para pagar." }, // finanzas
  { id: 22, text: "Vendo, empeño o entrego en garantía objetos personales de valor (ej. laptop, teléfono, libros) para pagar deudas de entretenimiento." }, // finanzas
  { id: 23, text: "Causo daño intencional en la superficie de mi propio cuerpo." }, // autoagresión
  { id: 24, text: "Consumo medicamentos excesivamente u otras sustancias para alterar mi estado de conciencia o causarme daño." }, // autoagresión
  { id: 25, text: "Me aíslo de forma absoluta, bloqueando llamadas y mensajes de familiares y redes de apoyo cuando experimento una frustración." }, // autoagresión
  { id: 26, text: "Me provoco el vómito intencionalmente después de la ingesta de alimentos para controlar el peso." }, // autoagresión
]

// Enunciado de un ítem por su número, para las pantallas que muestran el
// detalle de una recomendación.
export const questionText = (id: number): string =>
  questions.find((question) => question.id === id)?.text ?? ""
