<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, Compass, ShieldCheck, Zap, Layers } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="min-h-[90vh] flex flex-col justify-center px-6 lg:px-20 relative bg-zinc-50 overflow-hidden">
       <div class="absolute inset-0 opacity-[0.03] select-none pointer-events-none" style="background-image: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');"></div>
       
       <div class="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-20 relative z-10">
          <div class="space-y-12">
             <div class="inline-flex items-center gap-6 bg-white px-6 py-2.5 rounded-full border border-zinc-200 shadow-xl">
                <span class="w-3 h-3 bg-blue-600 rounded-full animate-ping"></span>
                <span class="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-600">UK Engineering | S10 Protocol</span>
             </div>
             <h2 class="text-7xl lg:text-[130px] font-black tracking-tighter text-zinc-900 leading-[0.8] italic font-serif">
                Light is <br/><span class="text-blue-600">Precision</span>.
             </h2>
             <p class="text-2xl lg:text-3xl text-zinc-500 font-light max-w-2xl leading-relaxed italic border-l-4 border-blue-600/20 pl-8">
                ACOfusion S10 is the ultimate 10mm magnetic track platform. Minimalist engineering tailored for high-stakes architectural projects.
             </p>
             <div class="flex flex-col sm:flex-row gap-8 pt-8">
                <RouterLink to="/workbench" class="px-16 py-8 bg-zinc-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[13px] shadow-3xl hover:bg-blue-600 transition-all duration-500 flex items-center justify-center gap-4 group">
                  Launch Studio Workbench <ArrowRight class="group-hover:translate-x-2 transition-transform" size="18"/>
                </RouterLink>
                <RouterLink to="/products" class="px-16 py-8 border-2 border-zinc-200 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[13px] text-zinc-400 hover:text-zinc-900 hover:bg-white transition-all text-center">
                   System Registry
                </RouterLink>
             </div>
          </div>
          <div class="relative group hidden lg:block">
             <div class="aspect-[4/5] bg-white rounded-[5rem] overflow-hidden shadow-2xl relative border-[40px] border-white shadow-[0_50px_100px_rgba(0,0,0,0.1)]">
                <img src="https://images.unsplash.com/photo-1544413164-320092671092?auto=format&fit=crop&q=80" class="w-full h-full object-cover grayscale brightness-90 hover:grayscale-0 hover:brightness-100 transition-all duration-[4s]" />
                <div class="absolute bottom-12 left-12 text-zinc-900">
                   <p class="text-[10px] font-black uppercase tracking-[0.6em] mb-4 text-blue-600">Feature Case Study</p>
                   <h4 class="text-4xl font-serif italic font-black">Modernist Pavilion, London</h4>
                </div>
             </div>
             <div class="absolute -top-10 -right-10 w-40 h-40 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-black uppercase tracking-[0.3em] rotate-12 shadow-2xl">S10 Series</div>
          </div>
       </div>
    </section>

    <!-- Value Propositions -->
    <section class="py-40 bg-white px-6 lg:px-20 border-t border-zinc-100">
       <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-32">
          <div v-for="v in [
            {n:'01', t:'Architectural Honor', d:'Discrete 10mm integration that respects structural aesthetics without compromise.', i: Layers},
            {n:'02', t:'Loop Safety Protocol', d:'Advanced 48V low-voltage delivery with integrated polarity protection logic.', i: ShieldCheck},
            {n:'03', t:'Digital Twin Design', d:'Full BIM and Dialux availability for instant structural simulation.', i: Compass}
          ]" :key="v.n" class="space-y-10 group">
             <div class="text-[80px] font-black font-serif italic text-zinc-50 group-hover:text-blue-50 transition-colors leading-none mb-[-40px]">{{ v.n }}</div>
             <div class="w-16 h-16 bg-zinc-50 text-blue-600 rounded-[2rem] flex items-center justify-center border border-zinc-100"><component :is="v.i" size="28"/></div>
             <h3 class="text-3xl font-black uppercase tracking-tighter text-zinc-900 italic font-serif">{{ v.t }}</h3>
             <p class="text-zinc-400 text-lg leading-relaxed font-medium capitalize">{{ v.d }}</p>
          </div>
       </div>
    </section>
  </div>
</template>
