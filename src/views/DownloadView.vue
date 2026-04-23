<script setup lang="ts">
import { Download, FileText, Globe, Key, FileTerminal, FileVideo, ShieldCheck, Layers, Package, Leaf, ArrowUpRight } from 'lucide-vue-next'

const assets = [
  {
    category: 'System specifications',
    items: [
      { t: 'S10 Master Catalog 2026', d: 'v2.9.2 // Full technical ecosystem analysis.', size: '42.5 MB', icon: FileText },
      { t: 'Mounting Implementation Logic', d: 'Structural protocol for recessed/embedded variants.', size: '12.8 MB', icon: FileTerminal },
      { t: 'Thermal Dissipation Report', d: 'Certified data on system performance under load.', size: '8.4 MB', icon: ShieldCheck }
    ]
  },
  {
    category: 'Digital twin & simulation',
    items: [
      { t: 'DIALux Photometric Library', d: 'LDT/IES files for S10 optical modules.', size: '155 MB', icon: Globe },
      { t: 'Revit (BIM) Structural Models', d: 'Parametric families for architectural planning.', size: '210 MB', icon: Layers },
      { t: 'SketchUp Component Registry', d: 'High-fidelity models for visual simulation.', size: '84 MB', icon: Package }
    ]
  },
  {
    category: 'Legal & certification',
    items: [
       { t: 'Safety Compliance Registry', d: 'UKCA / CE / LVD certifications.', size: '2.1 MB', icon: Key },
       { t: 'Environmental ESG Protocol', d: 'ACOfusion sustainability & lifecycle data.', size: '3.5 MB', icon: Leaf }
    ]
  }
]
</script>

<template>
  <div class="min-h-screen bg-zinc-950 py-40 px-6 lg:px-20 text-white selection:bg-blue-600">
    <div class="max-w-7xl mx-auto">
      
      <!-- Central Hub Header -->
      <header class="max-w-4xl mb-40 relative">
         <div class="absolute -left-20 top-0 text-[150px] font-black text-white/[0.02] italic font-serif select-none pointer-events-none uppercase">Hub.</div>
         <h4 class="text-[12px] font-black uppercase tracking-[0.8em] text-blue-500 mb-8">Resource Center</h4>
         <h2 class="text-7xl lg:text-[110px] font-black font-serif italic tracking-tighter leading-[0.8] mb-12">Technical <br/>Download Station.</h2>
         <p class="text-2xl font-light text-white/30 leading-relaxed max-w-2xl">
            Access secure engineering datasets, BIM assets, and environmental protocols. S10 system documentation is updated weekly to reflect the latest UK engineering revisions.
         </p>
      </header>

      <!-- Asset Grid -->
      <div class="space-y-32">
        <section v-for="group in assets" :key="group.category" class="space-y-12">
           <h4 class="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 border-b border-white/5 pb-6">{{ group.category }}</h4>
           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div v-for="item in group.items" :key="item.t" 
                 class="bg-white/[0.03] border border-white/5 p-12 rounded-[4rem] group hover:bg-white/[0.08] transition-all duration-500 relative overflow-hidden flex flex-col">
                 <div class="absolute -right-10 -top-10 text-white/[0.01] text-[150px] font-black italic">{{ item.t.charAt(0) }}</div>
                 
                 <div class="w-20 h-20 bg-white/5 text-blue-500 rounded-[2rem] flex items-center justify-center mb-10 group-hover:bg-blue-600 group-hover:text-white transition-all duration-700">
                    <component :is="item.icon || Download" size="32"/>
                 </div>
                 
                 <h4 class="text-3xl font-black uppercase tracking-tight font-serif italic leading-none mb-6">{{ item.t }}</h4>
                 <p class="text-white/30 text-lg mb-auto font-medium leading-relaxed italic">{{ item.d }}</p>
                 
                 <footer class="mt-12 pt-8 border-t border-white/5 flex justify-between items-center group-hover:border-white/10 transition-colors">
                    <span class="text-[10px] font-black font-mono text-white/20">{{ item.size }} // SECURE_ARCHIVE</span>
                    <button class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-white transition-colors">
                       Request Access <ArrowUpRight size="16"/>
                    </button>
                 </footer>
              </div>
           </div>
        </section>
      </div>

      <!-- Quick Technical Support Contact -->
      <section class="mt-40 bg-blue-600 rounded-[5rem] p-16 lg:p-32 flex flex-col lg:flex-row justify-between items-center gap-20 shadow-[0_50px_100px_rgba(37,99,235,0.3)]">
         <div class="space-y-6 text-center lg:text-left">
            <h3 class="text-5xl lg:text-7xl font-black font-serif italic tracking-tighter leading-none text-white">Requirement Not Found?</h3>
            <p class="text-2xl text-white/60 font-medium">Direct liaison with our UK architectural desk for bespoke engineering files.</p>
         </div>
         <a href="mailto:service@acofusion.com" class="px-16 py-8 bg-white text-blue-600 rounded-full font-black uppercase tracking-[0.4em] text-[13px] hover:scale-105 active:scale-95 transition-all shadow-3xl">Liaison Request</a>
      </section>

    </div>
  </div>
</template>
