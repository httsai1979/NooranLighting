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
  X
} from 'lucide-vue-next'
import type { Luminaire, Accessory, MountingType, LayoutType, ConfigState, BOMItem } from './types'

// --- System Constants ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzppxxh05KJPZzDHlTK6_so2ILiMCsfkeF3btexeVyZ7zoT-04ksNg4lwSGNkZxUSVkdQ/exec'
const TRACK_UNIT = 2000 // mm
const PSU_CAPACITY = 200 // Watts

// --- Global State ---
const loading = ref(true)
const step = ref(0)
const showSpecs = ref<Luminaire | Accessory | null>(null)
const data = ref<{ lamps: Luminaire[], accessories: Accessory[] }>({ lamps: [], accessories: [] })

const config = ref<ConfigState>({
  mounting: 'Surface',
  layout: 'Straight',
  totalLength: 2000, // as mm
  selectedLuminaires: []
})

// --- Internal Utilities ---
const safeUpper = (val: any) => (val || '').toString().toUpperCase()

const getImageUrl = (url: any) => {
  if (!url) return ''
  const u = url.toString()
  if (u.includes('googleusercontent.com')) return u
  const idMatch = u.match(/id=([-\w]+)/) || u.match(/\/d\/([-\w]+)/)
  return idMatch ? `https://docs.google.com/uc?export=view&id=${idMatch[1]}` : u
}

// --- Data Orchestration ---
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
    console.error('System Load Failed:', e)
  } finally {
    loading.value = false
  }
})

// --- Engineering Logic Engine (TRD & PRD Compliant) ---
const findRealItem = (predicate: (a: Accessory) => boolean, preferredPrefix?: string) => {
  const items = data.value.accessories.filter(predicate)
  if (!items.length) return null
  if (preferredPrefix) {
    const match = items.find(a => (a.model || '').toString().startsWith(preferredPrefix))
    if (match) return match
  }
  return items[0]
}

const calculatedBOM = computed<BOMItem[]>(() => {
  if (!data.value.accessories.length) return []
  const { mounting, layout, totalLength, selectedLuminaires } = config.value
  const bom: BOMItem[] = []

  // 1. Dynamic Series Prefix Logic (Phase 3 Requirement)
  // Surface -> A, Recessed -> B, Trimless -> D, Batch Ash -> C
  const prefix = mounting === 'Trimless' ? 'G-TL-D' : (mounting === 'Recessed' ? 'G-TL-B' : 'G-TL-A')
  
  // 2. Track Calculation
  const track = findRealItem(a => (a.model || '').toString().startsWith(prefix), prefix)
  const profileQty = Math.ceil(totalLength / TRACK_UNIT)
  if (track) {
    bom.push({
      model: `${track.model}-2M`,
      category: 'Profile',
      description: `10mm ${mounting} Magnetic Rail (2.0m)`,
      quantity: profileQty,
      price: track.price || 0,
      photo: getImageUrl(track.photo)
    })
  }

  // 3. Automated Connectors & Corners
  let corners = 0
  if (layout === 'L-Shape') corners = 1
  else if (layout === 'T-Shape') corners = 2
  else if (layout === 'Rectangle') corners = 4

  if (corners > 0) {
    const corner = findRealItem(a => (a.model || '').toString().toLowerCase().includes('corner'), prefix)
    bom.push({
      model: corner?.model || `${prefix}-CORNER`,
      category: 'Hardware',
      description: '90° Structural Interface',
      quantity: corners,
      price: corner?.price || 0,
      photo: getImageUrl(corner?.photo)
    })
  }

  // Polarity Protection (Phase 3 Requirement: T-Shape/Loop Safety)
  if (layout === 'T-Shape' || layout === 'Rectangle') {
    const polarity = findRealItem(a => (a.model || '').toString().toLowerCase().includes('polarity'))
    if (polarity) {
      bom.push({
        model: polarity.model,
        category: 'Electrical',
        description: 'Loop Safety / Phase Balancer',
        quantity: 1,
        price: polarity.price || 0,
        photo: getImageUrl(polarity.photo)
      })
    }
  }

  // Joint and End Finishers
  const endCap = findRealItem(a => (a.model || '').toLowerCase().includes('end cap'), prefix)
  bom.push({ model: endCap?.model || 'END-CAP', category: 'Hardware', description: 'Terminal Cover', quantity: 2, price: endCap?.price || 0, photo: getImageUrl(endCap?.photo) })

  const liveEnd = findRealItem(a => (a.model || '').toLowerCase().includes('live end'), prefix)
  bom.push({ model: liveEnd?.model || 'LIVE-FEED', category: 'Electrical', description: 'System Power Feed', quantity: 1, price: liveEnd?.price || 0, photo: getImageUrl(liveEnd?.photo) })

  const joinerQty = Math.max(0, profileQty - 1 - corners)
  if (joinerQty > 0) {
    const joiner = findRealItem(a => (a.model || '').toLowerCase().includes('connector') && !(a.model || '').toLowerCase().includes('corner'), prefix)
    bom.push({ model: joiner?.model || 'I-JOINER', category: 'Hardware', description: 'Internal Splicing Component', quantity: joinerQty, price: joiner?.price || 0, photo: getImageUrl(joiner?.photo) })
  }

  // 4. Luminaires
  selectedLuminaires.forEach(s => {
    bom.push({ model: s.item.model, category: 'Luminaire', description: `${s.item.power}W Slim Optical Module`, quantity: s.quantity, price: s.item.price || 0, photo: getImageUrl(s.item.photo) })
  })

  // 5. Electrical Safety Redundancy (Phase 3 Requirement)
  // formula: Required = Total Load + Max Single Lamp
  const totalLoadVal = selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0)
  const maxSingleVal = selectedLuminaires.length > 0 ? Math.max(...selectedLuminaires.map(s => s.item.power)) : 0
  const combinedLoad = totalLoadVal + maxSingleVal

  if (totalLoadVal > 0) {
    const driver = data.value.accessories.filter(a => (a.category||'').toLowerCase().includes('driver')).sort((a,b) => (b.price||0)-(a.price||0))[0]
    if (driver) {
       // Calculation with 10% safety ceiling
       const quantity = Math.ceil(combinedLoad / (PSU_CAPACITY * 0.9))
       bom.push({
         model: driver.model,
         category: 'Power Supply',
         description: `48V DC Safety Isolated (${PSU_CAPACITY}W)`,
         quantity: quantity,
         price: driver.price || 0,
         photo: getImageUrl(driver.photo)
       })
    }
  }

  return bom
})

const totalWatts = computed(() => config.value.selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0))
const totalPrice = computed(() => calculatedBOM.value.reduce((a, c) => a + (c.price * c.quantity), 0))
const isOverloaded = computed(() => totalWatts.value > 200)

// --- Interaction Logic ---
const steps = [
  { id: 'mounting', name: 'Mounting Style', desc: 'Define series prefix' },
  { id: 'topology', name: 'Topology', desc: 'Select layout path' },
  { id: 'length', name: 'System Metres', desc: 'Linear extension' },
  { id: 'luminaires', name: 'Luminaires', desc: 'Module selection' },
  { id: 'summary', name: 'Parts List', desc: 'Review & Quotation' }
]

const nextStep = () => {
  if (step.value === 3 && config.value.selectedLuminaires.length === 0) return
  if (step.value === 4 && isOverloaded.value) return 
  step.value++
}

const updateLamp = (lamp: Luminaire, delta: number) => {
  const existing = config.value.selectedLuminaires.find(s => s.item.model === lamp.model)
  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + delta)
    if (existing.quantity === 0) config.value.selectedLuminaires = config.value.selectedLuminaires.filter(x => x.item.model !== lamp.model)
  } else if (delta > 0) config.value.selectedLuminaires.push({ item: lamp, quantity: 1 })
}
</script>

<template>
  <div class="h-screen bg-[#0f172a] text-slate-100 font-sans flex overflow-hidden">
    
    <div v-if="loading" class="fixed inset-0 z-[500] bg-[#0f172a] flex flex-col items-center justify-center">
       <div class="w-16 h-16 border-4 border-slate-800 border-t-[#2563eb] rounded-full animate-spin"></div>
       <p class="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Initialising ACOfusion Logic V2.4</p>
    </div>

    <div class="flex-1 flex flex-col lg:flex-row relative">
      
      <!-- Stepper Navigation -->
      <aside class="hidden lg:flex w-[280px] bg-[#0f172a] border-r border-slate-800/50 p-10 flex-col shrink-0 relative z-30">
        <div class="mb-16">
          <h1 class="text-xl font-black uppercase tracking-tighter text-white font-serif italic">ACOfusion</h1>
          <p class="text-[9px] font-bold text-[#2563eb] uppercase tracking-widest mt-1">S10 System Engineering</p>
        </div>

        <div class="flex-1 space-y-4">
          <div v-for="(s, idx) in steps" :key="s.id" class="relative pl-10 pb-8 last:pb-0" :class="idx <= step ? 'opacity-100' : 'opacity-20'">
             <div v-if="idx < steps.length - 1" class="absolute left-[13px] top-6 bottom-0 w-px border-l-2 border-dotted border-slate-700"></div>
             <div class="absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10"
                :class="idx < step ? 'bg-[#2563eb] text-white' : (idx === step ? 'bg-white border-2 border-[#2563eb] text-[#2563eb]' : 'bg-slate-800 border-2 border-slate-700')">
                <Check v-if="idx < step" size="14" stroke-width="4" />
                <div v-else-if="idx === step" class="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></div>
             </div>
             <h4 class="text-[13px] font-black uppercase tracking-widest">{{ s.name }}</h4>
             <p v-if="idx === step" class="text-[10px] text-slate-400 font-bold mt-1 uppercase">{{ s.desc }}</p>
          </div>
        </div>

        <div class="mt-auto pt-10 border-t border-slate-800 flex flex-col gap-6">
           <a href="https://www.acofusion.com" target="_blank" class="flex gap-3 items-center text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
              <Monitor size="14"/> www.acofusion.com
           </a>
           <a href="mailto:james@acofusion.com" class="flex gap-3 items-center text-[10px] font-bold text-slate-600 hover:text-white transition-colors">
              <Smartphone size="14"/> james@acofusion.com
           </a>
        </div>
      </aside>

      <!-- Main Configurator -->
      <main class="flex-1 bg-white text-slate-900 overflow-y-auto p-6 lg:p-20 relative z-20 print:hidden">
         <div class="max-w-4xl mx-auto">
            
            <Transition name="slide" mode="out-in">
               <div :key="step" class="min-h-[600px] flex flex-col">
                  
                  <div v-if="step === 0" class="space-y-12">
                     <h2 class="text-7xl font-light tracking-tighter italic font-serif leading-none">Mounting Method</h2>
                     <div class="grid grid-cols-2 gap-6">
                        <button v-for="m in (['Surface', 'Trimless', 'Pendant', 'Recessed'] as MountingType[])" :key="m" @click="config.mounting = m"
                           class="p-10 border-2 rounded-[2.5rem] text-left transition-all relative overflow-hidden group"
                           :class="config.mounting === m ? 'border-[#2563eb] bg-blue-50/10' : 'border-slate-50 hover:border-slate-200' ">
                           <Layers class="mb-8 w-12 h-12" :class="config.mounting === m ? 'text-[#2563eb]' : 'text-slate-200' "/>
                           <span class="block text-3xl font-black uppercase tracking-tighter">{{ m }}</span>
                           <p class="text-[10px] font-bold text-slate-400 uppercase mt-4">Structural Logic Path</p>
                        </button>
                     </div>
                  </div>

                  <div v-if="step === 1" class="space-y-12">
                     <h2 class="text-7xl font-light tracking-tighter italic font-serif mb-12">System Topology</h2>
                     <div class="grid grid-cols-2 gap-6">
                        <button v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as LayoutType[])" :key="l" @click="config.layout = l"
                           class="p-8 border-2 rounded-[2.5rem] flex items-center gap-8 transition-all"
                           :class="config.layout === l ? 'border-[#2563eb] bg-blue-50/10' : 'border-slate-100 hover:border-slate-200' ">
                           <div class="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100">
                              <LayoutIcon class="text-slate-300" size="32" />
                           </div>
                           <span class="text-lg font-black uppercase tracking-widest">{{ l }}</span>
                        </button>
                     </div>
                  </div>

                  <div v-if="step === 2" class="space-y-12 text-center py-24 bg-slate-50/30 rounded-[4rem] border border-slate-50">
                     <h2 class="text-4xl font-black uppercase tracking-widest text-[#2563eb] opacity-40 mb-10">Overall Metres</h2>
                     <div class="text-[180px] font-thin text-slate-900 tabular-nums leading-none tracking-tighter italic font-serif">
                        {{ config.totalLength }}<span class="text-4xl font-black text-[#2563eb] not-italic ml-6 mb-20 uppercase">mm</span>
                     </div>
                     <div class="max-w-xl mx-auto px-10 mt-16">
                        <input type="range" min="500" max="10000" step="100" v-model.number="config.totalLength" class="w-full accent-[#2563eb]" />
                        <div class="flex justify-between text-[10px] font-black uppercase text-slate-300 mt-4"><span>Min 500mm</span><span>Max 10,000mm</span></div>
                     </div>
                  </div>

                  <div v-if="step === 3" class="space-y-12">
                     <h2 class="text-7xl font-light tracking-tighter italic font-serif leading-none mb-10">Luminaires</h2>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-6 custom-scrollbar">
                        <div v-for="lamp in data.lamps" :key="lamp.model" class="p-8 border-2 rounded-[3rem] bg-slate-50/50 hover:border-slate-200 transition-all group">
                           <div class="aspect-square bg-white rounded-[2.5rem] overflow-hidden mb-8 relative border border-slate-100 shadow-sm">
                              <img :src="getImageUrl(lamp.photo)" class="w-full h-full object-contain p-10 mix-blend-multiply" />
                              <button @click="showSpecs = lamp" class="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur rounded-full shadow-lg text-[#2563eb] hover:bg-[#2563eb] hover:text-white transition-all"><Maximize2 size="20"/></button>
                           </div>
                           <div class="px-4">
                              <h3 class="text-2xl font-black uppercase tracking-tight mb-2">{{ safeUpper(lamp.model) }}</h3>
                              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{{ lamp.power }}W S10 Engineering Standard</p>
                              <div class="flex items-center justify-between p-3 bg-white rounded-3xl border border-slate-100 shadow-xl">
                                 <button @click="updateLamp(lamp, -1)" class="p-4 text-slate-200 hover:text-[#2563eb] transition-colors"><Minus/></button>
                                 <span class="text-4xl font-mono font-black italic">{{ config.selectedLuminaires.find(s => s.item.model === lamp.model)?.quantity || 0 }}</span>
                                 <button @click="updateLamp(lamp, 1)" class="p-4 text-slate-200 hover:text-[#2563eb] transition-colors"><Plus/></button>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div v-if="step === 4" class="space-y-12">
                     <h2 class="text-7xl font-black italic font-serif text-slate-900 tracking-tighter mb-10">System Parts</h2>
                     <div class="grid grid-cols-1 border-y border-slate-100 divide-y divide-slate-100">
                        <div v-for="(item, i) in calculatedBOM" :key="i" class="py-8 flex items-center gap-10">
                           <div class="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center p-2 shrink-0 border border-slate-100">
                              <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain" />
                              <Package v-else class="text-slate-100"/>
                           </div>
                           <div class="flex-1">
                              <p class="text-lg font-black uppercase italic font-serif leading-none mb-1">{{ safeUpper(item.model) }}</p>
                              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ item.category }} / {{ item.description }}</p>
                           </div>
                           <span class="text-3xl font-mono font-black italic text-slate-200">x{{ item.quantity }}</span>
                        </div>
                     </div>
                  </div>

               </div>
            </Transition>

            <footer class="mt-20 pt-16 border-t border-slate-100 flex justify-between items-center">
               <button @click="step--" v-if="step > 0" class="flex gap-3 items-center text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all"><ChevronLeft size="20"/> Return</button>
               <div v-else></div>
               <div class="flex gap-4">
                  <button v-if="step < 4" @click="nextStep" :disabled="step === 3 && config.selectedLuminaires.length === 0"
                     class="px-16 py-6 bg-[#0f172a] text-white rounded-full flex gap-4 items-center font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-[#2563eb] disabled:opacity-5 transition-all active:scale-95">
                     Next Phase <ChevronRight size="20"/>
                  </button>
                  <button v-else @click="window.print()" class="px-16 py-6 bg-[#2563eb] text-white rounded-full flex gap-4 items-center font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:scale-105 transition-all">
                     <Download size="20"/> Export B2B Quotation
                  </button>
               </div>
            </footer>
         </div>
      </main>

      <!-- Phase 2 Sidebar: Persistent Live BOM + Watts -->
      <aside v-if="!loading" class="hidden xl:flex w-[35%] bg-slate-50 border-l border-slate-100 p-16 flex-col h-screen sticky top-0 shrink-0 print:hidden overflow-hidden">
         <div class="flex justify-between items-end mb-12 border-b border-slate-200 pb-8">
            <div>
               <h4 class="text-[11px] font-black uppercase tracking-[0.5em] text-[#2563eb]">Live BOM Workspace</h4>
               <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">Real-time Engineering Sync</p>
            </div>
            <Package class="text-slate-200" size="24"/>
         </div>

         <div class="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
            <div v-if="calculatedBOM.length === 0" class="h-full flex flex-col items-center justify-center p-20 text-center opacity-10">
               <Zap size="80"/>
               <p class="text-xs uppercase font-black tracking-widest mt-8 italic">Awaiting structural input</p>
            </div>
            <div v-for="(item, i) in calculatedBOM" :key="i" class="flex gap-6 items-center animate-in fade-in slide-in-from-right-10 duration-500">
               <div class="w-16 h-16 bg-white rounded-xl border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-1">
                  <img v-if="item.photo" :src="item.photo" class="w-full h-full object-contain" />
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

         <div class="mt-12 bg-[#0f172a] rounded-[4rem] p-12 text-white relative overflow-hidden group shadow-3xl shadow-[#0f172a]/20">
            <div class="absolute inset-0 bg-[#2563eb] translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
            <div class="relative z-10">
               <div class="flex justify-between items-center mb-6">
                  <span class="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Estimate Total (Net)</span>
                  <div class="flex items-center gap-2">
                     <span class="font-mono text-white/50 text-[11px]">{{ totalWatts.toFixed(0) }}W</span>
                     <div :class="isOverloaded ? 'bg-red-500' : 'bg-[#2563eb]' " class="w-1.5 h-1.5 rounded-full group-hover:bg-white animate-pulse"></div>
                  </div>
               </div>
               <div class="text-8xl font-thin tracking-tighter italic font-serif leading-none">£{{ totalPrice.toLocaleString('en-GB') }}</div>
               <div class="mt-8 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div :class="isOverloaded ? 'bg-red-500' : 'bg-white' " class="h-full transition-all duration-1000" :style="`width: ${Math.min(100, (totalWatts/200)*100)}%` "></div>
               </div>
            </div>
         </div>
      </aside>

    </div>

    <!-- Specs Modal -->
    <Transition name="fade">
      <div v-if="showSpecs" class="fixed inset-0 z-[600] flex items-center justify-center p-12 bg-slate-900/98 backdrop-blur-3xl" @click="showSpecs = null">
        <div class="bg-white max-w-6xl w-full flex flex-col md:flex-row rounded-[4rem] overflow-hidden h-[85vh] shadow-[0_0_120px_rgba(0,0,0,0.4)]" @click.stop>
           <div class="w-full md:w-1/2 bg-slate-50 flex items-center justify-center p-20 border-r border-slate-100 relative">
              <img :src="getImageUrl(showSpecs.photo)" class="w-full h-full object-contain mix-blend-multiply hover:scale-110 transition-transform duration-1000" />
           </div>
           <div class="flex-1 p-20 flex flex-col relative overflow-hidden">
              <button @click="showSpecs = null" class="absolute top-12 right-12 text-slate-300 hover:text-slate-900 transition-colors uppercase font-black text-[10px] tracking-widest flex gap-2 items-center">Close <X size="16"/></button>
              <div class="mb-16">
                 <h2 class="text-6xl font-black italic font-serif uppercase tracking-tighter mb-4 text-[#0f172a] leading-none">{{ safeUpper(showSpecs.model) }}</h2>
                 <div class="w-24 h-2 bg-[#2563eb] rounded-full"></div>
              </div>
              <div class="flex-1 overflow-y-auto space-y-10 pr-10 custom-scrollbar">
                 <div class="grid grid-cols-2 gap-12 text-left">
                    <div v-for="(v, k) in (showSpecs.specsData || {})" :key="k" class="border-b border-slate-50 pb-4">
                       <span class="block text-[10px] font-black uppercase text-[#2563eb] mb-2 tracking-widest">{{ k }}</span>
                       <span class="text-lg font-bold text-slate-900 italic font-serif">{{ v }}</span>
                    </div>
                 </div>
                 <div class="pt-12 border-t border-slate-50 flex gap-6 opacity-30 italic leading-relaxed text-[10px] uppercase font-black tracking-widest">
                    <Info size="18" class="shrink-0"/>
                    <p>All component logic remains subject to systemic L6 engineering review. Deviations may occur based on final site measurement data.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Transition>

    <!-- Professional B2B PDF Template (Phase 3 Requirement) -->
    <div id="print-area" class="hidden print:block p-16 font-sans text-slate-900 bg-white">
       <header class="flex justify-between items-end border-b-[10px] border-[#0f172a] pb-12 mb-20">
          <div>
            <h1 class="text-9xl font-black uppercase italic font-serif tracking-tighter leading-none mb-4">ACOfusion</h1>
            <p class="text-sm font-black tracking-[0.5em] text-[#2563eb] uppercase">S10 Smart Magnetic 48V Rail Configurator // 10mm Pro Series</p>
            <div class="mt-6 text-[10px] font-black text-slate-400 uppercase flex gap-10">
               <span>WWW.ACOFUSION.COM</span>
               <span>JAMES@ACOFUSION.COM</span>
            </div>
          </div>
          <div class="text-right">
             <p class="text-[10px] font-black uppercase text-slate-300">Quotation Created On</p>
             <p class="text-4xl font-mono font-black italic border-b-2 border-slate-100 pb-2">{{ new Date().toLocaleDateString('en-GB') }}</p>
             <p class="text-[10px] font-black text-slate-400 mt-4 tracking-widest italic uppercase">ACO-REF-{{ Math.random().toString(36).substr(2, 6).toUpperCase() }}</p>
          </div>
       </header>

       <section class="grid grid-cols-2 gap-24 mb-20 bg-slate-50 p-16 rounded-[4rem] border-2 border-slate-100">
          <div class="space-y-10">
             <h4 class="text-xs font-black uppercase tracking-[0.4em] border-b-2 border-slate-200 pb-3 mb-6 flex gap-3 items-center"><Zap size="14"/> Technical Configuration</h4>
             <div class="grid grid-cols-1 gap-6 text-lg font-black italic font-serif uppercase text-slate-500">
                <p>Series Implementation: <span class="text-slate-900 border-b border-slate-200 ml-4">{{ config.mounting }} Engine</span></p>
                <p>System Topology: <span class="text-slate-900 border-b border-slate-200 ml-4">{{ config.layout }} Architecture</span></p>
                <p>Dimensional Scale: <span class="text-slate-900 border-b border-slate-200 ml-4 tabular-nums">{{ (config.totalLength).toFixed(0) }}MM</span></p>
                <p>Engineering Load: <span class="text-[#2563eb] border-b border-slate-200 ml-4 tabular-nums">{{ totalWatts.toFixed(1) }}W (Synchronised)</span></p>
             </div>
          </div>
          <div class="text-right border-l-4 border-[#2563eb] pl-20 flex flex-col justify-end">
             <p class="text-[11px] font-black uppercase text-slate-400 tracking-[0.6em] mb-4 leading-none">Net System Quotation (GBP)</p>
             <div class="text-[120px] font-black tracking-tighter leading-none italic font-serif">£{{ totalPrice.toLocaleString('en-GB') }}</div>
             <p class="text-[9px] font-black uppercase opacity-20 mt-12 tracking-[0.2em] italic leading-relaxed text-left border-l border-slate-200 pl-4">Excludes VAT, Logistics & Local Installation Services. Technical data subject to L6 electrical verification.</p>
          </div>
       </section>

       <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-[11px] font-black uppercase tracking-[0.6em] border-b-4 border-[#0f172a] bg-slate-50">
              <th class="py-12 px-10 w-48 text-center text-slate-300 italic">Reference</th>
              <th class="py-12 px-10">Component Material Specifications</th>
              <th class="py-12 px-10 text-center">Qty</th>
              <th class="py-12 px-12 text-right bg-[#0f172a] text-white">Subtotal (Net)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-base">
             <tr v-for="(item, i) in calculatedBOM" :key="i">
                <td class="py-12 px-10 text-center">
                   <div class="w-24 h-24 bg-white border border-slate-100 rounded-3xl overflow-hidden mx-auto mb-4 flex items-center justify-center p-2 shadow-sm">
                      <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain" />
                   </div>
                   <span class="text-[9px] font-mono font-black italic opacity-20 uppercase tracking-tighter">{{ safeUpper(item.model) }}</span>
                </td>
                <td class="py-12 px-10">
                   <div class="text-3xl font-black uppercase tracking-tighter leading-none mb-4 italic font-serif">{{ safeUpper(item.model) }}</div>
                   <div class="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] italic">{{ item.category }} | {{ item.description }}</div>
                </td>
                <td class="py-12 px-10 text-center font-mono font-black text-4xl italic tracking-tighter">x{{ item.quantity }}</td>
                <td class="py-12 px-12 text-right font-mono font-black text-3xl italic tracking-tighter">£{{ ((item.price || 0) * (item.quantity)).toLocaleString('en-GB', { minimumFractionDigits: 1 }) }}</td>
             </tr>
          </tbody>
       </table>

       <footer class="mt-40 pt-20 border-t-8 border-slate-50 grid grid-cols-2 gap-32">
          <div class="space-y-12">
             <h5 class="text-[12px] font-black uppercase tracking-[0.5em] mb-10 border-b-2 border-slate-800 w-fit pb-1">Technical Engineering Compliance</h5>
             <p class="text-[11px] leading-relaxed text-slate-400 font-bold uppercase text-justify italic font-serif">
               Quantities generated via ACOfusion S10 Logic Protocol Build X-912. Final electrical circuit verification by a qualified L6 engineer is mandatory before site installation. System load must not exceed 200W per individual feed. All loop / T-Shape topologies must incorporate official polarity alignment modules to maintain structural system warranty. Failure to comply voids architectural performance guarantees.
             </p>
          </div>
          <div class="text-right flex flex-col justify-end gap-3 translate-y-10">
             <div class="text-3xl font-black uppercase tracking-[0.5em] text-[#0f172a] italic font-serif mb-4">ACOfusion Global (UK) Ltd</div>
             <p class="text-[9px] font-mono font-black opacity-20 italic uppercase tracking-[0.6em] leading-none mb-1">ACOFUSION S10 PRO-ENGINE v2.9.2 - UK STANDARDS</p>
             <p class="text-[9px] font-mono font-black opacity-30 italic uppercase tracking-[0.6em] leading-none">Automated Project Specification Protocol</p>
          </div>
       </footer>
    </div>

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap');

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }

body { margin: 0; background: #0f172a; -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from { opacity: 0; transform: translateY(30px); }
.slide-leave-to { opacity: 0; transform: translateY(-30px); }

input[type=range] { -webkit-appearance: none; background: transparent; }
input[type=range]::-webkit-slider-runnable-track { height: 2px; background: #eee; border-radius: 10px; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #2563eb; cursor: pointer; margin-top: -8px; border: 3px solid white; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); }

@media print {
  body { background: white !important; overflow: visible !important; }
  aside, footer, .Transition, #app > div:not(#print-area), button, header { display: none !important; }
  #print-area { display: block !important; position: static !important; width: 100% !important; margin: 0 !important; padding: 0 !important; transform: scale(1) !important; }
  @page { size: A4 portrait; margin: 5mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
</style>
