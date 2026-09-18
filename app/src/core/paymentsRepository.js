/**
 * Núcleo de dominio: PAGOS.
 *
 * Los estados de pago viven en la tabla payments y las inserciones se hacen
 * SOLO desde edge functions con service_role (webhook del proveedor).
 * Aquí solo se leen/agregan para la demostración local.
 */
import { PAGOS_DEMO, INSCRIPCIONES_DEMO } from '../data/mockRelacional.js';
import { transicionValida, registrarHistorial } from './registrationsRepository.js';

export const PaymentsRepository = {
  /** Pagos del más reciente al más antiguo. */
  async getPagos() {
    return PAGOS_DEMO.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  /** Marca un pago como reembolsado (solo demo local). */
  async reembolsar(pagoId) {
    const pago = PAGOS_DEMO.find((p) => p.id === pagoId);
    if (!pago || pago.estado !== 'pagado') return false;
    pago.estado = 'reembolsado';
    return true;
  },

  /**
   * Simula la confirmación de un pago vía webhook (Mercado Pago).
   * Cambia el estado del pago a 'pagado' y actualiza la inscripción asociada.
   * En Supabase esto lo ejecuta una edge function con service_role.
   */
  async simularWebhook(pagoId) {
    const pago = PAGOS_DEMO.find((p) => p.id === pagoId);
    if (!pago) return { ok: false, motivo: 'Pago no encontrado.' };
    if (pago.estado === 'pagado') {
      return { ok: false, motivo: 'El pago ya estaba confirmado.' };
    }
    if (pago.estado !== 'pendiente' && pago.estado !== 'procesando') {
      return { ok: false, motivo: `No se puede confirmar un pago en estado "${pago.estado}".` };
    }
    // Confirmar pago
    pago.estado = 'pagado';
    // Actualizar inscripción asociada (si existe)
    if (pago.registrationId) {
      const inscripcion = INSCRIPCIONES_DEMO.find((r) => r.id === pago.registrationId);
      if (inscripcion && transicionValida(inscripcion.estado, 'pagada')) {
        const anterior = inscripcion.estado;
        inscripcion.estado = 'pagada';
        registrarHistorial(inscripcion.id, anterior, 'pagada');
      }
    }
    return { ok: true, pago };
  }
};