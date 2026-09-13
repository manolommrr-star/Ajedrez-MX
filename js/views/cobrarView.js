/**
 * Vista de cobro: muestra al organizador que datos necesita proporcionar
 * para recibir pagos (informacion bancaria, Mercado Pago, etc.).
 *
 * Ruta: #/panel/cobrar
 */

function plantillaCobrar(contenido) {
  return `<div class="cobrar-layout">${contenido}</div>`;
}

function renderCobrar() {
  return plantillaCobrar(`
    <h1 class="titulo-pagina">Datos para recibir pagos</h1>
    <p class="subtitulo-pagina">Configura esta informacion para que los jugadores puedan pagarte.</p>
    <div class="cobrar-seccion">
      <h2 class="cobrar-seccion-titulo">1. Cuenta bancaria (transferencias)</h2>
      <div class="cobrar-lista">
        <div class="cobrar-item"><span class="cobrar-label">Banco</span><span class="cobrar-ejemplo">Ej: BBVA, Banorte, Santander</span></div>
        <div class="cobrar-item"><span class="cobrar-label">CLABE interbancaria</span><span class="cobrar-ejemplo">18 digitos</span></div>
        <div class="cobrar-item"><span class="cobrar-label">Numero de cuenta</span><span class="cobrar-ejemplo">10-12 digitos</span></div>
        <div class="cobrar-item"><span class="cobrar-label">Titular</span><span class="cobrar-ejemplo">Nombre o razon social</span></div>
      </div>
    </div>
    <div class="cobrar-seccion">
      <h2 class="cobrar-seccion-titulo">2. Mercado Pago (tarjeta / efectivo)</h2>
      <div class="cobrar-lista">
        <div class="cobrar-item"><span class="cobrar-label">Usuario</span><span class="cobrar-ejemplo">Email registrado</span></div>
        <div class="cobrar-item"><span class="cobrar-label">Access Token</span><span class="cobrar-ejemplo">APP_USR-...</span></div>
        <div class="cobrar-item"><span class="cobrar-label">Webhook URL</span><span class="cobrar-ejemplo">https://tudominio.com/api/webhook</span></div>
      </div>
      <p class="cobrar-nota">Mercado Pago te proporciona el Access Token desde tu panel de desarrollo.</p>
    </div>
    <div class="cobrar-seccion">
      <h2 class="cobrar-seccion-titulo">3. Datos fiscales (opcional)</h2>
      <div class="cobrar-lista">
        <div class="cobrar-item"><span class="cobrar-label">RFC</span><span class="cobrar-ejemplo">Para emitir factura</span></div>
        <div class="cobrar-item"><span class="cobrar-label">Razon social</span><span class="cobrar-ejemplo">Si requieres comprobante</span></div>
      </div>
    </div>
    <div class="cobrar-seccion">
      <h2 class="cobrar-seccion-titulo">4. Flujo del pago</h2>
      <div class="cobrar-pasos">
        <div class="cobrar-paso"><span class="cobrar-paso-num">1</span><span class="cobrar-paso-texto">El jugador elige categoria y confirma inscripcion</span></div>
        <div class="cobrar-paso"><span class="cobrar-paso-num">2</span><span class="cobrar-paso-texto">Se genera un link de pago unico con folio</span></div>
        <div class="cobrar-paso"><span class="cobrar-paso-num">3</span><span class="cobrar-paso-texto">El jugador paga con tarjeta, efectivo o transferencia</span></div>
        <div class="cobrar-paso"><span class="cobrar-paso-num">4</span><span class="cobrar-paso-texto">El webhook confirma el pago y se actualiza la inscripcion</span></div>
      </div>
    </div>
    <div class="cobrar-aviso">
      <p><strong>Demo:</strong> En esta version de demostracion los pagos se simulan localmente. En produccion los datos se envian a Mercado Pago.</p>
    </div>
  `);
}

export const CobrarView = {
  async render(contenedor, ruta) {
    contenedor.innerHTML = renderCobrar();
  }
};