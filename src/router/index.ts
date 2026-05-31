import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      component: () => import('../views/CreateStampView.vue'),
    },
    {
      path: '/:timestamp(\\d{10})/:endtimestamp(\\d{10})?',
      component: () => import('../views/StampDisplayView.vue'),
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router
