# Flujos de usuario

## Flujo Jugador (online)
1. Navega catálogo (`#/`)
2. Ve detalle (`#torneo/:id`)
3. Se inscribe (`#torneo/:id/inscribirse`) → crea jugador + inscripción en estado "pendiente"
4. Paga (`#pagar/:folio`) → simula pago local, cambia a "pagada"
5. Check-in → valida folio, cambia a "checkin"

## Flujo Organizador (panel)
1. Accede (`#/acceder` → login como organizador demo)
2. Dashboard (`#panel`) → estadísticas y acceso rápido
3. Gestiona torneos (`#panel/torneos`) → CRUD, publicar
4. Ver inscripciones (`#panel/torneo/:id/inscripciones`) → tabla con JOINs
5. Ver pagos (`#panel/pagos`) → lista, simular webhook, reembolsar
6. Check-in (`#/panel/qr`) → validar folios
7. Reportar resultados → generar CSV (Swiss Manager)

## Flujo Demo
**Usuarios demo:**
- Jugador: `ana.torres@correo.mx` (password: `demo1234`)
- Organizador: `contacto@ajedrezxalapa.mx` (password: `demo1234`)

**Torneos demo:** 10 torneos publicados (ver `mockTournaments.js`)

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