/**
 * Datos personales de una cuenta reunidos para su descarga
 * (derecho de acceso: LFPDPPP / RGPD).
 *
 * Nunca incluye el hash de la contraseña, tokens de recuperación ni datos de
 * terceros. La cuenta es la fuente: el perfil de jugador u organización se
 * derivan de ella, igual que en la sesión.
 */
import { CuentasRepository, cuentasListas, perfilOrganizador } from './cuentasRepository.js';
import { PlayersRepository } from './playersRepository.js';
import { RegistrationsRepository } from './registrationsRepository.js';
import { PaymentsRepository } from './paymentsRepository.js';

export const DatosCuenta = {
  /** Objeto con todos los datos de la cuenta, o null si ya no existe. */
  async reunir(idCuenta) {
    await cuentasListas;
    const cuenta = await CuentasRepository.getPorId(idCuenta);
    if (!cuenta) return null;

    const datos = {
      version: 1,
      exportadoEl: new Date().toISOString(),
      cuenta: {
        id: cuenta.id,
        rol: cuenta.rol,
        nombre: cuenta.nombre,
        apellidos: cuenta.apellidos,
        email: cuenta.email,
        correoVerificado: Boolean(cuenta.correoVerificado),
        fechaCreacion: cuenta.fechaCreacion || null,
        fechaAceptacion: cuenta.fechaAceptacion || null,
        ultimoAcceso: cuenta.ultimoAcceso || null
      },
      jugador: null,
      organizacion: null,
      inscripciones: [],
      pagos: []
    };

    if (cuenta.rol === 'player' && cuenta.playerId) {
      datos.jugador = await PlayersRepository.getPorId(cuenta.playerId);
      const inscripciones = await RegistrationsRepository.getPorJugador(cuenta.playerId);
      datos.inscripciones = await Promise.all(
        inscripciones.map(async (r) => ({
          id: r.id,
          torneoId: r.torneoId,
          categoria: r.categoria,
          precio: r.precio,
          estado: r.estado,
          fechaCreacion: r.fechaCreacion,
          torneo: await RegistrationsRepository.getInfoTorneo(r.torneoId)
        }))
      );
      datos.pagos = (await Promise.all(
        datos.inscripciones.map((r) => PaymentsRepository.getPorInscripcion(r.id))
      )).filter(Boolean);
    } else {
      datos.organizacion = perfilOrganizador(cuenta);
    }

    return datos;
  },

  /** Nombre sugerido del archivo de exportación. */
  nombreArchivo(fecha = new Date()) {
    return `ajedrezmx-datos-${fecha.toISOString().slice(0, 10)}.json`;
  }
};
