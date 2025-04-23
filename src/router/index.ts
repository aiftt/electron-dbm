import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../pages/HomePage.vue'),
      },
      {
        path: 'connections',
        name: 'Connections',
        component: () => import('../pages/ConnectionsPage.vue'),
      },
      {
        path: 'query/:connectionId',
        name: 'QueryEditor',
        component: () => import('../pages/QueryEditorPage.vue'),
        props: true,
      },
      {
        path: 'table/:connectionId/:database/:table',
        name: 'TableView',
        component: () => import('../pages/TableViewPage.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/NotFoundPage.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router; 