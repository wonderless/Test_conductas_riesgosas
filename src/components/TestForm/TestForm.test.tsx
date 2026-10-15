// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { modeQuestions, questions } from "@/constants/questions";
import { getRecommendationsForMode, type Answers } from "@/lib/scoring";
import { TestForm } from "./TestForm";

const simulado = vi.hoisted(() => ({
  push: vi.fn(),
  updateDoc: vi.fn(async () => {}),
  userData: undefined as Record<string, unknown> | undefined,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: simulado.push }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "u1" } }),
}));

vi.mock("@/lib/firebase/config", () => ({ db: {} }));

// El catálogo real está vacío hasta que llegue el programa, y sin actividades
// no hay segundo intento que probar.
vi.mock("@/constants/recommendations", async () => {
  const { catalogoDePrueba } = await import("@/test/catalogoDePrueba");
  return { allRecommendations: catalogoDePrueba() };
});

vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, coleccion: string, id: string) => ({
    path: `${coleccion}/${id}`,
  }),
  getDoc: async () => ({ data: () => simulado.userData }),
  updateDoc: simulado.updateDoc,
  serverTimestamp: () => "MARCA_DEL_SERVIDOR",
}));

// Deja el dominio de sustancias en ALTO y el resto en 0.
const respuestaPara = (id: number): number =>
  modeQuestions.sustancias.includes(id) ? 4 : 0;

// Las opciones se eligen por su etiqueta de la escala, que es lo que ve el
// participante: "Nunca" es 0 y "Siempre" es 4.
const ETIQUETAS: Record<number, string> = {
  0: "0 Nunca",
  1: "1 Rara vez",
  2: "2 Algunas veces",
  3: "3 Casi siempre",
  4: "4 Siempre",
};

const responderTodo = () => {
  questions.forEach((pregunta, indice) => {
    fireEvent.click(
      screen.getByRole("radio", {
        name: ETIQUETAS[respuestaPara(pregunta.id)],
      })
    );
    if (indice < questions.length - 1) {
      fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    }
  });
};

const escrituraGuardada = () => {
  expect(simulado.updateDoc).toHaveBeenCalledTimes(1);
  const [ref, datos] = simulado.updateDoc.mock.calls[0] as unknown as [
    { path: string },
    Record<string, unknown>,
  ];
  expect(ref.path).toBe("users/u1");
  return datos;
};

describe("TestForm", () => {
  beforeEach(() => {
    simulado.push.mockClear();
    simulado.updateDoc.mockClear();
    simulado.userData = undefined;
    localStorage.clear();
  });
  afterEach(cleanup);

  it("ofrece las cinco opciones de la escala", () => {
    render(<TestForm />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    for (const etiqueta of Object.values(ETIQUETAS)) {
      expect(screen.getByRole("radio", { name: etiqueta })).toBeDefined();
    }
  });

  it("no deja avanzar sin responder la pregunta", () => {
    render(<TestForm />);
    const siguiente = screen.getByRole("button", {
      name: "Siguiente",
    }) as HTMLButtonElement;
    expect(siguiente.disabled).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: ETIQUETAS[3] }));
    expect(siguiente.disabled).toBe(false);
  });

  it("un 0 (nunca) cuenta como respuesta y deja avanzar", () => {
    // El 0 es falso en JavaScript: cualquier comprobación por veracidad en
    // lugar de `!== undefined` lo trataría como pregunta sin responder.
    render(<TestForm />);
    fireEvent.click(screen.getByRole("radio", { name: ETIQUETAS[0] }));
    const siguiente = screen.getByRole("button", {
      name: "Siguiente",
    }) as HTMLButtonElement;
    expect(siguiente.disabled).toBe(false);
  });

  it("al volver atrás conserva la respuesta anterior", () => {
    render(<TestForm />);
    fireEvent.click(screen.getByRole("radio", { name: ETIQUETAS[2] }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain(
      "2."
    );

    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain(
      "1."
    );
    expect(
      (screen.getByRole("radio", { name: ETIQUETAS[2] }) as HTMLInputElement)
        .checked
    ).toBe(true);
  });

  it("el primer intento se guarda en las propiedades estándar", async () => {
    render(<TestForm />);
    responderTodo();
    fireEvent.click(screen.getByRole("button", { name: "Finalizar Test" }));

    await waitFor(() => expect(simulado.push).toHaveBeenCalledWith("/results"));
    const datos = escrituraGuardada();
    const answers = datos.answers as Answers;
    expect(Object.keys(answers)).toHaveLength(questions.length);
    // Se guarda el puntaje marcado, también cuando es 0.
    expect(answers[modeQuestions.sustancias[0]]).toBe(4);
    expect(answers[modeQuestions.autoagresion[0]]).toBe(0);
    expect(datos.lastTestDate).toBe("MARCA_DEL_SERVIDOR");
    expect(typeof datos.testDuration).toBe("number");
    expect(datos).not.toHaveProperty("answers2");
    expect(datos).not.toHaveProperty("hasRetakenTest");
    // La escritura es exactamente esta, ni un campo de más: si alguien añade
    // otro, esta prueba lo obliga a decidirlo aquí y no de pasada.
    expect(Object.keys(datos).sort()).toEqual([
      "answers",
      "lastTestDate",
      "testDuration",
    ]);
  });

  it("con las actividades completas, el segundo intento va a la casilla 2 y archiva el plan", async () => {
    const primerasRespuestas: Answers = Object.fromEntries(
      questions.map((q) => [q.id, respuestaPara(q.id)])
    );
    const plan = {
      sustancias: {
        recommendationProgress: Object.fromEntries(
          getRecommendationsForMode("sustancias", "ALTO", primerasRespuestas).map(
            (rec) => [rec.id, { isCompleted: true }]
          )
        ),
      },
    };
    // Sin esto la prueba pasaría con un plan vacío.
    expect(Object.keys(plan.sustancias.recommendationProgress)).toHaveLength(4);
    simulado.userData = {
      answers: primerasRespuestas,
      lastTestDate: { toDate: () => new Date() },
      recommendationProgress: plan,
    };

    render(<TestForm />);
    responderTodo();
    fireEvent.click(screen.getByRole("button", { name: "Finalizar Test" }));

    await waitFor(() => expect(simulado.push).toHaveBeenCalledWith("/results"));
    const datos = escrituraGuardada();
    expect(datos).toHaveProperty("answers2");
    expect(datos).not.toHaveProperty("answers");
    expect(datos.hasRetakenTest).toBe(true);
    expect(datos.recommendationProgress1).toEqual(plan);
    expect(datos.recommendationProgress).toEqual({});
  });

  it("un doble clic en Finalizar no envía el test dos veces", async () => {
    render(<TestForm />);
    responderTodo();
    const finalizar = screen.getByRole("button", { name: "Finalizar Test" });
    fireEvent.click(finalizar);
    fireEvent.click(finalizar);

    await waitFor(() => expect(simulado.push).toHaveBeenCalledWith("/results"));
    expect(simulado.updateDoc).toHaveBeenCalledTimes(1);
  });
});
