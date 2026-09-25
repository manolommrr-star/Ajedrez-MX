/**
 * Router de la aplicación (hash history: compatible con GitHub Pages).
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import { Sesion } from '@/core/sesion.js';
import { evaluarAcceso } from './guardas.js';

import CatalogoView from '@/views/CatalogoView.vue';
import TorneoDetalleView from '@/views/TorneoDetalleView.vue';
import InscripcionView from '@/views/InscripcionView.vue';
import MisInscripcionesView from '@/views/MisInscripcionesView.vue';
import RegistroView from '@/views/RegistroView.vue';
import AccederView from '@/views/AccederView.vue';
import MiCuentaView from '@/views/MiCuentaView.vue';
import RecuperarView from '@/views/RecuperarView.vue';
import TerminosView from '@/views/TerminosView.vue';
import PrivacidadView from '@/views/PrivacidadView.vue';
import PagarView from '@/views/PagarView.vue';
import PanelLayout from '@/views/panel/PanelLayout.vue';

const rutas = [
  { path: '/', name: 'catalogo', component: CatalogoView },
  { path: '/torneo/:id', name: 'torneo', component: TorneoDetalleView },
  { path: '/torneo/:id/inscribirse', name: 'inscribirse', component: InscripcionView },
  { path: '/pagar/:folio', name: 'pagar', component: PagarView },
  { path: '/mis-inscripciones', name: 'mis-inscripciones', component: MisInscripcionesView, meta: { requiereSesion: true, requiereJugador: true } },
  { path: '/registro', name: 'registro', component: RegistroView },
  { path: '/acceder', name: 'acceder', component: AccederView },
  { path: '/mi-cuenta', name: 'mi-cuenta', component: MiCuentaView, meta: { requiereSesion: true } },
  { path: '/recuperar', name: 'recuperar', component: RecuperarView },
  /* Documentos legales: los enlazan el registro, "Mi cuenta" y el pie. */
  { path: '/terminos', name: 'terminos', component: TerminosView },
  { path: '/privacidad', name: 'privacidad', component: PrivacidadView },

  /* Panel del organizador: layout con rutas hijas */
  {
    path: '/panel',
    component: PanelLayout,
    meta: { requiereOrganizador: true },
    children: [
      { path: '', name: 'panel-resumen', component: () => import('@/views/panel/PanelInicioView.vue') },
      { path: 'torneos', name: 'panel-torneos', component: () => import('@/views/panel/TorneosView.vue') },
      { path: 'crear', name: 'panel-crear', component: () => import('@/views/panel/CrearTorneoView.vue') },
      { path: 'cobros', name: 'panel-cobros', component: () => import('@/views/panel/CobrosView.vue') },
      { path: 'torneo/:id/editar', name: 'panel-editar', component: () => import('@/views/panel/CrearTorneoView.vue'), props: true },
      { path: 'torneo/:id', name: 'panel-torneo-detalle', component: () => import('@/views/panel/TorneoDetalleView.vue'), props: true }
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: '/' }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes: rutas,
  scrollBehavior: () => ({ top: 0 })
});

/**
 * Guardas de ruta (la decisión vive en ./guardas.js): el panel exige
 * organizador, /mis-inscripciones exige jugador y "Mi cuenta" solo una
 * sesión abierta. Sin sesión → acceder, guardando la ruta para volver a ella.
 */
router.beforeEach(async (to) => {
  const decision = evaluarAcceso(to.meta, await Sesion.getCuenta());
  if (decision === true) return true;
  return decision.conRedir
    ? { name: decision.nombre, query: { redir: to.fullPath } }
    : { name: decision.nombre };
});