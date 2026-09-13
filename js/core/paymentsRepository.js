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

  async getCobrado() {
    return PAGOS_DEMO
      .filter((p) => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);
  },

  /** Conteo de pagos por estado (para los chips de la página Pagos). */
  async getConteoPorEstado() {
    const conteo = {};
    for (const p of PAGOS_DEMO) {
      conteo[p.estado] = (conteo[p.estado] || 0) + 1;
    }
    return conteo;
  },

  /** Marca un pago como reembolsado (solo demo local). */
  async reembolsar(pagoId) {
    const pago = PAGOS_DEMO.find((p) => p.id === pagoId);
    if (!pago || pago.estado !== 'pagado') return false;
    pago.estado = 'reembolsado';
    return true;
  },

  /** Reintenta un pago pendiente/procesando (solo demo local). */
  async marcarProcesando(pagoId) {
    const pago = PAGOS_DEMO.find((p) => p.id === pagoId);
    if (!pago || (pago.estado !== 'pendiente' && pago.estado !== 'procesando')) return false;
    pago.estado = 'procesando';
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
  } };