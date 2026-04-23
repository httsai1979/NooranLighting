<script setup lang="ts">
import { ShieldCheck, Target, Zap, Globe } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-white py-40 px-6 lg:px-20">
    <div class="max-w-7xl mx-auto">
      
      <!-- Heritage Intro -->
      <header class="max-w-4xl mb-40">
         <h4 class="text-[12px] font-black uppercase tracking-[0.8em] text-blue-600 mb-8">System Heritage</h4>
         <h2 class="text-7xl lg:text-[120px] font-black font-serif italic tracking-tighter text-zinc-900 leading-[0.8]">Philosophy <br/>& Protocol.</h2>
         <p class="text-3xl font-light text-zinc-400 mt-16 leading-relaxed italic border-l-[12px] border-blue-600/10 pl-12 font-serif">
            "We do not design lighting fixtures. We establish high-density optical protocols that honour the structural integrity of the fourth dimension: Space."
         </p>
      </header>

      <!-- The Core Narrative -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-40 mb-40 items-start">
         <div class="space-y-12">
            <h3 class="text-4xl font-black uppercase tracking-tighter text-zinc-900 font-serif italic">United Kingdom <br/>Technical Direction.</h3>
            <div class="prose prose-zinc lg:prose-xl text-zinc-500 leading-relaxed font-medium">
               <p>ACOfusion Global (UK) Ltd operates at the intersection of high-precision electrical engineering and discrete minimalist integration. Based in London, our firm specialises in 48V low-voltage magnetic rail ecosystems, focusing exclusively on the 10mm ultra-thin S10 platform.</p>
               <p>Under the technical leadership of <span class="text-zinc-900 font-black italic">James Tsai</span>, a veteran in architectural lighting systems, ACOfusion has transitioned from a standard product manufacturer into a systemic engineering partner for global architectural practices.</p>
               <p>Our methodology is rooted in the "Poka-yoke" engineering principle—designing systems that are inherently error-proof, electrically safe, and structurally superior by default.</p>
            </div>
            
            <!-- Technical Director Profile Summary -->
            <div class="bg-zinc-50 p-12 rounded-[4rem] border border-zinc-100 flex gap-10 items-center group hover:bg-zinc-900 hover:text-white transition-all duration-700">
               <div class="w-32 h-32 bg-zinc-200 rounded-full flex items-center justify-center shrink-0 text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all">JT</div>
               <div class="space-y-2">
                  <h5 class="text-2xl font-black uppercase tracking-tight italic font-serif leading-none">James Tsai</h5>
                  <p class="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">UK/Europe Technical Director</p>
                  <p class="text-[11px] font-medium opacity-60 leading-relaxed">Systemic Visionary | Electrical Compliance Expert | Lead Architectural Liaison for UK/EU Acquisitions.</p>
               </div>
            </div>
         </div>

         <!-- Performance Standards -->
         <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div v-for="s in [
               {t:'L6 Compliance', d:'Full adherence to Level 6 building services electrical safety standards.', i:ShieldCheck},
               {t:'N+1 Logic', d:'Proprietary safety margin protocols integrated into all PSU calculations.', i: Zap},
               {t:'Global Patent', d:'Exclusive 10mm structural rail interface logic, protected globally.', i: Target},
               {t:'ISO Precision', d:'Manufacturing excellence validated through rigorous thermal cycling.', i: Globe}
            ]" :key="s.t" class="bg-zinc-50 p-12 rounded-[3.5rem] border border-zinc-100 space-y-6 group hover:translate-y-[-10px] transition-all">
               <div class="w-16 h-16 bg-white text-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><component :is="s.i" size="24"/></div>
               <h4 class="text-xl font-black uppercase tracking-tight text-zinc-900">{{ s.t }}</h4>
               <p class="text-[12px] font-medium text-zinc-400 leading-relaxed uppercase">{{ s.d }}</p>
            </div>
         </div>
      </section>

      <!-- Global Footprint Mapping -->
      <section class="py-40 bg-zinc-900 rounded-[6rem] relative overflow-hidden px-12 lg:px-32 text-center text-white">
         <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/world-map.png')] bg-center bg-no-repeat bg-contain"></div>
         <div class="relative z-10 max-w-4xl mx-auto space-y-12">
            <h2 class="text-6xl lg:text-8xl font-serif italic font-black tracking-tighter">London. Taipei. <br/>Global Impact.</h2>
            <p class="text-2xl font-light text-white/40 leading-relaxed">
               Registered in the United Kingdom. Precision engineered internationally. Supporting major architectural developments on every continent.
            </p>
            <div class="flex flex-wrap justify-center gap-20 opacity-20 filter grayscale invert">
               <!-- Placeholder for Certifications/Logos -->
               <span class="text-[12px] font-black tracking-[1em]">CE</span>
               <span class="text-[12px] font-black tracking-[1em]">UKCA</span>
               <span class="text-[12px] font-black tracking-[1em]">ROHS</span>
               <span class="text-[12px] font-black tracking-[1em]">ISO9001</span>
            </div>
         </div>
      </section>

    </div>
  </div>
</template>
