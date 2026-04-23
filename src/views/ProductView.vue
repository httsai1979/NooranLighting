<script setup lang="ts">
import { ref, computed } from 'vue'
import { store } from '../store'
import { ArrowUpRight, Search, SlidersHorizontal, Info } from 'lucide-vue-next'

const searchQuery = ref('')
const selectedCategory = ref('ALL')

const categories = [
  { id: 'ALL', name: 'S10 Ecosystem' },
  { id: 'SPOT', name: 'Accent Spots' },
  { id: 'FLOOD', name: 'Ambient Flood' },
  { id: 'DECO', name: 'Decorative' }
]

const filteredProducts = computed(() => {
  return store.catalog.lamps.filter(l => {
    const matchesSearch = l.model.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCat = selectedCategory.value === 'ALL' || (l.category || '').toUpperCase().includes(selectedCategory.value)
    return matchesSearch && matchesCat
  })
})

const fixDriveUrl = (url: any) => {
  const match = String(url || '').match(/(?:id=|\/d\/|\/file\/d\/)([-\w]{25,})/);
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : url;
};

const safeUpper = (v: any) => String(v || '').toUpperCase()
</script>

<template>
  <div class="min-h-screen bg-zinc-50 py-40 px-6 lg:px-20">
    <div class="max-w-7xl mx-auto">
      
      <!-- Registry Header -->
      <header class="flex flex-col md:flex-row justify-between items-end gap-20 mb-32">
         <div class="max-w-2xl">
            <h4 class="text-[12px] font-black uppercase tracking-[0.8em] text-blue-600 mb-8">System Repository</h4>
            <h2 class="text-8xl lg:text-[110px] font-black font-serif italic tracking-tighter text-zinc-900 leading-[0.8]">Master <br/>Registry.</h2>
            <p class="text-2xl font-light text-zinc-400 mt-12 leading-relaxed">Systematic database of S10 optical modules. Verified technical data for professional architectural planning.</p>
         </div>
         
         <div class="w-full md:w-auto flex flex-col gap-6">
            <div class="relative group">
               <Search class="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-blue-500 transition-colors" size="20"/>
               <input v-model="searchQuery" type="text" placeholder="Search Model ID / Engineering Spec..." 
                  class="w-full md:w-[400px] bg-white border border-zinc-200 rounded-full py-6 pl-16 pr-8 text-[13px] font-bold uppercase tracking-widest outline-none focus:border-blue-600 shadow-sm transition-all shadow-zinc-100/50" />
            </div>
            <div class="flex flex-wrap gap-3 bg-zinc-200/50 p-2 rounded-full border border-zinc-200">
               <button v-for="c in categories" :key="c.id" @click="selectedCategory = c.id"
                  class="px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                  :class="selectedCategory === c.id ? 'bg-zinc-900 text-white shadow-xl' : 'text-zinc-400 hover:text-zinc-900'">
                  {{ c.name }}
               </button>
            </div>
         </div>
      </header>

      <!-- Registry Grid -->
      <div v-if="filteredProducts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
         <div v-for="l in filteredProducts" :key="l.model" 
            class="bg-white rounded-[4rem] border border-zinc-100 shadow-sm hover:shadow-3xl hover:-translate-y-4 transition-all duration-700 p-10 flex flex-col group relative">
            
            <!-- Technical Tag -->
            <div class="absolute top-8 right-10 text-[8px] font-black uppercase tracking-[0.4em] text-blue-600/30">S10_PROTO</div>

            <div class="aspect-square bg-zinc-50 rounded-[3rem] p-12 mb-12 flex items-center justify-center relative overflow-hidden">
               <img :src="fixDriveUrl(l.photo)" class="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-125 transition-transform duration-1000"/>
            </div>

            <h4 class="text-3xl font-black uppercase tracking-tighter text-zinc-900 mb-2 font-serif italic leading-none">{{ l.model }}</h4>
            <span class="text-[12px] font-black uppercase tracking-[0.3em] text-blue-600 mb-8 block">{{ l.category }} // {{ l.power }}W Protocol</span>
            
            <div class="bg-zinc-50 rounded-[2rem] p-6 mb-8 border border-zinc-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
               <div v-for="(v, k) in (l.specsData || {})" :key="k" class="flex justify-between items-center py-1.5 border-b border-zinc-100 last:border-0 group-hover:border-white/10">
                  <span class="text-[8px] font-black uppercase opacity-40">{{ k }}</span>
                  <span class="text-[10px] font-bold">{{ v }}</span>
               </div>
            </div>

            <footer class="mt-auto pt-8 border-t border-zinc-50 flex justify-between items-center">
               <span class="text-3xl font-black font-serif italic text-zinc-900 group-hover:text-blue-600 transition-colors">£{{ l.price }}</span>
               <button class="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-xl"><ArrowUpRight size="20"/></button>
            </footer>
         </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="py-40 text-center space-y-8">
         <div class="w-24 h-24 bg-zinc-200 rounded-full flex items-center justify-center mx-auto text-zinc-400 rotate-45"><Search size="32"/></div>
         <h3 class="text-4xl font-serif italic font-black text-zinc-900">Module Not Found.</h3>
         <p class="text-zinc-400">The specified engineering component is not in the S10 registry.</p>
         <button @click="searchQuery = ''; selectedCategory = 'ALL'" class="text-blue-600 font-black uppercase tracking-widest text-[11px] border-b-2 border-blue-600 pb-2">Reset Global Registry</button>
      </div>

    </div>
  </div>
</template>
