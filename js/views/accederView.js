/**
 * Vista de acceso (Etapa 4 · demo). Ruta: #/acceder
 *
 * Autentica contra las cuentas demo del navegador (correo + contraseña) e
 * incluye accesos rápidos a las cuentas demo preinstaladas. Con Supabase
 * será supabase.auth.signInWithPassword, sin cambiar la interfaz.
 */
import { CuentasRepository } from '../core/cuentasRepository.js';
import { Sesion } from '../core/sesion.js';
import { notificar } from '../ui/components.js';

export const AccederView = {
  async render(contenedor) {
    contenedor.innerHTML = `
      <section class="detalle-contenedor">
        <h1 class="panel-titulo">Acceder</h1>
        <p class="panel-descripcion">Demo: las cuentas viven en este navegador.</p>
        <form id="formulario-acceder" class="formulario-panel" style="max-width:26rem">
          <fieldset class="conjunto-campos">
            <legend class="panel-subtitulo">Correo y contraseña</legend>
            <label class="campo"><span class="campo-etiqueta">Correo *</span>
              <input class="campo-control" type="email" name="email" required></label>
            <label class="campo"><span class="campo-etiqueta">Contraseña *</span>
              <input class="campo-control" type="password" name="clave" required></label>
            <button type="submit" class="boton boton-primario boton-bloque" style="margin-top:0.8rem">Entrar</button>
          </fieldset>
        </form>
        <div class="aviso-card" style="margin-top:1.2rem">
          <p><strong>Cuentas demo</strong> (contraseña: <code>demo1234</code>):</p>
          <p>Jugador: ana.torres@correo.mx · Organizador: contacto@ajedrezxalapa.mx</p>
          <div class="panel-acciones" style="justify-content:flex-start;margin-top:0.6rem">
            <button type="button" id="boton-demo-jugador" class="boton boton-secundario">Entrar como jugador demo</button>
            <button type="button" id="boton-demo-organizador" class="boton boton-secundario">Entrar como organizador demo</button>
          </div>
        </div>
        <p class="enlace-mas">¿No tienes cuenta? <a href="#/registro">Crear cuenta</a></p>
      </section>`;

    const redirigir = (cuenta) => {
      notificar(`Sesión iniciada · ${cuenta.nombre}`);
      window.location.hash = cuenta.rol === 'organizer' ? '#/panel' : '#/mis-inscripciones';
    };

    const formulario = contenedor.querySelector('#formulario-acceder');
    formulario.addEventListener('submit', async (e) => {
      e.preventDefault();
      const datos = new FormData(formulario);
      const resultado = await CuentasRepository.acceder({
        email: datos.get('email'),
        clave: datos.get('clave')
      });
      if (!resultado.ok) {
        notificar(resultado.motivo);
        return;
      }
      await Sesion.iniciar(resultado.cuenta.id);
      redirigir(resultado.cuenta);
    });

    const entrarDemo = async (rol) => {
      const cuenta = await CuentasRepository.getDemo(rol);
      if (!cuenta) {
        notificar('No hay cuenta demo disponible.');
        return;
      }
      await Sesion.iniciar(cuenta.id);
      redirigir(cuenta);
    };
    contenedor.querySelector('#boton-demo-jugador').addEventListener('click', () => entrarDemo('player'));
    contenedor.querySelector('#boton-demo-organizador').addEventListener('click', () => entrarDemo('organizer'));
  }
};