/**
 * Router de la aplicación (hash history: compatible con GitHub Pages
 * y con el prototipo vanilla, que usaba el mismo esquema #/ruta).
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import { Sesion } from '@/core/sesion.js';

import CatalogoView from '@/views/CatalogoView.vue';
import TorneoDetalleView from '@/views/TorneoDetalleView.vue';
import InscripcionView from '@/views/InscripcionView.vue';
import MisInscripcionesView from '@/views/MisInscripcionesView.vue';
import RegistroView from '@/views/RegistroView.vue';
import AccederView from '@/views/AccederView.vue';
import PagarView from '@/views/PagarView.vue';
import PanelLayout from '@/views/panel/PanelLayout.vue';

const rutas = [
  { path: '/', name: 'catalogo', component: CatalogoView },
  { path: '/torneo/:id', name: 'torneo', component: TorneoDetalleView },
  { path: '/torneo/:id/inscribirse', name: 'inscribirse', component: InscripcionView },
  { path: '/pagar/:folio', name: 'pagar', component: PagarView },
  { path: '/mis-inscripciones', name: 'mis-inscripciones', component: MisInscripcionesView },
  { path: '/registro', name: 'registro', component: RegistroView },
  { path: '/acceder', name: 'acceder', component: AccederView },

  /* Panel del organizador: layout con rutas hijas */
  {
    path: '/panel',
    component: PanelLayout,
    meta: { requiereOrganizador: true },
    children: [
      { path: '', name: 'panel-resumen', component: () => import('@/views/panel/PanelInicioView.vue') },
      { path: 'torneos', name: 'panel-torneos', component: () => import('@/views/panel/TorneosView.vue') },
      { path: 'crear', name: 'panel-crear', component: () => import('@/views/panel/CrearTorneoView.vue') },
      { path: 'torneo/:id/editar', name: 'panel-editar', component: () => import('@/views/panel/CrearTorneoView.vue'), props: true },
      { path: 'torneo/:id', name: 'panel-torneo-detalle', component: () => import('@/views/panel/TorneoDetalleView.vue'), props: true },
      { path: 'configuracion', name: 'panel-configuracion', component: () => import('@/views/panel/ConfiguracionView.vue') }
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: '/' }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes: rutas,
  scrollBehavior: () => ({ top: 0 })
});

/** El panel solo es accesible con una cuenta de organizador (Etapa 4). */
router.beforeEach(async (to) => {
  if (!to.matched.some((r) => r.meta.requiereOrganizador)) return true;
  const cuenta = await Sesion.getCuenta();
  if (!cuenta) return { name: 'acceder', query: { redir: to.fullPath } };
  if (cuenta.rol !== 'organizer') return { name: 'mis-inscripciones' };
  return true;
});