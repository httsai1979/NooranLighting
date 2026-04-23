<script setup lang="ts">
import { ArrowRight, ImageIcon, MapPin, Layers } from 'lucide-vue-next'

const portfolios = [
  {
    id: 1,
    name: 'Metropolitan Art Pavillion',
    location: 'London, UK',
    image: 'https://images.unsplash.com/photo-1544413164-320092671092?auto=format&fit=crop&q=80',
    description: 'Precision accent implementation using S10-Spot modules. Focus on artifact preservation and high CRI (98+) rendering.',
    specs: ['Total Length: 145m', 'Power: 2.4kW Total', 'Series: S10-Surface']
  },
  {
    id: 2,
    name: 'Minimalist Penthouse',
    location: 'Zurich, Switzerland',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80',
    description: 'Bespoke residential integration. The 10mm track was embedded directly into high-gloss concrete segments.',
    specs: ['Mounting: Trimless Concealed', 'Modules: Flood + Deco', 'Topology: L-Shape']
  },
  {
    id: 3,
    name: 'Executive Tech HQ',
    location: 'Silicon Valley, USA',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80',
    description: 'High-density lighting distribution for productivity zones. Integrated smart polarity switching for dynamic layout shifts.',
    specs: ['Topology: Rectangle Loop', 'Load: 8.2kW', 'CCT: 4000K Technical']
  }
]
</script>

<template>
  <div class="min-h-screen bg-white py-40 px-6 lg:px-20">
    <div class="max-w-7xl mx-auto">
      
      <!-- Project Hub Header -->
      <header class="max-w-4xl mb-40">
         <h4 class="text-[12px] font-black uppercase tracking-[0.8em] text-blue-600 mb-8">Case Study Repository</h4>
         <h2 class="text-7xl lg:text-[110px] font-black font-serif italic tracking-tighter text-zinc-900 leading-[0.8]">Global <br/>Installations.</h2>
         <p class="text-2xl font-light text-zinc-400 mt-16 leading-relaxed max-w-2xl">
            A cross-sectional analysis of architectural lighting implementations. S10 series protocol in elite commercial, residential, and gallery environments.
         </p>
      </header>

      <!-- Comparative Architecture (The "Hero" comparison) -->
      <section class="mb-40 space-y-12">
         <div class="flex justify-between items-end">
            <h4 class="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-300">Technical Visualisation</h4>
            <span class="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-full italic tracking-widest leading-none flex items-center gap-3 animate-pulse"><Layers size="14"/> S10 ACTIVATION_ANALYSIS</span>
         </div>
         <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-zinc-900 rounded-[5rem] overflow-hidden group shadow-[0_50px_100px_rgba(0,0,0,0.15)] relative">
            <div class="relative overflow-hidden aspect-video border-r border-white/5">
               <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" class="w-full h-full object-cover grayscale opacity-20" />
               <div class="absolute inset-0 flex items-center justify-center p-12">
                  <div class="text-center">
                    <p class="text-[10px] font-black uppercase text-white tracking-[0.8em] mb-4">Structural Skeleton</p>
                    <p class="text-white/20 font-serif italic text-3xl">Architectural Void</p>
                  </div>
               </div>
            </div>
            <div class="relative overflow-hidden aspect-video">
               <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" class="w-full h-full object-cover shadow-2xl transition-all duration-[3s] group-hover:scale-105" />
               <div class="absolute inset-0 bg-gradient-to-t from-zinc-900/100 via-transparent to-transparent"></div>
               <div class="absolute bottom-10 left-10 flex items-center justify-center">
                  <span class="px-8 py-3 bg-blue-600 text-[10px] font-black uppercase text-white tracking-[0.5em] rounded-full shadow-3xl">ACOfusion ACTIVATED</span>
               </div>
            </div>
            <!-- Interactive Slider Indicator (Decorative) -->
            <div class="absolute inset-y-0 left-1/2 w-4 bg-white/10 backdrop-blur-3xl hidden lg:block"></div>
         </div>
         <p class="text-center text-zinc-300 text-[10px] font-black uppercase tracking-[1em] italic">Engineering Impact Study_S10-System</p>
      </section>

      <!-- Portfolios Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-20">
         <div v-for="p in portfolios" :key="p.id" class="group cursor-pointer">
            <div class="aspect-[16/10] bg-zinc-100 rounded-[4rem] overflow-hidden mb-12 relative shadow-xl border border-zinc-50">
               <img :src="p.image" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
               <div class="absolute top-8 left-8 px-6 py-2.5 bg-white/90 backdrop-blur-3xl rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-900 flex items-center gap-3"><MapPin size="14" class="text-blue-600"/> {{ p.location }}</div>
            </div>
            <div class="px-6 space-y-6">
               <h4 class="text-4xl font-black uppercase tracking-tighter text-zinc-900 italic font-serif leading-none group-hover:text-blue-600 transition-colors">{{ p.name }}</h4>
               <p class="text-zinc-400 text-lg font-medium leading-relaxed italic">{{ p.description }}</p>
               
               <div class="flex flex-wrap gap-3 pt-4">
                  <span v-for="s in p.specs" :key="s" class="px-4 py-1.5 bg-zinc-50 border border-zinc-100 text-[9px] font-black uppercase tracking-widest text-zinc-500 rounded-lg">{{ s }}</span>
               </div>
               
               <button class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-blue-600 pt-6">View Full Technical Study <ArrowRight size="16" class="group-hover:translate-x-2 transition-transform"/></button>
            </div>
         </div>
      </div>

    </div>
  </div>
</template>
