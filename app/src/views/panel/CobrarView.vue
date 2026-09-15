<script setup>
/**
 * Panel · Cobrar: datos que el organizador debe configurar para
 * recibir pagos (banco, Mercado Pago, fiscales). Solo informativo.
 */
</script>

<template>
  <h1 class="titulo-pagina">Datos para recibir pagos</h1>
  <p class="subtitulo-pagina">Configura esta información para que los jugadores puedan pagarte.</p>

  <section class="cobrar-seccion">
    <h2 class="cobrar-seccion-titulo">1. Cuenta bancaria (transferencias)</h2>
    <div class="cobrar-lista">
      <div class="cobrar-item"><span class="cobrar-label">Banco</span><span class="cobrar-ejemplo">Ej: BBVA, Banorte, Santander</span></div>
      <div class="cobrar-item"><span class="cobrar-label">CLABE interbancaria</span><span class="cobrar-ejemplo">18 dígitos</span></div>
      <div class="cobrar-item"><span class="cobrar-label">Número de cuenta</span><span class="cobrar-ejemplo">10–12 dígitos</span></div>
      <div class="cobrar-item"><span class="cobrar-label">Titular</span><span class="cobrar-ejemplo">Nombre o razón social</span></div>
    </div>
  </section>

  <section class="cobrar-seccion">
    <h2 class="cobrar-seccion-titulo">2. Mercado Pago (tarjeta / efectivo)</h2>
    <div class="cobrar-lista">
      <div class="cobrar-item"><span class="cobrar-label">Usuario</span><span class="cobrar-ejemplo">Email registrado</span></div>
      <div class="cobrar-item"><span class="cobrar-label">Access Token</span><span class="cobrar-ejemplo">APP_USR-…</span></div>
      <div class="cobrar-item"><span class="cobrar-label">Webhook URL</span><span class="cobrar-ejemplo">https://tudominio.com/api/webhook</span></div>
    </div>
    <p class="cobrar-nota">Mercado Pago te proporciona el Access Token desde tu panel de desarrollo.</p>
  </section>

  <section class="cobrar-seccion">
    <h2 class="cobrar-seccion-titulo">3. Datos fiscales (opcional)</h2>
    <div class="cobrar-lista">
      <div class="cobrar-item"><span class="cobrar-label">RFC</span><span class="cobrar-ejemplo">Para emitir factura</span></div>
      <div class="cobrar-item"><span class="cobrar-label">Razón social</span><span class="cobrar-ejemplo">Si requieres comprobante</span></div>
    </div>
  </section>

  <section class="cobrar-seccion">
    <h2 class="cobrar-seccion-titulo">4. Flujo del pago</h2>
    <div class="cobrar-pasos">
      <div class="cobrar-paso"><span class="cobrar-paso-num">1</span><span>El jugador elige categoría y confirma inscripción</span></div>
      <div class="cobrar-paso"><span class="cobrar-paso-num">2</span><span>Se genera un enlace de pago único con folio</span></div>
      <div class="cobrar-paso"><span class="cobrar-paso-num">3</span><span>El jugador paga con tarjeta, efectivo o transferencia</span></div>
      <div class="cobrar-paso"><span class="cobrar-paso-num">4</span><span>El webhook confirma el pago y se actualiza la inscripción</span></div>
    </div>
  </section>

  <div class="aviso aviso-dorado">
    <p><strong>Demo:</strong> en esta versión los pagos se simulan localmente. En producción los datos se envían a Mercado Pago.</p>
  </div>
</template>
