// components/ResultsDisplay/PsychologicalProfile.tsx
//
// Tabla e interpretación de los resultados. Los textos no se escriben aquí:
// salen de constants/interpretations.ts, transcritos del instrumento. Mientras
// no estén cargados, la tabla muestra el puntaje y el nivel sin columna de
// interpretación.
import React from "react";
import { MODES, MODE_LABELS, MODE_THRESHOLDS } from "@/constants/questions";
import {
  interpretacionDeDominio,
  TOTAL_INTERPRETATIONS,
} from "@/constants/interpretations";
import type { Results, TotalScore, Level } from "@/lib/scoring";

interface Props {
  results: Results;
  total: TotalScore;
  getLevelClass: (level: string) => string;
}

// Los dominios tienen máximos distintos —16 o 20, según cuántos ítems los
// componen—, así que las barras van en porcentaje del máximo de cada uno.
const porcentaje = (score: number, max: number) =>
  max > 0 ? Math.round((score / max) * 100) : 0;

// En esta escala ALTO es riesgo: rojo. BAJO es lo deseable: verde.
const colorDeNivel = (level: Level) =>
  level === "BAJO" ? "#28a745" : level === "MEDIO" ? "#ffc107" : "#dc3545";

// "16 o 20" a partir de los cortes, para que el texto no se quede atrás si
// cambia el instrumento.
const maximosDistintos = [...new Set(MODES.map((m) => MODE_THRESHOLDS[m].max))]
  .sort((a, b) => a - b)
  .join(" o ");

const PsychologicalProfile: React.FC<Props> = ({
  results,
  total,
  getLevelClass,
}) => {
  const interpretacionTotal = TOTAL_INTERPRETATIONS[total.level];
  const hayInterpretaciones = MODES.some(
    (mode) => interpretacionDeDominio(mode, results[mode].level) !== undefined
  );

  return (
    <div className="mb-6 sm:mb-8 bg-celeste p-4 sm:p-6 rounded-lg shadow-lg w-full">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
        Perfil de conductas riesgosas
      </h2>

      {/* Total de conductas riesgosas. Tiene su propia escala de 0 a 104, no
          es la media de los dominios. */}
      <div className="mb-4 p-3 sm:p-4 bg-white rounded-md border border-gray-300">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-sm sm:text-base">
            Total de conductas riesgosas
          </span>
          <span className="text-sm sm:text-base">
            {total.score} / {total.max}
          </span>
          <span
            className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getLevelClass(
              total.level
            )}`}
          >
            {total.level}
          </span>
        </div>
        {interpretacionTotal && (
          <p className="mt-2 text-sm sm:text-base font-medium text-gray-800">
            {interpretacionTotal.label
              ? `${interpretacionTotal.label}: `
              : ""}
            {interpretacionTotal.description}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-2 border-black text-xs sm:text-sm">
          <thead>
            <tr className="bg-mi-color-rgb text-white">
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left border-2 border-black">
                Dominio
              </th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-center border-2 border-black">
                Puntuación
              </th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-center border-2 border-black">
                Nivel
              </th>
              {hayInterpretaciones && (
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left border-2 border-black">
                  Interpretación
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {MODES.map((mode) => {
              const result = results[mode];
              return (
                <tr key={mode} className="bg-white">
                  <td className="py-2 sm:py-3 px-2 sm:px-4 border-2 border-black font-medium">
                    {MODE_LABELS[mode]}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center border-2 border-black">
                    {result.score} / {result.max}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center border-2 border-black">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelClass(
                        result.level
                      )}`}
                    >
                      {result.level}
                    </span>
                  </td>
                  {hayInterpretaciones && (
                    <td className="py-2 sm:py-3 px-2 sm:px-4 border-2 border-black">
                      {interpretacionDeDominio(mode, result.level)?.description}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Comparativa en porcentaje del máximo de cada dominio. */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
        <p className="font-medium text-blue-800 text-sm sm:text-base mb-3">
          Comparativa entre dominios
        </p>

        <div className="space-y-3">
          {MODES.map((mode) => {
            const result = results[mode];
            const pct = porcentaje(result.score, result.max);
            return (
              <div key={mode}>
                <div className="flex justify-between gap-2 text-xs sm:text-sm mb-1">
                  <span>{MODE_LABELS[mode]}</span>
                  <span className="whitespace-nowrap">
                    {result.score} / {result.max} ({pct}%)
                  </span>
                </div>
                <div
                  className="w-full bg-gray-200 rounded-full h-3"
                  role="img"
                  aria-label={`${MODE_LABELS[mode]}: ${result.score} de ${result.max}, nivel ${result.level}`}
                >
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: colorDeNivel(result.level),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs sm:text-sm text-gray-700">
          Las barras van en porcentaje del máximo de cada dominio, porque no
          todos tienen el mismo número de ítems: suman hasta {maximosDistintos}{" "}
          puntos. Una barra más larga indica más conductas de riesgo.
        </p>
      </div>
    </div>
  );
};

export default PsychologicalProfile;
