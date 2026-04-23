<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Package, 
  AlertTriangle, 
  Monitor, 
  Smartphone,
  Download,
  Info,
  Maximize2,
  Plus,
  Minus,
  Layers,
  Layout as LayoutIcon,
  X,
  ShieldCheck,
  Binary
} from 'lucide-vue-next'
import type { Luminaire, Accessory, MountingType, LayoutType, ConfigState, BOMItem } from './types'

// --- System Configuration ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzppxxh05KJPZzDHlTK6_so2ILiMCsfkeF3btexeVyZ7zoT-04ksNg4lwSGNkZxUSVkdQ/exec'
const TRACK_UNIT_MM = 2000 
const PSU_MAX_W = 200
const PSU_SAFE_THRESHOLD = 0.9 // 90% utilization limit

// --- App State ---
const loading = ref(true)
const step = ref(0)
const showSpecs = ref<Luminaire | Accessory | null>(null)
const data = ref<{ lamps: Luminaire[], accessories: Accessory[] }>({ lamps: [], accessories: [] })

const config = ref<ConfigState>({
  mounting: 'Surface',
  layout: 'Straight',
  totalLength: 2000, 
  selectedLuminaires: []
})

// --- Logic A: Hardened Image Engine ---
const fixDriveUrl = (url: any) => {
  if (!url) return '';
  const strUrl = String(url);
  // Robust Regex for multiple Drive formats (/d/, id=, file/d/)
  const match = strUrl.match(/(?:id=|\/d\/|\/file\/d\/)([-\w]{25,})/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return strUrl;
};

// --- Data Synchronisation ---
onMounted(async () => {
  try {
    const res = await fetch(GAS_URL)
    const json = await res.json()
    if (json.status === 'success') {
      data.value = {
        lamps: json.data['S10_Magnetic_lamp'] || [],
        accessories: json.data['S10_Track&accessory'] || []
      }
    }
  } catch (e) {
    console.error('Data Engine Error:', e)
  } finally {
    loading.value = false
  }
})

// --- Logic B: Expert BOM Engine (N+1 & Series Mapping) ---
const findRealItem = (keywords: string[], fallbackDesc: string, fallbackCat: string, qty: number): BOMItem => {
  const item = data.value.accessories.find(a => {
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
  if (!data.value.accessories.length) return []
  const { mounting, layout, totalLength, selectedLuminaires } = config.value
  let items: BOMItem[] = []

  // 1. Series Mapping Strategy
  let prefix = 'G-TL-A'; 
  if (mounting === 'Trimless') prefix = 'G-TL-D';
  if (mounting === 'Recessed') prefix = 'G-TL-B';
  if (mounting === 'Batch Ash') prefix = 'G-TL-C';

  const trackQty = Math.ceil(totalLength / TRACK_UNIT_MM);
  
  if (trackQty > 0) {
    // Structural Infrastructure
    items.push(findRealItem([prefix, '2M'], `S10 10mm ${mounting} Track (2.0m)`, 'Infrastructure', trackQty));
    items.push(findRealItem([prefix, '-SM'], 'System End Cap', 'Hardware', 2));
    items.push(findRealItem([prefix, '-ZJDY'], 'Internal Live Feed Module', 'Electrical', 1));
  }

  // 2. Topology & Polarity (Poka-yoke)
  let corners = 0;
  if (layout === 'L-Shape') corners = 1;
  else if (layout === 'T-Shape') corners = 2; // T-Shape requires 2 corners in S10 logic
  else if (layout === 'Rectangle') corners = 4;

  if (corners > 0) {
    items.push(findRealItem([prefix, 'Corner'], '90° Structural Angle', 'Hardware', corners));
  }

  if (layout === 'T-Shape' || layout === 'Rectangle') {
    items.push(findRealItem([prefix, 'Polarity'], 'Loop Safety Phase Balancer', 'Safety', 1));
  }

  // Linear Connectors Calculation: Math.max(0, Qty - 1 - Corners)
  const straightJoints = Math.max(0, trackQty - 1 - corners);
  if (straightJoints > 0) {
    items.push(findRealItem([prefix, 'Connector'], 'Linear Splicing Module', 'Electrical', straightJoints));
  }

  // 3. Optical Modules
  selectedLuminaires.forEach(sel => {
    items.push({
      model: (sel.item.model || 'MODULE').toString().toUpperCase(),
      category: 'Luminaires',
      description: `${sel.item.power}W S10 Slim Module`,
      quantity: sel.quantity,
      price: sel.item.price || 0,
      photo: fixDriveUrl(sel.item.photo)
    });
  });

  // 4. Electrical Redundancy (N+1 safety)
  const totalWatts = selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0);
  if (totalWatts > 0) {
    const maxSingleWatt = Math.max(...selectedLuminaires.map(s => s.item.power));
    const safeCapacityNeeded = totalWatts + maxSingleWatt;
    const psuQty = Math.ceil(safeCapacityNeeded / (PSU_MAX_W * PSU_SAFE_THRESHOLD));
    
    items.push(findRealItem(['Driver'], 'Industrial 48V DC Supply', 'Power', psuQty));
  }

  return items;
});

// Aggregate Helpers
const currentLoad = computed(() => config.value.selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0))
const totalPrice = computed(() => generatedBOM.value.reduce((a, c) => a + (c.price * c.quantity), 0))
const isOverloaded = computed(() => currentLoad.value > PSU_MAX_W)
const safeUpper = (val: any) => (val || '').toString().toUpperCase()

// --- Interaction UI ---
const steps = [
  { id: 'mounting', name: 'Mounting Style', desc: 'Series protocol mapping' },
  { id: 'topology', name: 'Topology', desc: 'Select structural layout' },
  { id: 'length', name: 'System Metres', desc: 'Linear extension scale' },
  { id: 'luminaires', name: 'Luminaires', desc: 'Optical module selection' },
  { id: 'final', name: 'Parts List', desc: 'Review & Quotation' }
]

const updateLamp = (lamp: Luminaire, delta: number) => {
  const existing = config.value.selectedLuminaires.find(s => s.item.model === lamp.model)
  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + delta)
    if (existing.quantity === 0) config.value.selectedLuminaires = config.value.selectedLuminaires.filter(x => x.item.model !== lamp.model)
  } else if (delta > 0) config.value.selectedLuminaires.push({ item: lamp, quantity: 1 })
}
const getQty = (m: string) => config.value.selectedLuminaires.find(s => s.item.model === m)?.quantity || 0

</script>

<template>
  <div class="h-screen bg-[#0f172a] text-slate-100 font-sans flex overflow-hidden selection:bg-[#2563eb] selection:text-white">
    
    <!-- Heavy Loading -->
    <Transition name="fade">
      <div v-if="loading" class="fixed inset-0 z-[500] bg-[#0f172a] flex flex-col items-center justify-center">
         <div class="w-16 h-16 border-4 border-slate-800 border-t-[#2563eb] rounded-full animate-spin"></div>
         <p class="mt-10 text-[10px] font-black uppercase tracking-[0.6em] text-slate-500 animate-pulse">Synchronising S10 Technical Intelligence</p>
      </div>
    </Transition>

    <div class="flex-1 flex flex-col lg:flex-row relative">
      
      <!-- Stepper Sidebar -->
      <aside class="hidden lg:flex w-[260px] bg-[#0f172a] border-r border-slate-800/50 p-10 flex-col shrink-0 relative z-30">
        <div class="mb-16">
          <h1 class="text-2xl font-black uppercase tracking-tighter text-white font-serif italic">ACOfusion</h1>
          <p class="text-[9px] font-bold text-[#2563eb] uppercase tracking-widest mt-1">Industrial Configurator v2.9</p>
        </div>

        <nav class="flex-1 space-y-4">
          <div v-for="(s, idx) in steps" :key="s.id" class="relative pl-10 pb-8 last:pb-0" :class="idx <= step ? 'opacity-100' : 'opacity-20'">
             <div v-if="idx < steps.length - 1" class="absolute left-[13px] top-6 bottom-0 w-px border-l-2 border-dotted border-slate-700"></div>
             <div class="absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10"
                :class="idx < step ? 'bg-[#2563eb] text-white' : (idx === step ? 'bg-white border-2 border-[#2563eb] text-[#2563eb]' : 'bg-slate-800 border-2 border-slate-700')">
                <Check v-if="idx < step" size="14" stroke-width="4" />
                <div v-else-if="idx === step" class="w-2 h-2 bg-[#2563eb] rounded-full"></div>
             </div>
             <h4 class="text-[12px] font-black uppercase tracking-widest">{{ s.name }}</h4>
             <p v-if="idx === step" class="text-[9px] text-[#2563eb] font-bold mt-1 uppercase">{{ s.desc }}</p>
          </div>
        </nav>

        <footer class="mt-auto pt-10 border-t border-slate-800 space-y-4">
           <a href="https://www.acofusion.com" target="_blank" class="flex gap-3 items-center text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase">
              <Monitor size="14"/> acofusion.com
           </a>
           <a href="mailto:james@acofusion.com" class="flex gap-3 items-center text-[10px] font-bold text-slate-600 hover:text-white transition-colors lowercase">
              <Smartphone size="14"/> james@acofusion.com
           </a>
        </footer>
      </aside>

      <!-- Main Interaction Pane -->
      <main class="flex-1 bg-white text-slate-900 overflow-y-auto p-6 lg:p-20 relative z-20 print:hidden transition-all">
         <div class="max-w-4xl mx-auto flex flex-col min-h-full">
            
            <header class="flex justify-between items-center text-slate-300 font-mono text-[10px] uppercase tracking-[0.5em] mb-16">
               <span>SYS:ACO_S10_PROTO</span>
               <div class="h-1 flex-1 mx-10 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-[#2563eb] transition-all duration-1000" :style="`width: ${((step+1)/steps.length)*100}%` "></div>
               </div>
               <span>{{ step + 1 }} / 5</span>
            </header>

            <Transition name="slide" mode="out-in">
               <div :key="step" class="flex-1">
                  
                  <div v-if="step === 0" class="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                     <h2 class="text-7xl font-light tracking-tighter italic font-serif leading-none">Mounting Style</h2>
                     <div class="grid grid-cols-2 gap-6">
                        <button v-for="m in (['Surface', 'Trimless', 'Pendant', 'Recessed'] as MountingType[])" :key="m" @click="config.mounting = m"
                           class="p-10 border-2 rounded-[2.5rem] text-left transition-all relative overflow-hidden"
                           :class="config.mounting === m ? 'border-[#2563eb] bg-blue-50/20' : 'border-slate-50 hover:border-slate-200' ">
                           <Layers class="mb-8 w-12 h-12" :class="config.mounting === m ? 'text-[#2563eb]' : 'text-slate-100' "/>
                           <span class="block text-3xl font-black uppercase tracking-tighter">{{ m }}</span>
                           <p class="text-[10px] font-bold text-slate-400 uppercase mt-4">Series Mapping Applied</p>
                        </button>
                     </div>
                  </div>

                  <div v-if="step === 1" class="space-y-12">
                     <h2 class="text-7xl font-light tracking-tighter italic font-serif mb-12">System Topology</h2>
                     <div class="grid grid-cols-2 gap-6">
                        <button v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as LayoutType[])" :key="l" @click="config.layout = l"
                           class="p-8 border-2 rounded-[2.5rem] flex items-center gap-8 transition-all"
                           :class="config.layout === l ? 'border-[#2563eb] bg-blue-50/10' : 'border-slate-50 hover:border-slate-100' ">
                           <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                              <LayoutIcon class="text-slate-300" size="28" />
                           </div>
                           <span class="text-lg font-black uppercase tracking-widest">{{ l }}</span>
                        </button>
                     </div>
                  </div>

                  <div v-if="step === 2" class="space-y-12 text-center py-20 bg-slate-50/50 rounded-[4rem] border border-slate-100">
                     <h2 class="text-[180px] font-thin text-slate-900 tabular-nums leading-none tracking-tighter italic font-serif">
                        {{ config.totalLength }}<span class="text-4xl font-black text-[#2563eb] not-italic ml-6 mb-20 uppercase">mm</span>
                     </h2>
                     <div class="max-w-xl mx-auto px-10">
                        <input type="range" min="500" max="10000" step="100" v-model.number="config.totalLength" class="w-full accent-[#2563eb] h-1 bg-slate-200 rounded-full" />
                        <div class="flex justify-between text-[10px] font-black uppercase text-slate-300 mt-6 tracking-widest"><span>Min 500mm</span><span>Max 10,000mm</span></div>
                     </div>
                  </div>

                  <div v-if="step === 3" class="space-y-12">
                     <header class="flex justify-between items-end border-b border-slate-50 pb-10 mb-10">
                        <h2 class="text-7xl font-light italic font-serif leading-none">Luminaires</h2>
                        <div v-if="config.selectedLuminaires.length === 0" class="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-bounce">
                           <AlertTriangle size="14"/> Selection Required
                        </div>
                     </header>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-6 custom-scrollbar">
                        <div v-for="lamp in data.lamps" :key="lamp.model" class="p-8 border-2 rounded-[3.5rem] bg-white hover:border-[#2563eb]/20 transition-all shadow-sm group">
                           <div class="aspect-square bg-slate-50 rounded-[3rem] overflow-hidden mb-8 relative border border-slate-50/50">
                              <img :src="fixDriveUrl(lamp.photo)" @error="e=>(e.target as any).style.opacity='0.1'" class="w-full h-full object-contain p-12 mix-blend-multiply transition-transform duration-700 group-hover:scale-110" />
                              <button @click="showSpecs = lamp" class="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur rounded-full shadow-lg text-[#2563eb] hover:bg-[#2563eb] hover:text-white transition-all"><Maximize2 size="18"/></button>
                           </div>
                           <h3 class="text-2xl font-black uppercase tracking-tighter mb-1">{{ safeUpper(lamp.model) }}</h3>
                           <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">{{ lamp.power }}W Engineering Module</p>
                           <div class="flex items-center justify-between p-3 bg-slate-50 rounded-[2rem] border border-slate-100">
                              <button @click="updateLamp(lamp, -1)" class="p-4 text-slate-300 hover:text-slate-900 transition-colors"><Minus/></button>
                              <span class="text-4xl font-mono font-black italic text-slate-900">{{ getQty(lamp.model) }}</span>
                              <button @click="updateLamp(lamp, 1)" class="p-4 text-slate-300 hover:text-slate-900 transition-colors"><Plus/></button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div v-if="step === 4" class="space-y-12">
                     <h2 class="text-7xl font-black italic font-serif text-slate-900 tracking-tighter mb-16">Final Technical Spec</h2>
                     <div class="divide-y divide-slate-50 border-t border-slate-50">
                        <div v-for="(item, i) in generatedBOM" :key="i" class="py-8 flex items-center gap-12 group">
                           <div class="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center p-2 shrink-0 border border-slate-100 group-hover:bg-white transition-colors">
                              <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain mix-blend-multiply" @error="e=>(e.target as any).style.display='none'"/>
                              <Package v-else class="text-slate-100" />
                           </div>
                           <div class="flex-1">
                              <p class="text-lg font-black uppercase italic font-serif leading-none mb-1">{{ safeUpper(item.model) }}</p>
                              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{{ item.category }} | {{ item.description }}</p>
                           </div>
                           <span class="text-4xl font-mono font-black italic text-slate-100 uppercase transition-colors group-hover:text-[#2563eb]">x{{ item.quantity }}</span>
                        </div>
                     </div>
                  </div>

               </div>
            </Transition>

            <footer class="mt-auto pt-16 border-t border-slate-100 flex justify-between items-center">
               <button @click="step--" v-if="step > 0" class="flex gap-3 items-center text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all"><ChevronLeft size="20"/> Return</button>
               <div v-else></div>
               <div class="flex gap-4">
                  <button v-if="step < 4" @click="step++" :disabled="step === 3 && config.selectedLuminaires.length === 0"
                     class="px-16 py-6 bg-[#0f172a] text-white rounded-full flex gap-4 items-center font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-[#2563eb] disabled:opacity-5 transition-all shadow-[#0f172a]/20">
                     Next Stage <ChevronRight size="20"/>
                  </button>
                  <button v-else @click="window.print()" class="px-20 py-6 bg-[#2563eb] text-white rounded-full flex gap-5 items-center font-black uppercase tracking-[0.4em] text-[11px] shadow-3xl hover:shadow-blue-500/50 transition-all active:scale-95">
                     <Download size="20"/> Export B2B Proposal
                  </button>
               </div>
            </footer>
         </div>
      </main>

      <!-- Right Pane: Live BOM Workspace (35%) -->
      <aside v-if="!loading" class="hidden xl:flex w-[35%] bg-slate-50 border-l border-slate-100 p-16 flex-col h-screen sticky top-0 shrink-0 print:hidden overflow-hidden">
         <div class="flex justify-between items-end mb-16 border-b border-slate-200 pb-8">
            <div>
               <h4 class="text-[11px] font-black uppercase tracking-[0.6em] text-[#2563eb]">Engineering Workspace</h4>
               <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">Live Technical Logic System</p>
            </div>
            <Binary class="text-slate-200" size="24"/>
         </div>

         <div class="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
            <div v-if="generatedBOM.length === 0" class="h-full flex flex-col items-center justify-center p-20 text-center opacity-10">
               <Zap size="100"/>
               <p class="text-xs uppercase font-black tracking-widest mt-10 italic">Awaiting System Parameters</p>
            </div>
            <div v-for="(item, i) in generatedBOM" :key="i" class="flex gap-6 items-center animate-in slide-in-from-right-10 duration-500">
               <div class="w-16 h-16 bg-white rounded-xl border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-1 shadow-sm">
                  <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain mix-blend-multiply" />
               </div>
               <div class="flex-1 min-w-0">
                  <div class="flex justify-between">
                     <span class="text-[11px] font-black uppercase text-slate-900 truncate leading-none">{{ safeUpper(item.model) }}</span>
                     <span class="text-xs font-mono font-black italic text-[#2563eb]">x{{ item.quantity }}</span>
                  </div>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">{{ item.description }}</p>
               </div>
            </div>
         </div>

         <div class="mt-16 bg-[#0f172a] rounded-[4rem] p-12 text-white relative overflow-hidden group shadow-3xl">
            <div class="absolute inset-0 bg-[#2563eb] translate-y-full group-hover:translate-y-0 transition-transform duration-1000 z-0"></div>
            <div class="relative z-10">
               <div class="flex justify-between items-center mb-8 border-b border-white/10 pb-6 group-hover:border-white/30 transition-colors">
                  <span class="text-[10px] font-black uppercase tracking-[0.5em] text-white/50">Supply Capability Check</span>
                  <div class="flex items-center gap-3">
                     <span class="font-mono text-white text-base font-black italic">{{ currentLoad.toFixed(0) }}W</span>
                     <div :class="isOverloaded ? 'bg-red-500 scale-150' : 'bg-[#2563eb]' " class="w-2 h-2 rounded-full transition-all group-hover:bg-white animate-pulse"></div>
                  </div>
               </div>
               <div class="flex justify-between items-end">
                  <div>
                    <p class="text-[9px] font-black uppercase text-white/40 mb-2">Estimate Subtotal (Net)</p>
                    <div class="text-[84px] font-thin tracking-tighter italic font-serif leading-none">£{{ totalPrice.toLocaleString('en-GB') }}</div>
                  </div>
                  <ShieldCheck class="mb-2 text-white/20 group-hover:text-white" size="48"/>
               </div>
            </div>
         </div>
      </aside>

    </div>

    <!-- Technical Details Portal (Modal) -->
    <Transition name="fade">
      <div v-if="showSpecs" class="fixed inset-0 z-[600] flex items-center justify-center p-8 lg:p-24 bg-slate-900/98 backdrop-blur-3xl" @click="showSpecs = null">
        <div class="bg-white max-w-7xl w-full flex flex-col md:flex-row rounded-[4rem] overflow-hidden h-[85vh] shadow-[0_0_150px_rgba(0,0,0,0.6)]" @click.stop>
           <div class="w-full md:w-1/2 bg-slate-50 flex items-center justify-center p-24 border-r border-slate-100 relative">
              <div class="absolute top-12 left-12 text-[11px] font-black uppercase text-slate-300 tracking-[0.8em] italic font-serif">S10 System Lens</div>
              <img :src="fixDriveUrl(showSpecs.photo)" class="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-1000" />
           </div>
           <div class="flex-1 p-20 lg:p-28 flex flex-col relative overflow-hidden">
              <button @click="showSpecs = null" class="absolute top-12 right-12 text-slate-300 hover:text-[#0f172a] transition-all transform hover:rotate-90"><X size="44"/></button>
              <div class="mb-20">
                 <h2 class="text-7xl font-black italic font-serif uppercase tracking-tighter mb-6 text-[#0f172a] leading-none">{{ safeUpper(showSpecs.model) }}</h2>
                 <div class="w-40 h-3 bg-[#2563eb] rounded-full"></div>
              </div>
              <div class="flex-1 overflow-y-auto space-y-12 pr-12 custom-scrollbar">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 text-left">
                    <div v-for="(v, k) in (showSpecs.specsData || {})" :key="k" class="border-b border-slate-50 pb-6 group/item hover:border-[#2563eb]/30 transition-colors">
                       <span class="block text-[11px] font-black uppercase text-[#2563eb] mb-2 tracking-[0.3em]">{{ k }}</span>
                       <span class="text-xl font-bold text-slate-900 italic font-serif">{{ v }}</span>
                    </div>
                 </div>
                 <footer class="pt-16 border-t border-slate-50 flex gap-10 opacity-30 italic leading-relaxed text-[11px] uppercase font-black tracking-widest text-[#0f172a]">
                    <ShieldCheck size="24" class="shrink-0"/>
                    <p>Parameters validated against ACOfusion technical registry. Intellectual property protection enforced. Site-specific variance remains within system tolerance.</p>
                 </footer>
              </div>
           </div>
        </div>
      </div>
    </Transition>

    <!-- Professional B2B Blueprint (High-end Print) -->
    <div id="print-area" class="hidden print:block p-20 font-sans text-slate-900 bg-white">
       <header class="flex justify-between items-end border-b-[12px] border-[#0f172a] pb-16 mb-24 relative overflow-hidden">
          <div class="absolute -top-10 -right-20 text-[200px] font-black text-slate-50 select-none pointer-events-none uppercase tracking-tighter">S10_PRO</div>
          <div class="relative z-10">
            <h1 class="text-[120px] font-black uppercase italic font-serif tracking-tighter leading-none mb-4">ACOfusion</h1>
            <p class="text-lg font-black tracking-[0.8em] text-[#2563eb] uppercase">SMART MAGNETIC 48V RAIL CONFIGURATOR // UK STANDARDS</p>
            <div class="mt-8 text-[12px] font-black text-slate-500 uppercase flex gap-12 italic">
               <span>WWW.ACOFUSION.COM</span>
               <span>JAMES@ACOFUSION.COM</span>
            </div>
          </div>
          <div class="text-right relative z-10">
             <p class="text-[11px] font-black uppercase text-slate-300 tracking-[0.3em]">Proposal Created On</p>
             <p class="text-6xl font-mono font-black italic border-b-4 border-slate-100 pb-2 tabular-nums">{{ new Date().toLocaleDateString('en-GB') }}</p>
             <p class="text-[12px] font-black text-[#2563eb] mt-6 tracking-widest italic uppercase">ACO-DOC-S10-{{ Math.random().toString(36).substr(2, 6).toUpperCase() }}</p>
          </div>
       </header>

       <section class="grid grid-cols-2 gap-24 mb-24 bg-slate-50 p-20 rounded-[5rem] border-2 border-slate-100">
          <div class="space-y-12">
             <h4 class="text-[13px] font-black uppercase tracking-[0.6em] border-b-2 border-slate-200 pb-4 mb-8 flex gap-4 items-center text-[#0f172a]"><Zap size="20"/> Technical Implementation Strategy</h4>
             <div class="grid grid-cols-1 gap-8 text-2xl font-black italic font-serif uppercase text-slate-400">
                <p>Mounting Implementation: <span class="text-slate-900 border-b border-slate-200 ml-6">{{ config.mounting }} Series</span></p>
                <p>Geometric Topology: <span class="text-slate-900 border-b border-slate-200 ml-6">{{ config.layout }} Architecture</span></p>
                <p>Dimensional Extension: <span class="text-slate-900 border-b border-slate-200 ml-6 tabular-nums">{{ (config.totalLength).toFixed(0) }}MM</span></p>
                <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mt-4">
                   <p class="text-[10px] text-slate-300 mb-2">Electrical Compliance Summary</p>
                   <span class="text-[#2563eb] text-3xl tabular-nums leading-none">N+1 Safety Load: {{ currentLoad.toFixed(1) }}W (CALCULATED)</span>
                </div>
             </div>
          </div>
          <div class="text-right border-l-[6px] border-[#2563eb] pl-24 flex flex-col justify-end items-end">
             <p class="text-[12px] font-black uppercase text-slate-400 tracking-[1em] mb-6 leading-none">Total Project Net Valuation (GBP)</p>
             <div class="text-[150px] font-black tracking-tighter leading-none italic font-serif text-[#0f172a]">£{{ totalPrice.toLocaleString('en-GB') }}</div>
             <div class="mt-16 text-[10px] font-black uppercase opacity-20 tracking-[0.4em] italic text-right max-w-sm leading-relaxed border-t border-slate-200 pt-8">
               System quotation based on net hardware components. Excludes site management, local logistics, and VAT. Technical data subject to L6 electrical engineer review.
             </div>
          </div>
       </section>

       <table class="w-full text-left border-collapse overflow-hidden rounded-[2rem]">
          <thead>
            <tr class="text-[12px] font-black uppercase tracking-[0.6em] border-b-8 border-[#0f172a] bg-slate-50">
              <th class="py-16 px-12 w-64 text-center text-slate-300 italic">Material Reference</th>
              <th class="py-16 px-12">Technical Engineering Component Specification</th>
              <th class="py-16 px-12 text-center">Qty</th>
              <th class="py-16 px-20 text-right bg-[#0f172a] text-white">Subtotal (Net)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-base">
             <tr v-for="(item, i) in generatedBOM" :key="i" class="break-inside-avoid">
                <td class="py-16 px-12 text-center">
                   <div class="w-32 h-32 bg-white border border-slate-100 rounded-[2rem] overflow-hidden mx-auto mb-6 flex items-center justify-center p-3">
                      <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain mix-blend-multiply" />
                   </div>
                   <span class="text-[10px] font-mono font-black italic opacity-20 uppercase tracking-[0.2em]">{{ safeUpper(item.model) }}</span>
                </td>
                <td class="py-16 px-12">
                   <div class="text-4xl font-black uppercase tracking-tighter leading-none mb-6 italic font-serif text-[#0f172a]">{{ safeUpper(item.model) }}</div>
                   <div class="flex gap-4 items-center">
                      <span class="px-3 py-1 bg-slate-100 rounded text-[9px] font-black uppercase tracking-widest">{{ item.category }}</span>
                      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-[0.5em] italic">{{ item.description }}</span>
                   </div>
                </td>
                <td class="py-16 px-12 text-center font-mono font-black text-6xl italic tracking-tighter">x{{ item.quantity }}</td>
                <td class="py-16 px-20 text-right font-mono font-black text-4xl italic tracking-tighter text-[#0f172a]">£{{ ((item.price || 0) * (item.quantity)).toLocaleString('en-GB', { minimumFractionDigits: 1 }) }}</td>
             </tr>
          </tbody>
       </table>

       <footer class="mt-40 pt-20 border-t-[10px] border-slate-50 grid grid-cols-2 gap-40 break-inside-avoid">
          <div class="space-y-16">
             <h5 class="text-[14px] font-black uppercase tracking-[0.8em] mb-12 border-b-4 border-[#0f172a] w-fit pb-3">Technical Data Compliance Registry</h5>
             <p class="text-[12px] leading-relaxed text-slate-400 font-bold uppercase text-justify italic font-serif">
               Project configurations generated via ACOfusion Smart Logic Engine Protocol v2.9. Finalized electrical circuit verification by a qualified L6 building services engineer is mandatory before site installation sequences. System architectural demand must not exceed 200W per individual power feed point. All loop-based topologies (T-Shape/Rectangle) must incorporate verified S10 Polarity Alignment Modules to maintain structural system warranty. Failure to comply with these technical protocols voids architectural performance guarantees.
             </p>
          </div>
          <div class="text-right flex flex-col justify-end gap-5">
             <div class="text-5xl font-black uppercase tracking-[0.5em] text-[#0f172a] italic font-serif mb-8 leading-none">ACOfusion Global (UK) Ltd</div>
             <div class="space-y-1 opacity-20">
               <p class="text-[11px] font-mono font-black italic uppercase tracking-[0.8em]">S10-IND-CONFIG-PROTO-UK-SPEC_v2.9.21</p>
               <p class="text-[11px] font-mono font-black italic uppercase tracking-[0.8em]">AUTOMATED B2B ENGINEERING EXPORT SYSTEM</p>
             </div>
          </div>
       </footer>
    </div>

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@500;700&display=swap');

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }

body { margin: 0; background: #0f172a; -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from { opacity: 0; transform: translateY(30px); }
.slide-leave-to { opacity: 0; transform: translateY(-30px); }

input[type=range] { -webkit-appearance: none; background: transparent; }
input[type=range]::-webkit-slider-runnable-track { height: 1px; background: #eee; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #2563eb; cursor: pointer; margin-top: -8px; border: 2px solid white; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); }

@media print {
  body { background: white !important; overflow: visible !important; }
  aside, footer, .Transition, #app > div:not(#print-area), button, header { display: none !important; }
  #print-area { display: block !important; position: static !important; width: 100% !important; margin: 0 !important; padding: 0 !important; transform: scale(1) !important; }
  @page { size: A4 portrait; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
</style>
