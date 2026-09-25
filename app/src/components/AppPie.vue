<script setup>
/**
 * Pie de página.
 */
</script>

<template>
  <footer class="pie">
    <p class="pie-marca">♞ AjedrezMX</p>
    <p class="pie-nota">Directorio de torneos de ajedrez · Prototipo con datos ficticios</p>
    <p class="pie-legal">
      <RouterLink to="/terminos">Términos</RouterLink>
      ·
      <RouterLink to="/privacidad">Aviso de privacidad</RouterLink>
    </p>
  </footer>
</template>

<style scoped>
.pie-legal { margin: 0.35rem 0 0; font-size: 0.8rem; }
</style>