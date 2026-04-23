<script setup lang="ts">
import { ref, computed } from 'vue'
import { store } from '../store'
import { 
  Zap, 
  Package, 
  ChevronRight, 
  Info, 
  Settings2, 
  Layout as LayoutIcon, 
  Compass, 
  ShieldCheck,
  Plus,
  Minus,
  Download,
  AlertTriangle,
  X
} from 'lucide-vue-next'

import type { Luminaire, BOMItem } from '../types'

const activeTab = ref('config') // 'config' | 'optics' | 'bom'
const currency = ref('GBP')

// --- Calculations ---
const fixDriveUrl = (url: any) => {
  const match = String(url || '').match(/(?:id=|\/d\/|\/file\/d\/)([-\w]{25,})/);
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : url;
};

const findRealItem = (keywords: string[], fallbackDesc: string, fallbackCat: string, qty: number): BOMItem => {
  const item = store.catalog.accessories.find(a => {
    const m = (a.model || '').toString().toUpperCase();
    return keywords.every(k => m.includes(k.toUpperCase()));
  });
  return {
    model: item?.model || `S10-${keywords.join('-')}`,
    category: item?.category || fallbackCat,
    description: item?.description || fallbackDesc,
    quantity: qty,
    price: item?.price || 0,
    photo: fixDriveUrl(item?.photo)
  };
};

const generatedBOM = computed<BOMItem[]>(() => {
  if (!store.catalog.accessories.length) return []
  const { mounting, layout, totalLength, selectedLuminaires } = store.config
  let items: BOMItem[] = []

  let prefix = 'G-TL-A'; 
  if (mounting === 'Embedded concealed') prefix = 'G-TL-D-B';
  else if (mounting === 'Batch ash track') prefix = 'G-TL-D-C';
  else if (mounting === 'Spring fixed') prefix = 'G-TL-D-D';
  else if (mounting === 'Ceiling soft film') prefix = 'G-TL-D-E';

  const trackQty = Math.ceil(totalLength / 2000);
  items.push(findRealItem([prefix, '2M'], `${mounting} Track (2M Engineering Unit)`, 'Tracks', trackQty));
  items.push(findRealItem([prefix, 'END'], 'System End Cap Module', 'Hardware', 2));

  let cornerCount = layout === 'L-Shape' ? 1 : (layout === 'T-Shape' ? 1 : (layout === 'Rectangle' ? 4 : 0));
  if (cornerCount > 0) {
    items.push(findRealItem([prefix, 'CORNER'], '90° Structural Corner Module', 'Hardware', cornerCount));
  }

  if (layout === 'T-Shape' || layout === 'Rectangle') {
    items.push(findRealItem(['POLARITY', prefix.split('-')[2] || 'A'], 'S10 Polarity Alignment Module', 'Technical', 1));
  }

  if (mounting === 'Surface/Hanging') {
    const clipQty = Math.max(2, Math.ceil(totalLength / 1000) * 2);
    items.push(findRealItem(['FIXING', 'CLIP'], 'Heavy Duty Fixing Clip', 'Hardware', clipQty));
  } else if (mounting.includes('Hanging')) {
    const kitQty = Math.ceil(totalLength / 1500) + cornerCount;
    items.push(findRealItem(['SUSPENSION', 'KIT'], 'Architectural Suspension Wire Kit', 'Hardware', kitQty));
  }

  selectedLuminaires.forEach(sel => {
    items.push({
      model: sel.item.model,
      category: 'Luminaires',
      description: 'S10 High-Precision Magnetic Module',
      quantity: sel.quantity,
      price: sel.item.price,
      photo: fixDriveUrl(sel.item.photo)
    });
  });

  const totalW = selectedLuminaires.reduce((acc, s) => acc + (s.item.power * s.quantity), 0);
  const psuQty = Math.ceil((totalW * 1.2) / 160) || 1;
  items.push(findRealItem(['G-TL-POW', '100W'], '48V DC Precision Power Hub', 'Power Supply', psuQty));

  return items;
});

const groupedBOM = computed(() => {
  const groups: Record<string, BOMItem[]> = { 'Tracks': [], 'Luminaires': [], 'Power Supply': [], 'Hardware': [] };
  generatedBOM.value.forEach(item => {
    if (item.category === 'Tracks') groups['Tracks'].push(item);
    else if (item.category === 'Luminaires') groups['Luminaires'].push(item);
    else if (item.category.includes('Power')) groups['Power Supply'].push(item);
    else groups['Hardware'].push(item);
  });
  return Object.entries(groups).filter(([_, items]) => items.length > 0);
});

const currentLoad = computed(() => store.config.selectedLuminaires.reduce((acc, s) => acc + (s.item.power * s.quantity), 0));
const totalPrice = computed(() => generatedBOM.value.reduce((acc, item) => acc + (item.price * item.quantity), 0));

const updateLamp = (lamp: Luminaire, delta: number) => {
  const existing = store.config.selectedLuminaires.find(s => s.item.model === lamp.model)
  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + delta)
    if (existing.quantity === 0) store.config.selectedLuminaires = store.config.selectedLuminaires.filter(x => x.item.model !== lamp.model)
  } else if (delta > 0) store.config.selectedLuminaires.push({ item: lamp, quantity: 1 })
}

const getQty = (m: string) => store.config.selectedLuminaires.find(s => s.item.model === m)?.quantity || 0

// --- Logic for Schematic ---
const schematicLength = computed(() => Math.min(600, (store.config.totalLength / 25000) * 600 + 100))
</script>

<template>
  <div class="h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden selection:bg-blue-500">
    
    <!-- Workbench Header -->
    <header class="h-16 shrink-0 bg-slate-900/50 backdrop-blur-3xl border-b border-white/5 px-8 flex justify-between items-center z-50">
      <div class="flex items-center gap-10">
        <RouterLink to="/" class="flex flex-col group">
           <h1 class="text-xl font-black tracking-tighter text-white font-serif italic leading-none">ACO<span class="text-blue-500 font-sans not-italic">fusion</span></h1>
           <p class="text-[7px] font-black uppercase tracking-[0.4em] text-white/30">Workbench V3.0</p>
        </RouterLink>
        <div class="h-4 w-px bg-white/10 mx-2"></div>
        <div class="flex gap-2">
           <button v-for="t in [
             {id:'config', icon: Settings2, label: 'Parameters'}, 
             {id:'optics', icon: Zap, label: 'Optics Library'},
             {id:'bom', icon: Package, label: 'Project BOM'}
           ]" :key="t.id" @click="activeTab = t.id"
           class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
           :class="activeTab === t.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-white/40 hover:text-white'">
             <component :is="t.icon" size="14"/> {{ t.label }}
           </button>
        </div>
      </div>
      <div class="flex items-center gap-6">
         <div class="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
            <span class="text-[9px] font-black text-white/40 uppercase tracking-widest">Load</span>
            <span class="text-xs font-mono font-bold" :class="currentLoad*1.2 > 160 ? 'text-red-400' : 'text-emerald-400'">{{ currentLoad }}W / 160W</span>
         </div>
         <button @click="() => window.print()" class="px-6 py-2 bg-white text-[#0f172a] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-2xl">Export Proposal</button>

      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      
      <!-- LEFT: Control Panel (320px) -->
      <aside class="w-[380px] bg-slate-900/30 border-r border-white/5 p-8 flex flex-col gap-10 overflow-y-auto hidden xl:flex">
         <section class="space-y-6">
            <h4 class="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">01. Mechanical Base</h4>
            <div class="space-y-4">
               <label class="block text-[11px] font-bold text-white/60 uppercase">Mounting Protocol</label>

               <select v-model="store.config.mounting" class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500/50 transition-all">
                  <option v-for="m in ['Surface/Hanging', 'Embedded concealed', 'Batch ash track', 'Spring fixed', 'Ceiling soft film']" :key="m" :value="m">{{ m }}</option>
               </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
               <div v-for="l in ['Straight', 'L-Shape', 'T-Shape', 'Rectangle']" :key="l" @click="store.config.layout = l"
                  class="p-4 rounded-3xl border-2 transition-all cursor-pointer text-center group"
                  :class="store.config.layout === l ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:border-white/10'">
                  <LayoutIcon size="20" class="mx-auto mb-3" :class="store.config.layout === l ? 'text-blue-500' : 'text-white/20'"/>
                  <span class="text-[10px] font-black uppercase" :class="store.config.layout === l ? 'text-white' : 'text-white/40'">{{ l }}</span>
               </div>
            </div>
         </section>

         <section class="space-y-6">
            <h4 class="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">02. Linear Extension</h4>
            <div class="bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                <div class="flex justify-between items-baseline mb-4">
                   <span class="text-4xl font-mono font-black italic tracking-tighter text-blue-500">{{ store.config.totalLength }}</span>
                   <span class="text-[10px] font-black uppercase text-white/20">Millimetres</span>
                </div>
                <input type="range" v-model.number="store.config.totalLength" min="500" max="25000" step="500" class="w-full accent-blue-500 h-1 bg-white/10 rounded-full" />
                <div class="flex justify-between mt-4 text-[9px] font-black uppercase text-white/20">
                   <span>0.5m</span>
                   <span>25.0m</span>
                </div>
            </div>
         </section>

         <section class="space-y-6">
            <h4 class="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">03. Project Meta</h4>
            <div class="grid grid-cols-2 gap-4">
               <button class="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                  <Download size="20" class="mb-3 text-white/40 group-hover:text-blue-500"/>
                  <span class="text-[9px] font-black uppercase text-white/40">IES/LDT</span>
               </button>
               <button class="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                  <Compass size="20" class="mb-3 text-white/40 group-hover:text-blue-500"/>
                  <span class="text-[9px] font-black uppercase text-white/40">BIM Asset</span>
               </button>
            </div>
         </section>
      </aside>

      <!-- CENTER: Live Schematic Canvas -->
      <main class="flex-1 bg-[#020617] relative flex items-center justify-center p-20 overflow-hidden">
         <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 40px 40px;"></div>
         
         <!-- The Live Blueprint -->
         <div class="relative flex flex-col items-center">
            
            <!-- Technical Annotations -->
            <div class="absolute -top-20 left-0 text-[10px] font-black uppercase tracking-[0.5em] text-blue-500/50 flex gap-10">
               <span>Structural: {{ store.config.layout }}_v3</span>
               <span class="text-white/20">Scale: 1:50</span>
            </div>

            <!-- Track Schematic SVG -->
            <svg :width="schematicLength" height="200" class="filter drop-shadow-[0_0_30px_rgba(37,99,235,0.2)]">
               <rect x="0" y="80" :width="schematicLength" height="20" rx="4" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-width="0.5" stroke-dasharray="4 4" />
               <rect x="0" y="80" :width="schematicLength" height="10" rx="2" fill="#2563eb" fill-opacity="0.2" />
               
               <!-- Power Feed Indicator -->
               <circle cx="10" cy="85" r="4" fill="#2563eb" />
               <line x1="10" y1="85" x2="10" y2="40" stroke="#2563eb" stroke-width="1" />
               <text x="15" y="35" class="text-[8px] fill-blue-500 font-black uppercase tracking-widest">48V ENTRY</text>

               <!-- Render Selected Lights as rectangles -->
               <g v-for="(sel, idx) in store.config.selectedLuminaires" :key="idx">
                  <rect v-for="q in sel.quantity" :x="40 + (idx * 60) + (q * 25)" y="83" width="20" height="4" rx="1" fill="#fff" />
               </g>
            </svg>

            <!-- Metadata Overlay -->
            <div class="mt-20 grid grid-cols-3 gap-20">
               <div v-for="p in [{v: store.config.totalLength + 'mm', l:'True Length'}, {v: (store.config.totalLength/2000).toFixed(1), l:'2M Sections'}, {v: (currentLoad).toFixed(0)+'W', l:'Nominal Load'}]" :key="p.l" class="text-center">
                  <p class="text-xl font-mono font-black italic">{{ p.v }}</p>
                  <span class="text-[8px] font-black uppercase text-white/20 tracking-widest">{{ p.l }}</span>
               </div>
            </div>
         </div>

         <!-- Bottom Optics Bar (If activeTab === 'optics') -->
         <Transition name="slide-up">
            <aside v-if="activeTab === 'optics'" class="absolute bottom-0 left-0 right-0 h-[400px] bg-slate-900 border-t border-white/10 z-40 p-10 flex flex-col gap-6 shadow-[0_-50px_100px_rgba(0,0,0,0.5)]">
               <div class="flex justify-between items-center px-4">
                  <h4 class="text-[12px] font-black uppercase tracking-[0.5em] text-white">S10 Activation Library</h4>
                  <button @click="activeTab = 'config'" class="p-2 hover:bg-white/5 rounded-full"><X size="20"/></button>
               </div>
               <div class="flex-1 overflow-x-auto flex gap-6 p-4 custom-scrollbar">
                  <div v-for="l in store.catalog.lamps" :key="l.model" 
                     class="min-w-[280px] bg-white/5 rounded-[3rem] border border-white/5 p-8 flex flex-col group hover:bg-white/10 transition-all">
                     <div class="aspect-square bg-slate-800 rounded-[2.5rem] p-6 mb-8 relative flex items-center justify-center">
                        <img :src="fixDriveUrl(l.photo)" class="max-w-full max-h-full object-contain mix-blend-screen opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                        <button class="absolute top-4 right-4 text-white/20 hover:text-white"><Info size="18"/></button>
                     </div>
                     <h5 class="text-lg font-black uppercase leading-none mb-2 truncate">{{ l.model }}</h5>
                     <p class="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-6 block">{{ l.category }} // {{ l.power }}W</p>
                     
                     <div class="mt-auto flex items-center justify-between">
                        <span class="text-xl font-mono font-black italic text-blue-500">£{{ l.price }}</span>
                        <div class="flex items-center gap-3 bg-white/5 p-2 rounded-full border border-white/5">
                            <button @click="updateLamp(l, -1)" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"><Minus size="14"/></button>
                            <span class="w-8 text-center text-sm font-black">{{ getQty(l.model) }}</span>
                            <button @click="updateLamp(l, 1)" class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-500 transition-all"><Plus size="14"/></button>
                        </div>
                     </div>
                  </div>
               </div>
            </aside>
         </Transition>
      </main>

      <!-- RIGHT: Live Pricing & BOM (320px) -->
      <aside v-if="activeTab === 'bom' || activeTab === 'config'" class="w-[320px] bg-slate-900 border-l border-white/5 p-8 flex flex-col hidden lg:flex">
         <h4 class="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-8">Live Bill of Materials</h4>
         
         <div class="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
            <div v-for="[groupName, items] in groupedBOM" :key="groupName" class="space-y-4">
               <h5 class="text-[8px] font-black uppercase text-blue-500/50 tracking-widest border-b border-white/5 pb-2">{{ groupName }}</h5>
               <div v-for="item in items" :key="item.model" class="flex items-center gap-4 group">
                  <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center p-1.5 shrink-0">
                     <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain mix-blend-screen opacity-40 group-hover:opacity-100" />
                  </div>
                  <div class="flex-1 min-w-0">
                     <p class="text-[10px] font-black uppercase truncate">{{ item.model }}</p>
                     <p class="text-[7px] text-white/20 uppercase font-bold tabular-nums">£{{ item.price }} x {{ item.quantity }}</p>
                  </div>
                  <span class="text-xs font-mono font-bold text-blue-500">£{{ (item.price * item.quantity).toFixed(0) }}</span>
               </div>
            </div>
         </div>

         <footer class="mt-8 pt-8 border-t border-white/10 space-y-6">
            <div class="flex justify-between items-end">
               <div>
                  <p class="text-[9px] font-black uppercase text-white/20 mb-1">Total Net Assessment</p>
                  <div class="text-5xl font-mono font-black italic tracking-tighter">{{ totalPrice.toLocaleString() }}</div>
               </div>
               <span class="text-2xl font-mono font-bold text-blue-500 mb-1">{{ currency }}</span>
            </div>
            <button @click="() => window.print()" class="w-full py-6 bg-blue-600 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-3xl hover:bg-blue-500 transition-all flex items-center justify-center gap-4">

               Export Blueprint <ChevronRight size="16"/>
            </button>
         </footer>
      </aside>

    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

select option { background: #0f172a; color: white; }

input[type=range] { -webkit-appearance: none; background: transparent; }
input[type=range]::-webkit-slider-thumb { 
  -webkit-appearance: none; 
  height: 16px; width: 16px; 
  border-radius: 50%; 
  background: #2563eb; 
  cursor: pointer; 
  border: 4px solid #0f172a; shadow: 0 0 20px rgba(37,99,235,0.5);
  margin-top: -6px;
}
</style>
