import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WorkbenchView from '../views/WorkbenchView.vue'
import ProductView from '../views/ProductView.vue'
import ProjectView from '../views/ProjectView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'
import DownloadView from '../views/DownloadView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/workbench', name: 'workbench', component: WorkbenchView },
  { path: '/products', name: 'products', component: ProductView },
  { path: '/portfolio', name: 'portfolio', component: ProjectView },
  { path: '/about', name: 'about', component: AboutView },
  { path: '/contact', name: 'contact', component: ContactView },
  { path: '/downloads', name: 'downloads', component: DownloadView }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
