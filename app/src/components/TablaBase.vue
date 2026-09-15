<script setup>
/**
 * Tabla base con encabezado, estado vacío y celdas responsivas.
 * Las filas se pasan por slot; cada <td> debe llevar data-col="Título"
 * para que en móvil se muestre como tarjeta apilada (ver responsive.css).
 */
defineProps({
  columnas: { type: Array, required: true },
  vacia: { type: Boolean, default: false },
  mensajeVacio: { type: String, default: 'Sin resultados.' }
});
</script>

<template>
  <div class="tabla-envoltura">
    <table class="tabla">
      <thead>
        <tr>
          <th v-for="columna in columnas" :key="columna" scope="col">{{ columna }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="vacia">
          <td :colspan="columnas.length" class="tabla-vacia">{{ mensajeVacio }}</td>
        </tr>
        <slot v-else />
      </tbody>
    </table>
  </div>
</template>