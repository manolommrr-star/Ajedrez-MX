<script setup>
/**
 * Términos y condiciones del servicio (demo).
 *
 * El checkbox del registro y "Mi cuenta" enlazan aquí: la fecha de
 * aceptación que guarda la cuenta apunta a este documento.
 */
import AvisoLegalDemo from '@/components/AvisoLegalDemo.vue';
</script>

<template>
  <section class="contenedor legal">
    <h1 class="titulo-pagina">Términos y condiciones</h1>
    <p class="subtitulo-pagina">Condiciones de uso del directorio de torneos de AjedrezMX.</p>

    <AvisoLegalDemo />

    <h2>1 · Objeto del servicio</h2>
    <p>
      AjedrezMX es un directorio de torneos de ajedrez. Permite a los jugadores
      buscar torneo, inscribirse y pagar la cuota, y a los organizadores publicar
      sus torneo, recibir pagos y gestionar participantes.
    </p>

    <h2>2 · Cuentas</h2>
    <ul>
      <li>Cada persona puede tener una cuenta: de jugador o de organizador. El rol se elige al registrarse y define las funciones disponibles.</li>
      <li>Eres responsable de tu contraseña y de la actividad que ocurre en tu cuenta. Cierra sesión en equipos compartidos.</li>
      <li>Puedes editar tus datos, cambiar tu contraseña, descargar una copia de tu información y eliminar tu cuenta desde "Mi cuenta".</li>
      <li>Podemos bloquear temporalmente una cuenta tras varios intentos de acceso fallidos, como medida antifraude.</li>
    </ul>

    <h2>3 · Inscripciones y pagos</h2>
    <ul>
      <li>La inscripción se confirma al completar el pago dentro de la plataforma.</li>
      <li>Los pagos se procesan con Mercado Pago; AjedrezMX no almacena datos de tarjeta y el comprobante fiscal se emite con los datos fiscales del organizador.</li>
      <li>El organizador puede cancelar, reprogramar o cancelar un torneo publicado; los jugadores ven el cambio reflejado en su inscripción.</li>
      <li>El derecho de admisión y las reglas desportivas son responsabilidad del organizador que publica el torneo.</li>
    </ul>

    <h2>4 · Organizadores</h2>
    <ul>
      <li>El organizador declara que cuenta con las facultades para representar a la organización que indica.</li>
      <li>Debe mantener vigentes sus datos fiscales y su cuenta de cobro, y entregar comprobantes a los jugadores que lo soliciten.</li>
      <li>No puede publicar torneos con información falsa ni cobrar cuotas que no correspondan al torneo publicado.</li>
    </ul>

    <h2>5 · Eliminación de cuentas</h2>
    <p>
      Al eliminar tu cuenta se borran tus datos personales. Las inscripciones y
      los pagos ya realizados se conservan sin tu nombre porque son registros de
      cobro; los torneos publicados por un organizador no se borran.
    </p>

    <h2>6 · Disponibilidad y responsabilidad</h2>
    <p>
      El servicio se ofrece "tal cual", sin garantía de disponibilidad continua
      ni de resultados específicos. En la versión actual los datos viven en el
      navegador (modo demostración) y se pierden al borrar el almacenamiento local.
    </p>

    <h2>7 · Cambios a estos términos</h2>
    <p>
      Podemos actualizar estos términos; la versión vigente es la publicada en
      esta página y se refleja en la fecha de aceptación de tu cuenta.
    </p>

    <h2>8 · Ley aplicable</h2>
    <p>
      Estos términos se rigen por las leyes aplicables en México. Cualquier
      controversia se resolverá en los tribunales competentes de la Ciudad de
      México, salvo que la ley disponga lo contrario.
    </p>

    <p class="campo-ayuda">
      Última actualización: septiembre de 2026 ·
      <RouterLink to="/privacidad">Aviso de privacidad</RouterLink>
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
