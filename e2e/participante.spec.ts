// e2e/participante.spec.ts
import { expect, test } from "@playwright/test";
import { MODE_LABELS, questions } from "../src/constants/questions";
import {
  ADMIN,
  CLAVE,
  DATOS_PERSONALES,
  ETIQUETA_DE_PUNTAJE,
  respuestaPara,
} from "./datos";
import { aceptarConsentimiento, esperarRuta } from "./pasos";

test("participante: registro, test y resultados", async ({ page }, testInfo) => {
  const email = `participante-${testInfo.project.name}@e2e.test`;

  // Registro con el código del administrador sembrado.
  await aceptarConsentimiento(page);
  await page.getByRole("link", { name: "Regístrate aquí" }).click();
  await page.getByLabel("Código de Invitación").fill(ADMIN.codigo);
  await page.getByLabel("Correo Electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(CLAVE);
  await page.getByLabel("Confirmar Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Siguiente" }).click();

  await page.getByLabel("Nombres").fill(DATOS_PERSONALES.nombres);
  await page.getByLabel("Apellidos").fill(DATOS_PERSONALES.apellidos);
  await page.getByLabel("Edad").fill(String(DATOS_PERSONALES.edad));
  await page.getByLabel("Sexo").selectOption(DATOS_PERSONALES.sexo);
  await page.getByLabel("Universidad").fill(DATOS_PERSONALES.universidad);
  await page.getByLabel("Carrera").fill(DATOS_PERSONALES.carrera);
  await page.getByLabel("Ciclo").fill(DATOS_PERSONALES.ciclo);
  await page.getByLabel("Departamento").selectOption(DATOS_PERSONALES.departamento);
  await page.getByRole("button", { name: "Registrarse" }).click();

  // Los 26 ítems.
  await esperarRuta(page, "/dashboard/user");
  await page.getByRole("button", { name: "Iniciar Test" }).click();
  await esperarRuta(page, "/test");

  for (const [indice, pregunta] of questions.entries()) {
    await expect(
      page.getByRole("heading", { name: `${indice + 1}. ${pregunta.text}` })
    ).toBeVisible();
    await page
      .getByRole("radio", {
        name: ETIQUETA_DE_PUNTAJE[respuestaPara(pregunta.id)],
        exact: true,
      })
      .check();
    const esLaUltima = indice === questions.length - 1;
    await page
      .getByRole("button", { name: esLaUltima ? "Finalizar Test" : "Siguiente" })
      .click();
  }

  // Resultados. El dominio de sustancias sale ALTO, pero el programa de
  // intervención todavía no está cargado: no hay plan de actividades, y la
  // pantalla lo dice en lugar de enseñar un plan vacío como completado.
  //
  // Cuando se cargue el programa, este tramo vuelve a recorrer el plan: el día
  // 1, la espera hasta el día 2 —5 segundos en las pruebas, por
  // NEXT_PUBLIC_UNLOCK_DELAY_SECONDS en playwright.config.ts— y la recarga.
  await esperarRuta(page, "/results");
  await expect(
    page.getByRole("heading", { name: "Resultados: conductas riesgosas" })
  ).toBeVisible();
  const filaSustancias = page.getByRole("row", {
    name: new RegExp(MODE_LABELS.sustancias),
  });
  await expect(filaSustancias).toContainText("16 / 16");
  await expect(filaSustancias).toContainText("ALTO");
  await expect(
    page.getByRole("heading", { name: "Gracias por tu valiosa participación" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Orientaciones y recomendaciones a seguir" })
  ).toHaveCount(0);

  // Sin actividades no hay segundo intento: el panel solo ofrece ver los
  // resultados.
  await page.goto("/dashboard/user");
  await expect(page.getByRole("button", { name: "Ver mis resultados" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar Test" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Realizar el test otra vez" })
  ).toHaveCount(0);

  // Un participante no entra en el panel del administrador.
  await page.goto("/dashboard/admin");
  await esperarRuta(page, "/dashboard/user");
});
