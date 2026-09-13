/**
 * Vista de registro de cuentas (Etapa 4 · demo con rol).
 * Ruta: #/registro
 *
 * Crea una cuenta mock (auth.users + profiles) con rol jugador u organizador.
 * Las cuentas viven en este navegador (localStorage); con Supabase será
 * supabase.auth.signUp + la fila profiles, sin cambiar la interfaz.
 */
import { CuentasRepository } from '../core/cuentasRepository.js';
import { Sesion } from '../core/sesion.js';
import { escapar, notificar } from '../ui/components.js';

function opcionRol(valor, titulo, descripcion) {
  return `<label class="rol-opcion">
    <input type="radio" name="rol" value="${valor}" required>
    <span><strong>${escapar(titulo)}</strong><br><small>${escapar(descripcion)}</small></span>
  </label>`;
}

function camposJugador() {
  const campo = (nombre, etiqueta, tipo = 'text') =>
    `<label class="campo"><span class="campo-etiqueta">${escapar(etiqueta)}</span>
      <input class="campo-control" name="${nombre}"${tipo === 'text' ? '' : ` type="${tipo}"`}></label>`;
  return `
    <div class="campo-fila">
      ${campo('fideId', 'FIDE ID')}
      ${campo('elo', 'Elo', 'number')}
    </div>
    <div class="campo-fila">
      ${campo('club', 'Club')}
      ${campo('federacion', 'Federación')}
    </div>
    <div class="campo-fila">
      ${campo('ciudad', 'Ciudad')}
      ${campo('estado', 'Estado')}
    </div>`;
}

export const RegistroView = {
  async render(contenedor) {
    contenedor.innerHTML = `
      <section class="detalle-contenedor">
        <h1 class="panel-titulo">Crear cuenta</h1>
        <p class="panel-descripcion">Demo: la cuenta vive en este navegador (mock de auth.users + profiles).</p>
        <form id="formulario-registro" class="formulario-panel">
          <fieldset class="conjunto-campos">
            <legend class="panel-subtitulo">Tipo de cuenta</legend>
            <div class="rol-opciones">
              ${opcionRol('player', 'Jugador', 'Buscar torneos, inscribirte y seguir tus inscripciones')}
              ${opcionRol('organizer', 'Organizador', 'Publicar torneos, gestionar inscripciones, pagos y check-in')}
            </div>
          </fieldset>
          <fieldset class="conjunto-campos">
            <legend class="panel-subtitulo">Acceso</legend>
            <div class="campo-fila">
              <label class="campo"><span class="campo-etiqueta">Nombre *</span>
                <input class="campo-control" name="nombre" required></label>
              <label class="campo"><span class="campo-etiqueta">Apellidos</span>
                <input class="campo-control" name="apellidos"></label>
            </div>
            <div class="campo-fila">
              <label class="campo"><span class="campo-etiqueta">Correo *</span>
                <input class="campo-control" type="email" name="email" required></label>
              <span></span>
            </div>
            <div class="campo-fila">
              <label class="campo"><span class="campo-etiqueta">Contraseña * (mínimo 8)</span>
                <input class="campo-control" type="password" name="clave" minlength="8" required></label>
              <label class="campo"><span class="campo-etiqueta">Confirmar contraseña *</span>
                <input class="campo-control" type="password" name="confirmar" minlength="8" required></label>
            </div>
          </fieldset>
          <fieldset class="conjunto-campos" id="bloque-jugador">
            <legend class="panel-subtitulo">Datos de jugador (opcional)</legend>
            ${camposJugador()}
          </fieldset>
          <fieldset class="conjunto-campos" id="bloque-organizador" hidden>
            <legend class="panel-subtitulo">Organización</legend>
            <label class="campo"><span class="campo-etiqueta">Nombre de la organización o club *</span>
              <input class="campo-control" name="organizacion"></label>
          </fieldset>
          <div class="panel-acciones">
            <a class="boton boton-secundario" href="#/acceder">Ya tengo cuenta</a>
            <button type="submit" class="boton boton-primario">Crear cuenta</button>
          </div>
        </form>
      </section>`;

    const formulario = contenedor.querySelector('#formulario-registro');
    const bloqueJugador = formulario.querySelector('#bloque-jugador');
    const bloqueOrganizador = formulario.querySelector('#bloque-organizador');
    formulario.addEventListener('change', (e) => {
      if (e.target.name !== 'rol') return;
      bloqueJugador.hidden = e.target.value !== 'player';
      bloqueOrganizador.hidden = e.target.value !== 'organizer';
    });

    formulario.addEventListener('submit', async (e) => {
      e.preventDefault();
      const datos = new FormData(formulario);
      const rol = String(datos.get('rol') || '');
      if (!rol) {
        notificar('Elige el tipo de cuenta.');
        return;
      }
      const clave = String(datos.get('clave') || '');
      if (clave !== String(datos.get('confirmar') || '')) {
        notificar('Las contraseñas no coinciden.');
        return;
      }
      const extras = rol === 'player'
        ? {
            fideId: datos.get('fideId'), elo: datos.get('elo'), club: datos.get('club'),
            federacion: datos.get('federacion'), ciudad: datos.get('ciudad'), estado: datos.get('estado')
          }
        : { organizacion: String(datos.get('organizacion') || '').trim() };
      if (rol === 'organizer' && !extras.organizacion) {
        notificar('Escribe el nombre de la organización.');
        return;
      }
      const resultado = await CuentasRepository.registrar({
        rol,
        nombre: datos.get('nombre'),
        apellidos: datos.get('apellidos'),
        email: datos.get('email'),
        clave,
        extras
      });
      if (!resultado.ok) {
        notificar(resultado.motivo);
        return;
      }
      await Sesion.iniciar(resultado.cuenta.id);
      notificar('Cuenta creada. ¡Bienvenido/a!');
      window.location.hash = rol === 'organizer' ? '#/panel' : '#/mis-inscripciones';
    });
  }
};