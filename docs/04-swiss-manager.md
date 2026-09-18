# 04 · Exportación de jugadores a Swiss Manager

Función: **Panel → Torneos → Participantes → "TXT (Swiss Manager)" o "XML (Swiss Manager)"**.

## Qué genera la app

Un archivo `jugadores_<torneo>.txt` listo para el asistente de importación:

| Propiedad | Valor |
|---|---|
| Separador | **Tabulación** (`\t`) |
| Finales de línea | **CRLF** (Windows) |
| Codificación | **Windows-1252 (ANSI)** — los acentos (Ramírez, Ñ, é) se ven bien; no usar UTF-8 |
| Filas | Solo inscripciones en estados **pagada, confirmada, checkin** (los pendientes/cancelados quedan fuera; opción `incluirTodos` en el módulo) |

## Columnas (orden fijo, 11)

| # | Columna | Origen | Normalización aplicada |
|---|---|---|---|
| 1 | Apellidos | `jugador.apellidos` | — |
| 2 | Nombre | `jugador.nombre` | — |
| 3 | Federacion | `jugador.federacion` | `FENAMAC` → `MEX`; vacío → `MEX`; solo códigos de 3 letras |
| 4 | FIDE ID | `jugador.fideId` | — |
| 5 | Elo | `jugador.elo` | vacío si 0 o nulo |
| 6 | Titulo | `jugador.titulo` | solo títulos FIDE (GM/IM/FM/CM/W*); `MN` u otros nacionales → vacío |
| 7 | Sexo | `jugador.sexo` | `M`/`F`; **no se captura aún** → columna vacía |
| 8 | FechaNacimiento | `jugador.fechaNacimiento` | `1994-05-12` → `12.05.1994` |
| 9 | Club | `jugador.club` | — |
| 10 | Ciudad | `jugador.ciudad` | — |
| 11 | Categoria | `inscripcion.categoria` | debe coincidir con las categorías configuradas en Swiss Manager |

**Advertencias**: antes de descargar, la UI lista jugadores sin FIDE ID, sin Elo o sin club — compléantalos en el asistente o en la ficha del jugador.

## Importación en Swiss Manager (una sola vez)

1. Crea el torneo nuevo y define sus categorías antes de importar (los valores de la columna 11 deben existir).
2. **File → Import players from text file** (según versión: `Spieler aus Textdatei importieren`).
3. En el asistente:
   - Selección de archivo → `jugadores_xalapa_chess_open.txt`
   - **Separator: Tabulator** y codificación **ANSI/Windows** (no UTF-8)
   - Marca "first line contains field names" (la fila 1 es la cabecera) o salta 1 línea si tu versión no lo soporta
   - Mapea columna → campo:

| Columna del TXT | Campo en Swiss Manager |
|---|---|
| 1 Apellidos | Last name |
| 2 Nombre | First name |
| 3 Federacion | Federation |
| 4 FIDE ID | FIDE ID |
| 5 Elo | FIDE rating |
| 6 Titulo | Title |
| 7 Sexo | Sex (si tu versión lo soporta; si no, omítela) |
| 8 FechaNacimiento | Date of birth |
| 9 Club | Club |
| 10 Ciudad | City |
| 11 Categoria | Category |

4. **Guarda el perfil de importación** (import profile): las siguientes veces es un clic.
5. Verifica: conteo de jugadores importado = número del toast de la app; nombres con acento correctos; Elo y fecha bien ubicados.

## Checklist de verificación (Estado: PENDIENTE — primer import real)

- [ ] El asistente acepta el archivo sin errores
- [ ] 5 jugadores del demo (Xalapa Chess Open) aparecen en la lista
- [ ] "Ramírez" y "Gutiérrez" sin caracteres raros (prueba ANSI)
- [ ] Elo 1540/1608/… en columna de rating FIDE
- [ ] Fecha `12.05.1994` reconocida como fecha (no texto)
- [ ] Las categorías del torneo coinciden con las configuradas

Si algo falla, anota qué campo quedó mal y ajustamos el orden/formato del TXT (el módulo es `app/src/integrations/swissManagerExport.js`).

## Notas técnicas

- Codificador cp1252: `app/src/utils/cp1252.js`. Caracteres no representables → `?`.
- El CSV "Excel" (UTF-8 con BOM) sigue disponible para hojas de cálculo; el TXT es específicamente para Swiss Manager.
- Smoke test: `app/.smoke/smoke-swiss.mjs` (29 validaciones de bytes, columnas, normalizadores, filtro de estados y XML).

## XML (alternativa al TXT)

Además del TXT, la app genera un archivo `torneo_<nombretorneo>.xml` con estructura `<Players>` / `<Player>` que Swiss Manager reconoce vía **File → Import → Import Players (XML)**.

| Atributo del `<Player>` | Origen | Normalización |
|---|---|---|
| `PlayerUniqueId` | índice de la lista (1..n) | — |
| `Lastname` | `jugador.apellidos` | escapado en XML |
| `Firstname` | `jugador.nombre` | escapado en XML |
| `Federation` | `jugador.federacion` | `FENAMAC` → `MEX`; vacío → `MEX`; códigos de 3 letras se respetan |
| `Rating` | `jugador.rating` | vacío si no hay |
| `Birthday` | `jugador.fechaNacimiento` | `1994-05-12` → `19940512` |
| `Title` | `jugador.titulo` | solo títulos FIDE (GM/IM/FM/CM/W*); `MN` u otros nacionales → vacío |
| `FIDEId` | `jugador.fideId` | FIDE ID (puede estar vacío) |
| `NatId` | — | siempre vacío |
| `Gender` | `jugador.sexo` | `M`/`F`; sin datos → vacío |
| `Club` | `jugador.club` | escapado en XML |

**Ejemplo de XML generado:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<Players>
    <Player PlayerUniqueId="1" Lastname="Torres" Firstname="Ana" Federation="MEX" Rating="1876" Birthday="19940512" Title="" FIDEId="5123456" NatId="" Gender="" Club="Club de Ajedrez Xalapa" />
    <Player PlayerUniqueId="2" Lastname="Ramírez" Firstname="Luis" Federation="MEX" Rating="1608" Birthday="20011103" Title="" FIDEId="5123457" NatId="" Gender="" Club="Club Coatepec" />
    ...
</Players>
```

Solo se exportan las inscripciones en estado **pagada, confirmada o checkin**.
