# Programa de evaluación y orientación de conductas riesgosas

Aplicación web que permite a estudiantes universitarios medir con qué
frecuencia incurren en conductas de riesgo, en seis dominios, y recibir a cambio
un plan de actividades para los dominios donde el riesgo sale alto.

El instrumento es la **Escala de conductas riesgosas** (Grajeda et al., 2026):
26 ítems que se responden según la frecuencia con que se ha llevado a cabo cada
conducta durante los últimos 4 meses, de 0 (*nunca*) a 4 (*siempre*). Todos los
ítems describen una conducta de riesgo, así que **más puntaje siempre significa
más riesgo**: aquí el nivel ALTO es el preocupante y el BAJO el deseable. No hay
ítems inversos que recodificar ni escala de veracidad.

El nivel de cada dominio sale de **sumar** los puntajes de sus ítems. Los
dominios en nivel alto abrirán un plan de actividades de **dos días**, con el
segundo día bloqueado durante 12 horas.

La aplicación parte del sistema del test de afrontamiento a la tensión
académica, del mismo equipo, y conserva toda su mecánica: registro por
invitación, dos intentos, plan de actividades, panel del administrador y
exportación a Excel.

## Estado: falta el programa de intervención

El documento de la escala trae solo los ítems, la consigna y la tabla de
calificación. **Faltan el programa de intervención, la interpretación de cada
nivel y las frases motivacionales.** Mientras no lleguen:

- `src/constants/recommendations.ts`, `interpretations.ts` y
  `frasesMotivacionales.ts` están **vacíos**, con los tipos y las instrucciones
  de carga ya escritos.
- **Nadie recibe actividades.** Quien tiene un dominio en riesgo ve sus
  resultados y un mensaje de agradecimiento, no un plan vacío.
- **Nadie tiene segundo intento**, porque el segundo intento existe para medir
  el efecto de las actividades (ver *Los dos intentos del test*).
- Las pantallas muestran puntaje y nivel sin texto de interpretación debajo.

Queda pendiente además, para que lo decida el equipo:

- **Los ítems 23 a 26** preguntan por autolesión, sobredosis, aislamiento
  absoluto y vómito provocado. Si el dominio sale alto la aplicación no muestra
  ningún aviso especial de ayuda.
- Los textos provisionales de la pantalla de resultados —agradecimiento, fin
  de programa, segundo intento— los escribió el equipo técnico y conviene que
  los revise el equipo de psicología.
- La lista de autores del panel del participante
  (`src/components/dashboard/User/UserDashboard.tsx`) es la del test de
  afrontamiento; el documento de la escala solo dice "Grajeda et al.".

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 15.5 (App Router) con Turbopack en desarrollo |
| UI | React 19.1, TypeScript 5, Tailwind CSS 3.4 |
| Iconos | Lucide React |
| Autenticación | Firebase Auth + cookie de sesión `__session` |
| Base de datos | Firestore |
| Servidor | Firebase Admin SDK 14 (API modular) |
| Sesión en el edge | jose |
| Exportación | XLSX (solo escritura) |
| Hosting | Vercel |

El proyecto de Firebase es `test-conductas-riesgosas`, **distinto** del de la
aplicación de afrontamiento (`nuevo-psicologia`): participantes,
administradores y reglas no se mezclan.

## El instrumento

### Los seis dominios

| Dominio | Ítems | Puntaje máximo |
| --- | --- | --- |
| **Consumo de Sustancias y Conductas Adictivas** | 1 – 4 | 16 |
| **Déficit de Autorregulación y Evitación Académica** | 5 – 8 | 16 |
| **Desatención de la Salud Biológica y Somática** | 9 – 12 | 16 |
| **Exposición a Riesgos Físicos e Interpersonales** | 13 – 17 | 20 |
| **Desorganización Financiera e Impulsividad Económica** | 18 – 22 | 20 |
| **Respuestas Autoagresivas e Intolerancia al Malestar** | 23 – 26 | 16 |

El reparto vive en `modeQuestions`, en `src/constants/questions.ts`, y **solo
ahí**. No lo copie dentro de `ResultsDisplay`, `ListaUsers` ni `OtherData`: en
cuanto hay dos copias, basta con que una se quede atrás al retocar el
instrumento para que el mismo test dé puntajes distintos según quién lo mire.
Hay una prueba que comprueba que los 26 ítems están repartidos, sin duplicados
y sin ninguno suelto.

**En el código cada dominio se llama `mode`** (`Mode`, `MODES`,
`modeQuestions`, `MODE_LABELS`). El nombre viene del sistema de origen, donde
las subescalas eran "modos de afrontamiento"; en pantalla siempre se dice
"dominio". Cada dominio tiene además un nombre corto (`MODE_SHORT_LABELS`) para
las cabeceras de las tablas del administrador y las columnas del Excel.

### Los cortes de nivel

| Escala | Bajo | Medio | Alto |
| --- | --- | --- | --- |
| Dominios de 4 ítems | 0 – 5 | 6 – 11 | 12 – 16 |
| Dominios de 5 ítems | 0 – 6 | 7 – 13 | 14 – 20 |
| Total de conductas riesgosas | 0 – 34 | 35 – 70 | 71 – 104 |

Están en `MODE_THRESHOLDS` y `TOTAL_THRESHOLDS`, en el mismo archivo. Hay
pruebas que comprueban que son los de la tabla del documento, que los máximos
cuadran con el número de ítems (4 puntos por ítem) y que los cortes están
ordenados.

**El total tiene su propia escala y no se deduce de los dominios.** Es la suma
de los 26 ítems contra el rango 0–104. Alguien puede tener el total en BAJO y a
la vez un dominio en ALTO —por ejemplo, autoagresión al máximo y nada más—, y
por eso la pantalla muestra siempre los seis dominios por separado. Hay una
prueba que fija justo ese caso.

**Los colores van al revés que en una escala de recursos**: ALTO en rojo, MEDIO
en amarillo y BAJO en verde, tanto en los resultados como en el panel del
administrador.

### El 0 es una respuesta

La escala empieza en 0 (*nunca*), y en JavaScript el 0 es falso. Cualquier
comprobación de "¿respondió?" tiene que ser `!== undefined`, nunca por
veracidad del valor: si no, quien responde *nunca* se queda sin poder avanzar o
su respuesta se descarta. Hay una prueba del formulario que lo vigila.

## El plan de actividades

La regla de qué abre actividades es **provisional**, a confirmar cuando llegue
el programa. Es la del sistema de origen, dada la vuelta porque aquí lo
preocupante es puntuar alto:

- Solo los dominios en nivel **ALTO** abren plan (`INTERVENTION_LEVEL`).
- Dentro de un dominio alto se abre una actividad por cada ítem respondido con
  **3 o 4** (`ITEM_INTERVENTION_MIN_SCORE`).

Las dos constantes están en `src/constants/questions.ts`, y el resto del código
pregunta a `abreIntervencion` e `itemAbreIntervencion` (`src/lib/scoring.ts`):
**ningún componente debe comparar niveles con "ALTO" o "BAJO" por su cuenta**
para decidir si hay plan.

Los dos filtros van **encadenados**: un dominio en nivel MEDIO con un ítem en 4
no abre nada. Si se quitara el primer filtro casi todo el mundo acabaría con
actividades pendientes, y como tenerlas **bloquea** el segundo intento, mucha
gente quedaría atascada por un ejercicio suelto en un dominio que salió bien.

Un dominio en ALTO tiene siempre al menos un ítem en 3 o 4: con todos en 2 o
menos no se llega al corte (4·2 = 8 < 12, 5·2 = 10 < 14). Hay una prueba que lo
fija, para que nadie vea un dominio en rojo y a la vez "no tienes actividades"
una vez cargado el programa.

Cada actividad son **dos días**, y cada día uno o varios ejercicios. Al terminar
los del día 1 arranca una espera de **12 horas** antes de abrir el día 2, en
`UNLOCK_DELAY_SECONDS` (`src/components/ResultsDisplay/ResultsDisplay.tsx`).
Los temporizadores son independientes por recomendación y siguen corriendo con
la pestaña cerrada: se reconstruyen al cargar a partir de `countdownStartTime`,
guardado en Firestore. No se muestra una cuenta atrás sino la hora absoluta de
desbloqueo —*"se desbloqueará la actividad a las 21:30 del 8 de septiembre"*—.

Durante esa espera se muestra una frase motivacional, cuando las haya cargadas.
Al completar los dos días se abren las preguntas de retroalimentación de esa
recomendación; una recomendación sin preguntas se cierra sin abrir el cuadro.

### Cargar el programa cuando llegue

`recommendations.ts` explica en su cabecera la forma de cada recomendación. Lo
que hay que respetar:

**El texto es el del documento, palabra por palabra.** Son ejercicios clínicos y
una paráfrasis los altera.

**Cada dominio, entero o vacío.** Un dominio a medio cargar es peor que uno
vacío: la pantalla cuenta como "con actividad" todo ítem respondido con 3 o 4,
tenga o no su plan. Hay una prueba que lo exige.

**El `title` de cada recomendación es el enunciado de su ítem en
`questions.ts`**, con `id` `recItemN` y claves de retroalimentación `itemNQ1`,
`itemNQ2`…; hay pruebas para las tres cosas.

**El cuerpo de cada ejercicio es una sucesión de bloques**, no una cadena:
`{ tipo: "parrafo" }` y `{ tipo: "lista" }`, para conservar las viñetas.

**Las imágenes** van en el campo opcional `imagen` (`{ src, alt, width,
height }`), con el archivo en `public/imagenes/actividades/` y `width` y
`height` como sus medidas reales en píxeles.

Las interpretaciones van en `interpretations.ts`, también palabra por palabra;
la tabla del perfil añade sola la columna *Interpretación* en cuanto hay alguna.
Las frases van en `frasesMotivacionales.ts`, sin las comillas que las rodeen en
el documento.

Después de cargarlo hay que revisar dos cosas que hoy no se pueden probar:
confirmar la regla provisional de arriba contra el programa y recorrer el plan
en el navegador. La prueba extremo a extremo del participante tiene anotado el
tramo que hay que volver a añadir.

### Sonidos, celebraciones y medalla

| Momento | Sonido |
| --- | --- |
| Pulsar *Continuar* en los términos y condiciones (`/`) | Bienvenida (`bienvenida.mp3`) |
| Empezar el test, en el primer y en el segundo intento | Bienvenida (`bienvenida.mp3`) |
| Resultados con algún dominio en ALTO | Alarma (`alerta.mp3`) |
| Una actividad suelta | Campanita generada en el navegador |
| Culminar un día, una recomendación o el programa | Ovación (`ovacion.mp3`) |
| Enviar la retroalimentación | Campana de victoria (`campana-de-victoria.mp3`) |
| Medalla (ningún dominio en ALTO) | Subida de nivel, sonido de ganador (`ganador-medalla.mp3`) y confeti dorado |
| Mensaje final, al terminar todas las actividades | Sonido de cierre, una vez (`cierre.mp3`) |

Los archivos están en `public/sonidos/`. La alarma y la medalla suenan **solo
la primera vez** que se muestran los resultados de un intento, que es justo al
terminar el test; al recargar `/results` no se repiten.

La **medalla** aparece solo cuando **ningún** dominio sale en ALTO, y entonces
hay una por cada dominio. En el segundo intento, la de un dominio que estaba en
ALTO en el primero lo cuenta aparte ("redujiste tus conductas de riesgo"); para
saberlo se compara contra `answers`, no contra `testResults`.

En el cuadro de **Orientaciones** aparecen los seis dominios. Los que están en
ALTO llevan *Seguir orientaciones*, que abre la actividad pendiente. Los que
están en BAJO llevan *¡Felicitaciones!*, que lanza confeti. Los de nivel MEDIO
no llevan ninguno de los dos: no tienen actividades, y celebrar un riesgo medio
sería un mensaje equivocado.

## Los dos intentos del test

Cada participante puede hacer el test **dos veces como máximo**, y el segundo
intento existe para medir el efecto de las actividades. La regla vive en
`src/lib/testAccess.ts`:

| Situación | ¿Puede hacer el test? |
| --- | --- |
| Nunca lo hizo | Sí |
| **Le quedan actividades pendientes** | **No**, por mucho tiempo que pase |
| **Completó todas sus actividades** | **Sí, de inmediato**, sin esperas |
| No recibió ninguna actividad | No: no hubo intervención que medir |
| Ya hizo los dos intentos | No |

"No recibió ninguna actividad" se decide **por el número de actividades, no por
el nivel de los dominios**. Con el catálogo vacío, un dominio en ALTO tiene un
plan de 0 actividades con 0 completadas, y contarlo como "todas completadas"
abriría el segundo intento en el acto. Hay una prueba que fija ese caso.

### Dónde se guarda cada intento

El primer intento va en las propiedades estándar y el segundo en las mismas con
sufijo `2`. Nada se sobrescribe:

```jsonc
{
  // Primer intento
  "answers": {},        "testResults": {},
  "testDuration": 180,  "lastTestDate": "…",
  "recommendationProgress1": {},  // archivado al empezar el segundo
  "activityFeedback": {},

  // Segundo intento
  "answers2": {},       "testResults2": {},
  "testDuration2": 200, "lastTestDate2": "…",
  "recommendationProgress": {},   // el plan vigente
  "activityFeedback2": {},

  "hasRetakenTest": true
}
```

`answers` guarda **el puntaje marcado en cada ítem (0 a 4)**. `testResults`
guarda un puntaje y un nivel por cada dominio más uno del total:

```jsonc
"testResults": {
  "sustancias":             { "score": 12, "level": "ALTO"  },
  "evitacionAcademica":     { "score": 3,  "level": "BAJO"  },
  "saludSomatica":          { "score": 7,  "level": "MEDIO" },
  "riesgosInterpersonales": { "score": 0,  "level": "BAJO"  },
  "finanzas":               { "score": 8,  "level": "MEDIO" },
  "autoagresion":           { "score": 0,  "level": "BAJO"  },
  "total":                  { "score": 30, "level": "BAJO"  }
}
```

`recommendationProgress` es siempre el plan **vigente**: al empezar el segundo
intento su contenido se copia a `recommendationProgress1` y se vacía, para que el
panel arranque limpio sin perder la evidencia de qué hizo la persona entre un
test y otro.

### Tres errores del sistema de origen que no hay que reintroducir

**`hasRetakenTest` se escribe al ENVIAR el test, no al empezarlo**, en la misma
operación que las respuestas. Cuando se marcaba al abrir el formulario, quien lo
abandonaba se quedaba con el segundo intento consumido sin haber respondido nada.

**La decisión de en qué casilla escribir no se delega en una marca previa.**
`TestForm.handleSubmit` se lo pregunta a `testAccess.ts` con las respuestas ya en
la mano. Antes, un intento que llegaba sin la marca pisaba el primero.

**Una recomendación se completa al acabar la última actividad del ÚLTIMO día**,
no al empezarlo. Guardar `isCompleted` en cuanto se abría el último día la daba
por terminada en Firestore sin que la persona hubiera hecho la intervención, y
abría el segundo intento.

## Puesta en marcha

Hace falta **Node 22**, y en concreto esa versión mayor: así está fijado en el
campo `engines` de `package.json` (`"node": "22.x"`), que es además lo que Vercel
lee para elegir el runtime del despliegue. `firebase-admin` 14 pide `>=22`: con
una versión anterior el proyecto compila igual, pero las rutas que usan el Admin
SDK fallan al ejecutarse con un error de módulo poco descriptivo.

```bash
node -v         # debe ser v22.x
npm install
npm run dev     # http://localhost:3000
```

Antes de arrancar hace falta un `.env.local` en la raíz, con la forma de
`.env.example`. Las variables `NEXT_PUBLIC_*` salen de Firebase Console ›
Configuración del proyecto › Tus aplicaciones:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

**Sin ellas la compilación falla**, y no en las pantallas sino al prerenderizar:
`next build` corta en `/auth/resetPassword` con `auth/invalid-api-key`. Si ve ese
error, lo primero que hay que mirar es si existe el `.env.local`.

Las dos del Admin SDK salen de Firebase Console › Configuración del proyecto ›
Cuentas de servicio › Generar nueva clave privada. **No son opcionales**: sin
ellas fallan el registro de participantes y la gestión de administradores. La
clave privada va entre comillas, en una sola línea y con los `\n` literales.

```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@test-conductas-riesgosas.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`.env.local` está en `.gitignore` y no debe subirse nunca. Estas mismas
variables hay que darlas de alta en Vercel › Settings › Environment Variables
para que el despliegue funcione.

### Variables opcionales

`NEXT_PUBLIC_UNLOCK_DELAY_SECONDS` acorta la espera entre el día 1 y el día 2,
que en producción es de 12 horas. Sirve para poder recorrer el plan completo en
una sesión de pruebas:

```env
NEXT_PUBLIC_UNLOCK_DELAY_SECONDS=10
```

**No la defina nunca en Vercel**: el desbloqueo se volvería instantáneo y las
actividades perderían su sentido. Un valor que no sea un número positivo se
ignora y se usa el de producción.

### Despliegue

La aplicación se despliega en **Vercel**. Firebase se usa solo como backend
—Auth y Firestore—, no como hosting: `firebase.json` solo contiene las reglas de
Firestore y la configuración de los emuladores que usan las pruebas, y
`.firebaserc` apunta al proyecto `test-conductas-riesgosas`.

Lo único que se publica con la CLI de Firebase son las reglas de seguridad:

```bash
firebase deploy --only firestore:rules
```

**En un proyecto recién creado hay que publicarlas antes de abrir la
aplicación a nadie**: hasta entonces Firestore aplica las reglas con que se creó
la base de datos, que no son las de `firestore.rules`.

### Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Compilación de producción |
| `npm start` | Sirve la compilación de producción |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias y de componentes con Vitest |
| `npm run test:watch` | Vitest en modo continuo |
| `npm run test:rules` | Pruebas de las reglas de Firestore en el emulador |
| `npm run test:e2e` | Pruebas extremo a extremo en Chromium, Firefox y WebKit |

## Crear el primer superadministrador

Un proyecto de Firebase recién creado no tiene a nadie, y sin superadministrador
no se puede dar de alta ningún administrador. Para arrancar:

```bash
node --env-file=.env.local scripts/crear-superadmin.mjs   --email=superadmin@ejemplo.com --password="UnaContraseñaLarga" --aplicar
```

Sin `--aplicar` el script solo mira y no escribe nada; conviene lanzarlo así la
primera vez.

Crea **las dos piezas a la vez**, que es lo importante: la cuenta en Firebase
Authentication y el documento `superadmins/{uid}`, con el mismo uid. Hacen falta
las dos, porque el rol se deduce de la colección en la que vive el documento y se
busca por uid (`AuthContext.resolveUserData`). Un documento creado a mano desde la
consola de Firestore **no sirve**: sin cuenta en Auth nadie puede iniciar sesión.

Para cambiar después el correo o la contraseña de una cuenta ya existente está
`scripts/admin-usuario.mjs`.

### Sobre el correo del superadministrador

Puede ser una dirección inventada. La aplicación no verifica el correo, así que
una cuenta con correo falso entra y funciona igual. Lo único que se pierde es el
botón **"¿Olvidaste tu contraseña?"**: la contraseña se cambia entonces desde
Firebase Console › Authentication › Users › ⋮ › Editar usuario, o con
`scripts/admin-usuario.mjs`.

Hay un argumento a favor de que sea falso: el formulario de recuperación es
público, así que un correo real y conocido es una vía de entrada más a la cuenta
de mayor privilegio del sistema. A cambio, la cuenta de Google del proyecto de
Firebase pasa a ser la única llave, y conviene que tenga verificación en dos
pasos.

## Roles y acceso

Hay tres roles, y **el rol se deduce de la colección en la que existe el
documento** del usuario: `superadmins`, `admins` o `users`. No hay campo de rol.

- **Estudiante** — realiza el test, consulta su perfil y sigue las actividades
  recomendadas.
- **Administrador** — ve y exporta a Excel a los participantes que él mismo
  invitó. **No puede eliminarlos**: las reglas de Firestore cierran el borrado de
  `users` a cualquiera (`allow delete: if false`) y la ruta que lo hace por el
  Admin SDK exige superadministrador.
- **Superadministrador** — gestiona a los administradores.

No existe el borrado de un participante suelto en ninguna pantalla. La única
forma de eliminar participantes es en cascada, al eliminar al administrador que
los invitó, desde el panel del superadministrador.

Nadie se registra por su cuenta: hace falta un **código de invitación** emitido
por un administrador. Se valida en el servidor, en `/api/auth/validate-invitation`,
y no en el navegador, porque la comprobación ocurre antes de que exista la cuenta
y hacerla desde el cliente obligaría a dejar la colección `admins` legible sin
sesión.

## Estructura

```
src/
├── app/
│   ├── api/
│   │   ├── admin/                 # Eliminar administradores y participantes
│   │   ├── auth/                  # Cookie de sesión y código de invitación
│   │   └── createAdmin/           # Alta de administradores
│   ├── auth/                      # Login, registro y recuperación
│   ├── dashboard/                 # Un panel por rol: user, admin, superadmin
│   ├── home/  results/  test/
│   └── layout.tsx  page.tsx
├── components/
│   ├── auth/                      # Formularios y Redirect
│   ├── dashboard/                 # Paneles de User, Admin y SuperAdmin
│   ├── ResultsDisplay/            # Resultados, actividades y perfil
│   └── TestForm/                  # Cuestionario
├── constants/
│   ├── questions.ts               # Los 26 ítems, los dominios, los cortes y la regla de intervención
│   ├── recommendations.ts         # Actividades por ítem y día (vacío, pendiente)
│   ├── interpretations.ts         # Interpretación por nivel (vacío, pendiente)
│   └── frasesMotivacionales.ts    # Frases de la espera entre días (vacío, pendiente)
├── contexts/AuthContext.tsx
├── lib/
│   ├── auth/verifySession.ts      # Verificación del token con jose
│   ├── celebracion.ts             # Confeti al completar actividades
│   ├── firebase/                  # config.ts (cliente) y admin.ts (servidor)
│   ├── scoring.ts                 # Puntuación y apertura de actividades
│   ├── sonido.ts                  # Efectos de sonido
│   ├── testAccess.ts              # Quién puede hacer el test
│   └── terms.ts                   # Consentimiento informado
├── test/catalogoDePrueba.ts       # Catálogo de mentira para las pruebas
├── middleware.ts
└── types/
```

## Decisiones que conviene conocer antes de tocar el código

**La protección de rutas son dos capas y hacen cosas distintas.**
`src/middleware.ts` verifica criptográficamente la cookie `__session` con `jose`
contra las claves públicas de Google en `/dashboard/*`, `/test` y `/results`;
solo comprueba que hay sesión, porque el rol no viaja en el token.
`src/components/auth/Redirect.tsx` es la **única fuente de verdad** de la
navegación por rol. Los componentes no deben añadir sus propios `router.push` de
autorización: hacerlo provocó redirecciones que competían entre sí.

**Las consultas del panel filtran por `invitationCode` en el servidor.**
Firestore no recorta los resultados según las reglas de seguridad: si un solo
documento del resultado no pasa la regla, rechaza la consulta entera. El filtro
no es una optimización, es lo que hace que la consulta funcione.

**Quién puede repetir el test lo decide `src/lib/testAccess.ts`, y solo ese
archivo.** `UserDashboard`, `app/test/page.tsx` y el botón de `ResultsDisplay` se
limitan a preguntarle. **No hay plazo de espera**: la condición es completar las
actividades.

**El desbloqueo entre días son 12 horas**, en `UNLOCK_DELAY_SECONDS`. Para
acortarlo en pruebas está `NEXT_PUBLIC_UNLOCK_DELAY_SECONDS`; si el temporizador
parece instantáneo donde no debería, esa variable es lo primero que hay que
mirar.

**Las barras del perfil van en porcentaje, no en puntaje crudo.** Los dominios
tienen máximos distintos —16 y 20—, y dibujarlas con el puntaje haría parecer
más graves los dominios de cinco ítems solo por tener uno más.

**Los avisos de `npm audit` sobre XLSX no aplican a este proyecto.** El export
del panel usa `xlsx` 0.18.5, que arrastra vulnerabilidades conocidas de
**análisis de archivos recibidos de terceros**. Aquí la biblioteca solo se usa
para *escribir* el archivo de exportación en `OtherData.tsx`: nunca se lee un
`.xlsx` que venga de fuera. Si algún día el sistema empieza a importar hojas de
cálculo, la vía es el paquete que SheetJS publica en su propio registro
(`cdn.sheetjs.com`), no el de npm.

**El registro está abierto por enlace, y es deliberado.**
`src/components/auth/RegisterFormUser.tsx` trae el código de invitación
precargado en `DEFAULT_INVITATION_CODE`. No es un descuido: el flujo previsto es
repartir solo el enlace y que la persona se registre sin fricción, y quien reciba
el código de otro administrador lo sobrescribe en el campo, que es editable. **No
lo quite pensando que corrige una fuga**: eso rompería el registro por enlace.

La consecuencia hay que tenerla presente: el código de invitación **no es un
control de admisión**. Cualquiera con la URL se registra y queda asociado a ese
administrador. Lo que sí está protegido es la privacidad —las reglas de Firestore
impiden que un registrante lea el expediente de nadie más—, así que el coste real
es de calidad del dato: registros de prueba, duplicados y gente ajena al estudio.

**El código precargado tiene que existir en este proyecto.** Si ningún
administrador de `test-conductas-riesgosas` tiene el código de
`DEFAULT_INVITATION_CODE`, el registro por enlace falla para todo el que entre
por él. Al cambiarlo, compruebe que es el de un administrador real —el que
aparece en su panel—.

**Rotar un `invitationCode` a mano no es una operación inocua.** Los documentos
de `users` guardan una copia del código con el que se registraron, y tanto las
consultas del panel como las reglas de Firestore comparan esa copia con el código
*actual* del administrador. Cambiarlo lo dejaría sin ver a ninguno de sus
participantes salvo que se migren todos sus documentos, y el borrado en cascada,
que busca también por `adminId`, se los seguiría llevando por delante.
Cambiarle el correo o la contraseña, en cambio, es seguro: el uid no se mueve.

## Pruebas

```bash
npm test
```

Cubren la lógica pura —la puntuación por dominio y del total, las fronteras de
los niveles con los cortes del documento, qué abre intervención, la coherencia
del catálogo de recomendaciones, las reglas del segundo intento y la
verificación de la sesión— y los componentes con más lógica: la navegación por
rol (`Redirect`), el cuestionario (`TestForm`), el formulario de registro y la
pantalla de resultados (`ResultsDisplay`). Los componentes se prueban en jsdom
con Firebase simulado, así que no hace falta navegador ni conexión.

Como el catálogo real está vacío, las pruebas del plan de actividades y del
segundo intento usan uno de mentira (`src/test/catalogoDePrueba.ts`), con una
recomendación por ítem. Las del catálogo real
(`src/constants/recommendations.test.ts`) pasan hoy sin comprobar nada y
empiezan a vigilar en cuanto se cargue el programa.

### Reglas de Firestore

```bash
npm run test:rules
```

Comprueban `firestore.rules` contra el emulador de Firestore, con un proyecto
`demo-conductas-riesgosas` que la CLI de Firebase nunca conecta con la nube: no
tocan producción. Necesitan la CLI (`npm install -g firebase-tools`) y **Java 21
o superior**, que el emulador exige. Lance estas pruebas antes de publicar
cualquier cambio en las reglas.

### Extremo a extremo

```bash
npm run test:e2e
```

Recorren la aplicación en un navegador de verdad —registro, test, resultados,
panel del administrador y alta y baja de administradores con su cascada— en los
motores Chromium, Firefox y WebKit, contra los emuladores de Auth y Firestore con
el proyecto `demo-conductas-riesgosas`. Necesitan lo mismo que las reglas y los
navegadores de Playwright (`npx playwright install chromium firefox webkit`).

Mientras no haya programa, el recorrido del participante comprueba que un
dominio en riesgo no abre un plan vacío ni el segundo intento. El tramo del plan
—día 1, espera y día 2— se volverá a añadir al cargar el programa.

Para hablar con los emuladores la aplicación tiene un modo de prueba. En el
cliente lo activa `NEXT_PUBLIC_FIREBASE_EMULATORS=1`; en el servidor,
`FIREBASE_AUTH_EMULATOR_HOST`, y solo fuera de una compilación de producción,
porque en ese modo la sesión se acepta sin firma
(`src/lib/firebase/emulators.ts`). **No defina ninguna de las dos en Vercel.**

### Rendimiento

**No hay mediciones, y no conviene hacerlas todavía.** La pantalla de resultados
y el plan de actividades cambiarán al cargar el programa de intervención, y una
medición de una versión que no es la definitiva no sirve como evidencia. Se
harán con el programa terminado.

Para entonces hace falta Lighthouse y una compilación de producción:

```bash
npm run build
PORT=3002 npm start

# En otra terminal, una página cada vez:
npx lighthouse http://localhost:3002/ --output=html --output=json   --output-path=docs/verificacion/consentimiento --preset=desktop
```

Sin `--preset=desktop` se mide el perfil móvil, que es el que conviene mirar:
es como la mayoría de los participantes van a abrir la aplicación.

Las rutas que exigen sesión —`/dashboard/user`, `/results` y `/test`— no se
pueden medir así, porque Lighthouse borra el almacenamiento antes de medir y la
sesión se pierde. Para esas está `scripts/medir-rutas-protegidas.mjs`, que inicia
sesión por la interfaz y mide en un *user flow*. Necesita dos participantes de
prueba, uno con el test hecho y otro sin hacerlo, que puede crear con
`scripts/sembrar-datos-de-prueba.mjs`.

```bash
PART_EMAIL=... PART_PASS=... PART2_EMAIL=... PART2_PASS=...   node scripts/medir-rutas-protegidas.mjs
```

Cuando se hagan, hay que dejar constancia de la fecha, la versión de Lighthouse
y el equipo: sin eso una medición no es reproducible.
