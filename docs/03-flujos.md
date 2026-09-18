# Flujos de usuario

## Flujo Jugador (online)
1. Navega catálogo (`#/`)
2. Ve detalle (`#torneo/:id`)
3. Se inscribe (`#torneo/:id/inscribirse`) → crea jugador + inscripción en estado "pendiente"
4. Paga (`#pagar/:folio`) → simula pago local, cambia a "pagada"
5. Check-in → valida folio, cambia a "checkin"

## Flujo Organizador (panel)
1. Accede (`#/acceder` → login con cuenta de organizador)
2. Dashboard (`#/panel`) → estadísticas y acceso rápido
3. Gestiona torneos (`#/panel/torneos`) → publicar/despublicar, duplicar, crear y editar
4. Ver inscripciones (`#/panel/torneo/:id` → pestaña Inscripciones) → tabla con JOINs y cambio de estado
5. Ver pagos (`#/panel/torneo/:id` → pestaña Pagos) → lista, reembolsar, pago manual
6. Check-in (`#/panel/torneo/:id` → pestaña Check-in) → marcar asistencia
7. Exportar participantes → TXT/XML/CSV (Swiss Manager) desde la pestaña Participantes
   (el avance de QR sigue siendo una maqueta visual en `#/panel/configuracion`)

## Flujo Demo
**Usuarios demo:**
- Jugador: `ana.torres@correo.mx` (password: `demo1234`)
- Organizador: `contacto@ajedrezxalapa.mx` (password: `demo1234`)

**Torneos demo:** 12 torneos (11 publicados + 1 borrador) en `app/src/data/mockRelacionalTorneos.js`

## Estados de inscripción
```
pendiente → pago_pendiente → pago_en_revision → pagada → confirmada → checkin → retirada
```

## Estados de pago
```
pendiente → procesando → pagado → reembolsado
```

## Validaciones críticas
- Un jugador → un torneo → un inscripción (unique constraint)
- Torneo completo → no acepta inscripciones (cupo)
- Categoría válida del torneo
- Transiciones de estado validadas (máquina de estados)
- Check-in solo con inscripción "confirmada"