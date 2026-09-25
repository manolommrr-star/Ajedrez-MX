<script setup>
/**
 * Aviso de privacidad (demo). Describe qué datos pide la app, para qué los usa
 * y cómo se exercise los derechos ARCO; la fecha de aceptación de la cuenta
 * y el enlace del pie apuntan a este documento.
 */
import AvisoLegalDemo from '@/components/AvisoLegalDemo.vue';
</script>

<template>
  <section class="contenedor legal">
    <h1 class="titulo-pagina">Aviso de privacidad</h1>
    <p class="subtitulo-pagina">Qué datos recabamos y cómo los usamos.</p>

    <AvisoLegalDemo />

    <h2>1 · Datos que recabamos</h2>
    <ul>
      <li><strong>Cuenta:</strong> nombre, apellidos, correo electrónico, rol (jugador u organizador) y fecha de aceptación de los términos.</li>
      <li><strong>Perfil de jugador:</strong> FIDE ID, rating Elo, título, club, federación, fecha de nacimiento, sexo, teléfono, ciudad y estado.</li>
      <li><strong>Organizador:</strong> nombre de la organización, giro, teléfono, sitio web y los datos fiscales (RFC, régimen, código postal y CLABE) junto con la conexión de Mercado Pago.</li>
      <li><strong>Actividad:</strong> inscripciones, pagos, fecha de creación y último acceso a la cuenta.</li>
    </ul>

    <h2>2 · Para qué los usamos</h2>
    <ul>
      <li>Gestionar tu cuenta y tu perfil, y mostrar la información de los torneos en los que participas.</li>
      <li>Procesar pagos, emitir comprobantes y cumplir obligaciones fiscales del organizador.</li>
      <li>Prevenir fraude: intentos de acceso fallidos, recuperación de contraseña y verificación del correo.</li>
    </ul>

    <h2>3 · Base legal</h2>
    <p>
     Tratamos tus datos con base en tu consentimiento al aceptar los términos y
      en la ejecución de la relación contractual (LFPDPPP, artículos 8 y 9).
    </p>

    <h2>4 · Dónde se guardan</h2>
    <p>
      En esta versión de demostración los datos se guardan en el almacenamiento
      local de tu navegador (localStorage), no en servidores. Eso implica que
      puedes borrarlos desde "Mi cuenta" o desde la configuración del navegador,
      y que el sitio no funciona sin almacenamiento local.
    </p>

    <h2>5 · Terceros</h2>
    <ul>
      <li><strong>Mercado Pago</strong>: procesa los pagos; la verificación de identidad se completa dentro de su plataforma.</li>
      <li><strong>Organizadores</strong>: ven los datos del jugador inscrito (nombre, contacto y perfil federativo) para gestionar su torneo.</li>
    </ul>
    No vendemos ni cedemos datos personales a terceros con fines publicitarios.

    <h2>6 · Conservación</h2>
    <p>
      Conservamos los datos mientras tu cuenta exista. Al eliminarla borramos tu
      identificación y contacto, y conservamos las inscripciones y los pagos
      anonimizados como registro de cobro.
    </p>

    <h2>7 · Tus derechos (ARCO)</h2>
    <p>
      Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su
      tratamiento. El acceso y la descarga están en "Mi cuenta" (descargar mis
      datos y eliminar mi cuenta); para rectificar o manifestar una oposición,
      escríbenos desde el correo de tu cuenta.
    </p>

    <h2>8 · Cambios al aviso</h2>
    <p>
      Cualquier cambio se publicará en esta página y quedará reflejado en la
      versión vigente que aceptaste al registrar tu cuenta.
    </p>

    <p class="campo-ayuda">
      Última actualización: septiembre de 2026 ·
      <RouterLink to="/terminos">Términos y condiciones</RouterLink>
    </p>
  </section>
</template>

<style scoped>
/* Ancho de lectura cómodo para texto legal. */
.legal { max-width: 72ch; }
.legal h2 { margin: 2rem 0 0.5rem; font-size: 1.05rem; }
.legal p, .legal ul { margin: 0 0 0.75rem; line-height: 1.6; }
.legal ul { padding-left: 1.2rem; }
.legal li { margin-bottom: 0.35rem; }
</style>
