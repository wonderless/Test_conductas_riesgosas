// @vitest-environment jsdom
//
// La pantalla de resultados en los tres casos que importan: nada en riesgo, un
// dominio en riesgo sin programa cargado y un dominio en riesgo con programa.
// El último usa un catálogo de mentira, porque el real está vacío hasta que
// llegue el programa de intervención.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MODES, MODE_LABELS, modeQuestions, questions } from "@/constants/questions";
import type { Answers } from "@/lib/scoring";
import { catalogoDePrueba } from "@/test/catalogoDePrueba";
import { ResultsDisplay } from "./ResultsDisplay";

const simulado = vi.hoisted(() => ({
  userData: {} as Record<string, unknown>,
  updateDoc: vi.fn(async () => {}),
  medalla: vi.fn(),
  efecto: vi.fn(async () => true),
}));

const catalogo = vi.hoisted(() => ({}) as Record<string, unknown[]>);
vi.mock("@/constants/recommendations", () => ({ allRecommendations: catalogo }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/lib/firebase/config", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: () => ({}),
  getDoc: async () => ({ data: () => simulado.userData }),
  updateDoc: simulado.updateDoc,
}));
vi.mock("@/lib/celebracion", () => ({
  celebrarActividad: vi.fn(),
  celebrarDia: vi.fn(),
  celebrarFelicitacion: vi.fn(),
  celebrarMedalla: simulado.medalla,
  celebrarRecomendacion: vi.fn(),
  celebrarPrograma: vi.fn(),
  celebrarRetroalimentacion: vi.fn(),
}));
vi.mock("@/lib/sonido", () => ({
  reproducirEfecto: simulado.efecto,
  sonarCierre: vi.fn(async () => {}),
}));

const sinRiesgo = (): Answers =>
  Object.fromEntries(questions.map((q) => [q.id, 0]));

const sustanciasEnAlto = (): Answers => {
  const answers = sinRiesgo();
  for (const num of modeQuestions.sustancias) answers[num] = 4;
  return answers;
};

const vaciarCatalogo = () => {
  for (const mode of MODES) catalogo[mode] = [];
};

describe("ResultsDisplay", () => {
  beforeEach(() => {
    vaciarCatalogo();
    simulado.updateDoc.mockClear();
    simulado.medalla.mockClear();
    simulado.efecto.mockClear();
  });
  afterEach(cleanup);

  it("sin ningún dominio en riesgo: medallas, sin plan y nivel BAJO en verde", async () => {
    simulado.userData = { answers: sinRiesgo() };
    render(<ResultsDisplay userId="u1" />);

    expect(
      await screen.findByRole("heading", { name: "Resultados: conductas riesgosas" })
    ).toBeDefined();
    expect(screen.getByRole("heading", { name: "¡Medallas de logro!" })).toBeDefined();
    expect(simulado.medalla).toHaveBeenCalledTimes(1);
    expect(simulado.efecto).not.toHaveBeenCalledWith("alerta");
    expect(
      screen.getByText(/Ninguno de los dominios salió en nivel alto/)
    ).toBeDefined();
    expect(screen.queryByText("Orientaciones y recomendaciones a seguir")).toBeNull();

    // El BAJO es lo deseable en esta escala: verde, no rojo.
    const fila = screen.getByRole("row", { name: new RegExp(MODE_LABELS.sustancias) });
    expect(within(fila).getByText("BAJO").className).toContain("green");

    // Los resultados se guardan una vez, con los seis dominios y el total.
    expect(simulado.updateDoc).toHaveBeenCalledTimes(1);
    const [, datos] = simulado.updateDoc.mock.calls[0] as unknown as [
      unknown,
      { testResults: Record<string, { score: number; level: string }> },
    ];
    expect(Object.keys(datos.testResults).sort()).toEqual(
      [...MODES, "total"].sort()
    );
    expect(datos.testResults.total).toEqual({ score: 0, level: "BAJO" });
  });

  it("con un dominio en riesgo y sin programa: alarma, sin medalla, sin plan vacío ni segundo intento", async () => {
    simulado.userData = { answers: sustanciasEnAlto() };
    render(<ResultsDisplay userId="u1" />);

    await screen.findByRole("heading", { name: "Resultados: conductas riesgosas" });
    expect(simulado.efecto).toHaveBeenCalledWith("alerta");
    expect(simulado.medalla).not.toHaveBeenCalled();
    expect(screen.queryByText(/Medalla/)).toBeNull();

    const fila = screen.getByRole("row", { name: new RegExp(MODE_LABELS.sustancias) });
    expect(within(fila).getByText("16 / 16")).toBeDefined();
    expect(within(fila).getByText("ALTO").className).toContain("red");

    expect(screen.getByText(/Tus respuestas quedaron registradas/)).toBeDefined();
    // Un plan vacío no se enseña como completado ni invita a repetir.
    expect(screen.queryByText("Orientaciones y recomendaciones a seguir")).toBeNull();
    expect(screen.queryByText(/Has completado/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Realizar Test Otra Vez" })).toBeNull();
  });

  it("con un dominio en riesgo y programa cargado: abre su plan en el primer ítem", async () => {
    Object.assign(catalogo, catalogoDePrueba());
    simulado.userData = { answers: sustanciasEnAlto() };
    render(<ResultsDisplay userId="u1" />);

    expect(
      await screen.findByText("Orientaciones y recomendaciones a seguir")
    ).toBeDefined();
    // Solo el dominio en riesgo lleva a actividades; los de nivel BAJO
    // llevan la felicitación.
    expect(screen.getAllByRole("button", { name: "Seguir orientaciones" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "¡Felicitaciones!" })).toHaveLength(
      MODES.length - 1
    );

    // La pantalla arranca en el primer dominio, que es el de sustancias.
    expect(screen.getByText(`Dominio 1 de ${MODES.length}: ${MODE_LABELS.sustancias}`)).toBeDefined();
    expect(screen.getByRole("heading", { name: "Día 1 de 2" })).toBeDefined();
    expect(
      screen.getByText(
        `Actividad de prueba del ítem ${modeQuestions.sustancias[0]}, día 1`
      )
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: "Realizar Test Otra Vez" })).toBeNull();
  });
});
