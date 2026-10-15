import { describe, expect, it } from "vitest";
import {
  FRASES_GENERALES,
  FRASES_POR_MODO,
  fraseMotivacional,
} from "@/constants/frasesMotivacionales";
import { MODES, modeQuestions } from "@/constants/questions";

// Las frases llegarán con el programa de intervención. Mientras tanto las
// listas están vacías y estas pruebas fijan que eso no rompe nada; al cargarlas
// pasan a vigilar que no se cuelen comillas del documento.
const todas = () => [
  ...MODES.flatMap((m) => FRASES_POR_MODO[m] ?? []),
  ...FRASES_GENERALES,
];

describe("frases motivacionales", () => {
  it("no deja comillas del documento alrededor de las frases", () => {
    todas().forEach((frase) => {
      expect(frase).toBe(frase.trim());
      expect(frase).not.toMatch(/^["“]|["”]$/);
    });
  });

  it("da a cada actividad una frase de su dominio o una general, siempre la misma", () => {
    MODES.forEach((mode) => {
      modeQuestions[mode].forEach((item) => {
        const id = `recItem${item}`;
        const frase = fraseMotivacional(mode, id);
        // Al recargar durante la espera se tiene que ver la misma.
        expect(fraseMotivacional(mode, id)).toBe(frase);

        const posibles = [...(FRASES_POR_MODO[mode] ?? []), ...FRASES_GENERALES];
        if (posibles.length === 0) {
          // Sin frases cargadas no se muestra ninguna.
          expect(frase).toBeNull();
        } else {
          expect(posibles).toContain(frase);
        }
      });
    });
  });
});
