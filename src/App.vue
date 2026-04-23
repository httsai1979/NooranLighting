<script setup lang="ts">
import { onMounted } from 'vue'
import { store } from './store'
import { 
  MessageCircle, 
  Menu, 
  X, 
  Linkedin, 
  Instagram, 
  Facebook,
  ChevronRight
} from 'lucide-vue-next'

import { ref } from 'vue'
import { useRoute } from 'vue-router'

const isMenuOpen = ref(false)
const route = useRoute()

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyCjL5S-_b5vP0R-W3yS16eY25P7u8P8w2Y2f7u8w/exec';

onMounted(async () => {
  try {
    const res = await fetch(GAS_URL);
    const result = await res.json();
    if (result.status === 'success') {
      store.catalog.lamps = result.data.lamps;
      store.catalog.accessories = result.data.accessories;
    }
  } catch (e) {
    console.error('Registry Sync Failed:', e);
  } finally {
    store.loading = false;
  }
});

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Studio', path: '/workbench' },
  { name: 'Registry', path: '/products' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'Heritage', path: '/about' },
  { name: 'Assets', path: '/downloads' },
  { name: 'Liaison', path: '/contact' }
]
</script>

<template>
  <div class="font-sans antialiased text-zinc-900 selection:bg-blue-600 selection:text-white">
    
    <!-- Professional Navigation Shell -->
    <nav class="fixed top-0 left-0 right-0 z-[100] h-24 flex items-center px-6 lg:px-20 transition-all duration-700 bg-white/80 backdrop-blur-3xl border-b border-zinc-100 print:hidden">
       <div class="max-w-[1600px] mx-auto w-full flex justify-between items-center">
          
          <RouterLink to="/" class="flex flex-col group">
             <h1 class="text-3xl font-black tracking-tighter italic font-serif leading-none">ACO<span class="text-blue-600 font-sans not-italic">fusion</span></h1>
             <p class="text-[8px] font-black uppercase tracking-[0.6em] text-zinc-300 group-hover:text-blue-500 transition-colors">Lighting Global // UK HQ</p>
          </RouterLink>

          <!-- Desktop Navigation -->
          <div class="hidden lg:flex items-center gap-12">
             <RouterLink v-for="link in navLinks" :key="link.path" :to="link.path" 
                class="text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:text-blue-600"
                :class="route.path === link.path ? 'text-blue-600' : 'text-zinc-400'">
                {{ link.name }}
             </RouterLink>
             <div class="h-4 w-px bg-zinc-200 mx-4"></div>
             <RouterLink to="/workbench" class="px-8 py-3 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Launch Studio</RouterLink>
          </div>

          <!-- Mobile Toggle -->
          <button @click="isMenuOpen = !isMenuOpen" class="lg:hidden text-zinc-900 p-2"><Menu v-if="!isMenuOpen" size="24"/><X v-else size="24"/></button>
       </div>
    </nav>

    <!-- Mobile Menu Overlay -->
    <Transition name="fade">
       <div v-if="isMenuOpen" class="fixed inset-0 z-[90] bg-white pt-32 px-10 flex flex-col gap-12">
          <RouterLink v-for="link in navLinks" :key="link.path" :to="link.path" @click="isMenuOpen = false"
             class="text-4xl font-black italic font-serif text-zinc-900 uppercase tracking-tighter">
             {{ link.name }}
          </RouterLink>
       </div>
    </Transition>

    <!-- Main View Content -->
    <main class="min-h-screen pt-24">
       <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
             <component :is="Component" />
          </Transition>
       </RouterView>
    </main>

    <!-- Professional Global Footer -->
    <footer class="bg-zinc-900 text-white py-32 px-6 lg:px-20 print:hidden relative overflow-hidden">
       <div class="absolute inset-0 opacity-5 pointer-events-none select-none text-[300px] font-serif font-black italic tracking-tighter text-white -bottom-40 -left-20">ACO</div>
       
       <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24 relative z-10">
          <div class="space-y-8">
             <h2 class="text-4xl font-serif italic font-black">ACO<span class="text-blue-500">fusion</span></h2>
             <p class="text-white/40 text-[12px] font-medium leading-relaxed font-sans uppercase">A global engineering protocol specializing in minimalist 48V magnetic system integration. UK Technical Directorship // London HQ.</p>
             <div class="flex gap-6">
                <a href="#" class="text-white/20 hover:text-white transition-colors"><Linkedin size="20"/></a>
                <a href="#" class="text-white/20 hover:text-white transition-colors"><Instagram size="20"/></a>
                <a href="#" class="text-white/20 hover:text-white transition-colors"><Facebook size="20"/></a>
             </div>
          </div>
          
          <div class="space-y-8">
             <h4 class="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Ecosystem</h4>
             <div class="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-white/50">
                <RouterLink to="/workbench" class="hover:text-blue-500">S10 Studio</RouterLink>
                <RouterLink to="/products" class="hover:text-blue-500">Component Registry</RouterLink>
                <RouterLink to="/downloads" class="hover:text-blue-500">Asset Library</RouterLink>
             </div>
          </div>

          <div class="space-y-8">
             <h4 class="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Liaison</h4>
             <div class="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-white/50">
                <span>service@acofusion.com</span>
                <span>+44-7510-317-505 // James Tsai</span>
                <span class="text-white/20">London HQ // UK Engineering</span>
             </div>
          </div>

          <div class="space-y-8">
             <h4 class="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Certification</h4>
             <div class="flex flex-wrap gap-6 opacity-30 invert">
                <span class="text-xs font-black tracking-widest border border-white px-2 py-1">CE</span>
                <span class="text-xs font-black tracking-widest border border-white px-2 py-1">UKCA</span>
                <span class="text-xs font-black tracking-widest border border-white px-2 py-1">ROHS</span>
             </div>
          </div>
       </div>

       <div class="max-w-7xl mx-auto mt-32 pt-12 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/20">
          <span>&copy; 2026 ACOfusion Global (UK) Ltd. All engineering protocols reserved.</span>
          <span class="italic">System v2.9.2 PRO</span>
       </div>
    </footer>

    <!-- Support Orb -->
    <a href="https://wa.me/447510317505" target="_blank" class="fixed bottom-12 right-12 z-[500] group flex items-center gap-6 print:hidden">
       <div class="bg-white border border-zinc-100 shadow-3xl px-8 py-5 rounded-[2.5rem] opacity-0 translate-x-12 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 pointer-events-none">
          <span class="text-[11px] font-black uppercase tracking-widest text-zinc-900 flex items-center gap-4">Liaise with Technical Desk <ChevronRight size="14"/></span>
       </div>
       <div class="w-24 h-24 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all">
          <MessageCircle size="36" />
       </div>
    </a>

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@500;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

.font-serif { font-family: 'Playfair Display', serif; }
.font-mono { font-family: 'JetBrains Mono', monospace; }

/* Transitions */
.page-enter-active, .page-leave-active { transition: opacity 0.4s ease-out, transform 0.4s ease-out; }
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-to { opacity: 0; transform: translateY(-10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }

@media print {
  body { background: white !important; }
  nav, footer, .support-orb { display: none !important; }
}
</style>
