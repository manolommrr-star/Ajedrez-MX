/**
 * Punto de entrada de la aplicación Vue.
 * Estilos globales en orden: tokens → base → layout → responsive.
 */
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router/index.js';

import './styles/tema.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/responsive.css';

createApp(App).use(router).mount('#app');