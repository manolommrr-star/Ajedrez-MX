# Núcleo funcional

## Entidades principales y sus repositorios

### 1. Player (Jugador)
**Archivo:** `js/core/playersRepository.js`
- `getPorId(id)` → obtiene un jugador por ID
- `buscar(texto)` → busca por nombre, apellidos, FIDE ID o club
- `crearJugador(datos)` → crea jugador (limpia campos vacíos, normaliza ELO)

**Campos jugador:** id, nombre, apellidos, fechaNacimiento, fideId, federacion, club, elo, titulo, email, telefono, ciudad, estado, fechaCreacion

---

### 2. Tournament (Torneo)
**Archivo:** `js/repositories/tournamentRepository.js`
- Gestión de torneos: crear, publicar, cancelar
- Estados: draft → publicado → cancelado/archivado

**Campos torneo:** id, nombre, fecha, ciudad, estado, modalidad, cupo, categorias[], precio total, inscritos, estadoPublicacion

---

### 3. Registro/Inscripción
**Archivo:** `js/core/registrationsRepository.js`

#### Máquina de estados
```
pendiente → pago_pendiente → pago_en_revision → pagada → confirmada → checkin → retirada
```

#### Transiciones válidas
| Desde | Hacia |
|-------|-------|
| pendiente | pago_pendiente, cancelada, rechazada |
| pago_pendiente | pago_en_revision, pagada, cancelada |
| pago_en_revision | pagada, rechazada, cancelada |
| pagada | confirmada, retirada |
| confirmada | checkin, retirada, cancelada |
| checkin | retirada |

#### Funciones
- `inscribir()` → valida: torneo publicado, cupo disponible, categoría válida, sin duplicados
- `cancelarDeJugador()` → solo estados tempranos (pendiente, pago_pendiente)
- `actualizarEstado()` → valida transición, registra en historial

---

### 4. Payment (Pago)
**Archivo:** `js/core/paymentsRepository.js`
- `getPagos()` → lista todos los pagos (más recientes primero)
- `getCobrado()` → suma total pagado
- `getConteoPorEstado()` → conteo para chips de filtro
- `simularWebhook(pagoId)` → confirma pago + actualiza inscripción asociada
- `reembolsar()` / `marcarProcesando()` → solo demo local

**Estados pago:** pendiente → procesando → pagado → reembolsado

---

### 5. Events (Eventos)
**Archivo:** `js/core/eventsRepository.js`
- Eventos asociados a torneos (rondas, categorías, premios)

---

### 6. Cuentas/Sesión
**Archivo:** `js/core/cuentasRepository.js` + `js/core/sesion.js`
- Roles: `jugador` (player), `organizador` (organizer)
- `iniciarSesion()`, `cerrarSesion()`, `getCuenta()`, `getJugador()`, `getOrganizador()`

Próximo doc: [03-flujos.md](03-flujos.md)