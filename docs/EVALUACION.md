<!-- evaluacion:inicio -->
# Evaluación — TaskMate-AI-proyecto/TaskMateAI-programacion3

> Documento **generado automáticamente** por la cátedra de Programación III (RepoSense + análisis de calidad + constancia). **No editar a mano**: se regenera en cada evaluación.
> Rama evaluada: `main`. Análisis **heurístico** (regex + métricas): es una criba para orientar la revisión, **no una nota**.
> Generado: 2026-11-20.

## 1. Veredicto

| Aspecto | Resultado |
|---|---|
| Tipo de proyecto | app |
| Índice de calidad de servicios | **50/100** (mínimo 50) |
| Criterios cumplidos | **14/16** |
| Aprobado (semáforo) | **SI** |
| Código (LOC) | 15,172 |
| Archivos de código | 333 |
| Tests (archivos) | 128 |
| Cobertura de líneas | 96.7% (mínimo 80%) |
| Capas detectadas | presentacion, logica, datos, vistas, servicios, estado |
| Pushes directos a `main` (sin PR) | 2 |
| Tope por duplicación | `DUP>=15%` → índice ≤ 50 |

> **Pushes directos:** se detectaron **2** commit(s) a `main` que no pasaron por un Pull Request. El flujo esperado es **rama → PR → revisión → merge**; el PR se aprueba con el mensaje `Aprobado`. Evitá pushear directo a `main`: la ruleset lo bloquea y el commit directo queda auditado.

> **Aprobado** exige las compuertas críticas (**SEC**, **SQL**, **capas**, **índice ≥ 50** y **cobertura ≥ 80 %** cuando aplica) y tolera hasta **3 criterios en rojo** (12/15). No es una nota: sirve para ordenar y priorizar la revisión.

## 2. Autoría (RepoSense)

| Autor | Commits | Código (LOC) | Tests (LOC) | Docs (LOC) | Días activos | % del código |
|---|---:|---:|---:|---:|---:|---:|
| santi-dona | 37 | 18,566 | 11,461 | 728 | 16 | 100% |

> _El LOC de autoría lo calcula RepoSense sobre el historial y puede diferir del LOC de código del análisis de calidad (que mira solo el estado de `main`)._

## 3. Constancia (IC) — todas las ramas

> El IC mide **cuándo** se trabajó (sesiones por semana, pausas y recencia), no cuánto ni con qué calidad. Se calcula sobre **todas las ramas** de todos los repositorios del alumno, no sólo `main`.

| Alumno | Sesiones | Cumplimiento | Pausa | Recencia | IC | Nivel | Para subir de nivel |
|---|--:|--:|--:|--:|--:|--|--|
| santi-dona | 12 | 42% | 21 d | 86% | **40** | No aprueba | Cumplimiento 42% (mín. 50%) |

> Para aprobar el IC: **2 sesiones por semana** sostenidas, sin pausas mayores a **10 días** y con actividad en las **últimas 2 semanas**. Se excluyen merges, bots y al docente. Zona horaria UTC-3.

## 4. Aspectos evaluados

Cada aspecto indica **qué mide**, **por qué importa** y **tu resultado**. Cuando el resultado está en rojo, se agregan preguntas para **investigar la causa** (no hay recetas: entender el porqué es parte de la evaluación).

### 1. Índice de calidad de servicios (indice) — OK

- **Qué mide:** Un resumen numérico (0-100) que combina todas las señales y métricas del análisis, con topes duros por duplicación.
- **Por qué importa:** Ordena y prioriza la revisión: un índice bajo indica varias señales que conviene mirar juntas.
- **Tu resultado:** índice **50/100** _(mínimo 50)_

### 2. Duplicación (DRY) (duplicacion) — A REVISAR

- **Qué mide:** Porcentaje de bloques de código repetidos (similitud) en el repositorio.
- **Por qué importa:** Cada copia se mantiene por separado: un arreglo hay que repetirlo y los defectos se multiplican.
- **Tu resultado:** **19.8%** de duplicación _(máximo 15%)_
- **Para investigar la causa:**
    - ¿El trabajo se repartió por pantallas o archivos y se integró copiando y pegando bloques?
    - ¿Qué zonas del sistema cambiaron juntas más de una vez (señal de lógica compartida)?
    - ¿Hubo un lugar común acordado para la lógica repetida antes de empezar, o cada integrante resolvió lo suyo?

### 3. Secretos hardcodeados (SEC) — OK

- **Qué mide:** Credenciales, tokens o claves escritos directamente en el código en vez de leerse de variables de entorno.
- **Por qué importa:** Un secreto en el repositorio queda expuesto en el historial aunque luego se borre, y compromete al servicio y a sus usuarios.
- **Tu resultado:** **0** secreto(s) hardcodeado(s) _(máximo 0)_

### 4. Consultas SQL por concatenación (SQL) — OK

- **Qué mide:** Consultas SQL armadas concatenando o interpolando valores en vez de usar parámetros.
- **Por qué importa:** Es la puerta clásica a inyección: un valor que llega de afuera puede cambiar la consulta.
- **Tu resultado:** **0** consulta(s) SQL por concatenación _(máximo 0)_

### 5. Separación en capas (capas) — OK

- **Qué mide:** Si el código está separado en capas reconocibles (backend: presentación / lógica / datos; frontend: vistas / servicios / estado).
- **Por qué importa:** Sin separación, cada archivo hace de todo y cualquier cambio toca varios lugares a la vez.
- **Tu resultado:** **6** capa(s) detectada(s): presentacion, logica, datos, vistas, servicios, estado _(mínimo 2 capas (a partir de 150 LOC))_

### 6. Acceso a datos dentro del componente (HTTP) — OK

- **Qué mide:** Llamadas `fetch`/`axios` dentro de componentes de UI en vez de una capa de servicios/API.
- **Por qué importa:** Duplica la lógica de acceso a datos y acopla la vista al backend: un cambio de API toca muchos componentes.
- **Tu resultado:** **0** llamada(s) a la API dentro de componente(s) _(máximo 0)_

### 7. Depuración olvidada (DBG) — OK

- **Qué mide:** Mensajes de depuración olvidados (`console.log`, `print`, `debugger`).
- **Por qué importa:** Generan ruido en los registros, pueden filtrar datos y dan sensación de código sin terminar.
- **Tu resultado:** **0** mensaje(s) de depuración olvidado(s) _(máximo 0)_

### 8. Uso del tipo `any` (Any) — OK

- **Qué mide:** Uso de `any` en TypeScript, que desactiva la verificación de tipos.
- **Por qué importa:** Se pierde la ayuda del compilador justo donde los datos vienen de afuera (API, formularios).
- **Tu resultado:** **0** uso(s) de `any` _(máximo 2)_

### 9. Componente demasiado grande (BigC) — A REVISAR

- **Qué mide:** Componentes de UI muy extensos, que suelen mezclar render, estado y lógica.
- **Por qué importa:** Son difíciles de leer, probar y reutilizar, y sus cambios tienen efectos inesperados.
- **Tu resultado:** **6** componente(s) demasiado grande(s) _(máximo 1)_
- **Para investigar la causa:**
    - ¿El componente creció a medida que se agregaban requisitos, sin volver a dividirlo?
    - ¿Mezcla responsabilidades distintas (mostrar, calcular, pedir datos)?
    - ¿Se dividió por pantalla o por unidad de responsabilidad?

### 10. Baja cohesión (Coh) — OK

- **Qué mide:** Una clase o unidad cuyos métodos y campos no están relacionados entre sí.
- **Por qué importa:** Una unidad que cambia por motivos distintos es frágil y cuesta entenderla.
- **Tu resultado:** **0** unidad(es) con baja cohesión _(máximo 0)_

### 11. Complejidad alta (Compl) — OK

- **Qué mide:** Complejidad ciclomática: cantidad de caminos posibles dentro de una función (condicionales, bucles, casos).
- **Por qué importa:** Muchos caminos = difícil de seguir y de probar; suelen esconderse casos sin cubrir.
- **Tu resultado:** **24** bloque(s) de complejidad alta _(máximo 5 por 1000 LOC (tenés 15172 LOC))_

### 12. Funciones/métodos largos o con muchos parámetros (Tam) — OK

- **Qué mide:** Tamaño de las funciones/métodos y cantidad de parámetros.
- **Por qué importa:** Una función que hace varias cosas cuesta leerla, nombrarla y reutilizarla.
- **Tu resultado:** **51** función/método(s) largos o con muchos parámetros _(máximo 10 por 1000 LOC)_

### 13. Acoplamiento alto (Acop) — OK

- **Qué mide:** Cuánto depende una unidad de las partes internas de otra.
- **Por qué importa:** Piezas muy enlazadas hacen que un cambio se propague y que sea difícil reemplazar partes.
- **Tu resultado:** **4** unidad(es) con acoplamiento alto _(máximo 2 por 1000 LOC)_

### 14. Cobertura de tests (Cob) — OK

- **Qué mide:** Porcentaje de líneas de código ejecutadas por la suite de tests (cobertura real, no cantidad de archivos de test).
- **Por qué importa:** Un test que existe pero no ejecuta el código no protege de nada: la cobertura muestra qué partes quedan sin verificar.
- **Tu resultado:** **96.7%** de líneas cubiertas · fuente: ejecución: pytest · salteado: apps/frontend-vue, apps/frontend-react _(mínimo 80% de líneas)_

### 15. Endpoints del backend (EP) — OK

- **Qué mide:** Cantidad de endpoints (rutas HTTP) expuestos por el backend.
- **Por qué importa:** El backend se mide por lo que expone: pocos endpoints sugiere poca funcionalidad de servicio.
- **Tu resultado:** **40** endpoint(s) _(mínimo 5)_

### 16. Vistas del frontend (Vistas) — OK

- **Qué mide:** Cantidad de vistas/componentes de pantalla del frontend.
- **Por qué importa:** El frontend se mide por pantallas: pocas vistas sugiere poca cobertura de la interfaz pedida.
- **Tu resultado:** **167** vista(s)/componente(s) _(mínimo 6)_

## 5. Observaciones y qué falta

**Aprobado con observaciones.** Estos criterios quedan en rojo (se permiten hasta **3** sin que sean compuertas críticas), así que no bloquean la aprobación pero conviene corregirlos:

| Criterio | Resultado actual | Meta | Brecha | Cómo alcanzarlo |
|---|---|---|---|---|
| Duplicación (DRY) (duplicacion) | **19.8%** de duplicación | máximo 15% | sobran 4.8 pts | Ubicá los bloques repetidos con `jscpd` o SonarQube, llevá la lógica común a una función o módulo compartido y hacé que todos lo usen. Cada copia eliminada baja el porcentaje; meta ≤15%. |
| Componente demasiado grande (BigC) | **6** componente(s) demasiado grande(s) | máximo 1 | 5 componente(s) de más | Dividí el componente por responsabilidad en subcomponentes (render, estado, acceso a datos) y dejá el original sólo como orquestador. Meta: ≤1 componente grande. |

## 6. Actividad en clase y fuera de clase

> Se consideran las **29 clases** del período (miércoles y viernes, según `config/constancia.json`; feriados y semanas sin clase descontados). Para cada alumno se muestra la actividad **en cada clase** y también la actividad **fuera de los días de clase** (fines de semana u otros días). `Commits` = commits de trabajo (no-merge); `Merges` = merges de PR (también son push). Los días sin actividad dicen **sin actividad**.

### santi-dona

**15/29 clases con actividad** · total del período: 39 commits · 29 merges

| Fecha | Actividad | Repositorios | Commits / merges |
|---|:--:|---|--:|
| 2026-08-14 | **Sí** | TaskMateAI-programacion3 | 1 / 0 |
| 2026-08-19 | **Sí** | TaskMateAI-programacion3 | 1 / 0 |
| 2026-08-21 | No | sin actividad | 0 / 0 |
| 2026-08-26 | **Sí** | TaskMateAI-programacion3 | 2 / 2 |
| 2026-08-28 | **Sí** | TaskMateAI-programacion3 | 1 / 0 |
| 2026-09-02 | **Sí** | TaskMateAI-programacion3 | 2 / 1 |
| 2026-09-04 | **Sí** | TaskMateAI-programacion3 | 2 / 2 |
| 2026-09-09 | **Sí** | TaskMateAI-programacion3 | 1 / 1 |
| 2026-09-11 | No | sin actividad | 0 / 0 |
| 2026-09-16 | No | sin actividad | 0 / 0 |
| 2026-09-18 | No | sin actividad | 0 / 0 |
| 2026-09-23 | No | sin actividad | 0 / 0 |
| 2026-09-25 | No | sin actividad | 0 / 0 |
| 2026-09-30 | **Sí** | TaskMateAI-programacion3 | 4 / 2 |
| 2026-10-02 | **Sí** | TaskMateAI-programacion3 | 6 / 4 |
| 2026-10-07 | **Sí** | TaskMateAI-programacion3 | 4 / 3 |
| 2026-10-09 | No | sin actividad | 0 / 0 |
| 2026-10-14 | No | sin actividad | 0 / 0 |
| 2026-10-16 | **Sí** | TaskMateAI-programacion3 | 2 / 2 |
| 2026-10-21 | No | sin actividad | 0 / 0 |
| 2026-10-23 | No | sin actividad | 0 / 0 |
| 2026-10-28 | **Sí** | TaskMateAI-programacion3 | 3 / 4 |
| 2026-10-30 | **Sí** | TaskMateAI-programacion3 | 4 / 3 |
| 2026-11-04 | No | sin actividad | 0 / 0 |
| 2026-11-06 | **Sí** | TaskMateAI-programacion3 | 5 / 4 |
| 2026-11-11 | No | sin actividad | 0 / 0 |
| 2026-11-13 | No | sin actividad | 0 / 0 |
| 2026-11-18 | **Sí** | TaskMateAI-programacion3 | 1 / 1 |
| 2026-11-20 | No | sin actividad | 0 / 0 |

**Fuera de clase:** 1 fecha(s) con actividad · 0 commits · 1 merges

| Fecha | Repositorios | Commits / merges |
|---|---|--:|
| 2026-11-10 | TaskMateAI-programacion3 | 0 / 1 |

## 7. Anexo: archivos donde se originan los problemas

Se listan los archivos y líneas que el análisis marca para cada criterio en rojo. Para **duplicación** se muestran los archivos con más líneas repetidas; para **cobertura**, las unidades por debajo del umbral.

**Duplicación (duplicacion)** — archivos con más líneas repetidas:

- `apps/frontend-react/src/types/api.ts` — 125 línea(s) duplicada(s)
- `apps/frontend-vue/src/types/api.ts` — 118 línea(s) duplicada(s)
- `apps/frontend-vue/src/settings/settings.ts` — 88 línea(s) duplicada(s)
- `apps/frontend-react/src/settings/settings.ts` — 88 línea(s) duplicada(s)
- `apps/frontend-react/src/components/tasks/taskUtils.ts` — 74 línea(s) duplicada(s)
- `apps/frontend-vue/src/utils/taskUtils.ts` — 74 línea(s) duplicada(s)
- `apps/frontend-vue/src/command-palette/commandSearch.ts` — 61 línea(s) duplicada(s)
- `apps/frontend-react/src/command-palette/commandSearch.ts` — 61 línea(s) duplicada(s)
- `apps/frontend-vue/src/command-palette/paletteEntries.ts` — 55 línea(s) duplicada(s)
- `apps/frontend-react/src/command-palette/paletteEntries.ts` — 55 línea(s) duplicada(s)
- `apps/frontend-react/src/theme/theme.ts` — 52 línea(s) duplicada(s)
- `apps/frontend-vue/src/theme/theme.ts` — 52 línea(s) duplicada(s)
- `apps/frontend-react/src/utils/aiText.ts` — 45 línea(s) duplicada(s)
- `apps/frontend-vue/src/utils/aiText.ts` — 45 línea(s) duplicada(s)
- `apps/frontend-react/src/command-palette/shortcuts.ts` — 37 línea(s) duplicada(s)

**Componente demasiado grande (BigC)** — 6 hallazgo(s) en 6 archivo(s):

| Archivo | Línea(s) | Señal |
|---|---|---|
| `apps/frontend-react/src/command-palette/CommandPalette.tsx` | 1 | componente grande (213 líneas) |
| `apps/frontend-react/src/components/friends/FriendsModal.tsx` | 1 | componente grande (167 líneas) |
| `apps/frontend-react/src/components/otp/GlassyOTP.tsx` | 1 | componente grande (167 líneas) |
| `apps/frontend-vue/src/components/command-palette/CommandPalette.vue` | 1 | componente grande (173 líneas) |
| `apps/frontend-vue/src/views/DashboardView.vue` | 1 | componente grande (172 líneas) |
| `apps/frontend-vue/src/views/TasksView.vue` | 1 | componente grande (193 líneas) |

---
_Informe generado por la cátedra. Los umbrales corresponden al perfil `exigente`. Ante dudas, revisá el archivo y la línea señalados y el criterio en `CRITERIOS-CALIDAD.md`._
<!-- evaluacion:fin -->
