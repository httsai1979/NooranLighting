<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  Info,
  Maximize2,
  Plus,
  Minus,
  Download,
  AlertTriangle,
  RotateCcw,
  Zap,
  Package,
  X,
  Layers,
  Layout as LayoutIcon,
  Monitor,
  Smartphone
} from 'lucide-vue-next'
import type { Luminaire, Accessory, MountingType, LayoutType, ConfigState, BOMItem } from './types'

// --- Constants & Config ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzppxxh05KJPZzDHlTK6_so2ILiMCsfkeF3btexeVyZ7zoT-04ksNg4lwSGNkZxUSVkdQ/exec'
const TRACK_UNIT = 2.0
const MAX_SAFE_WATTAGE = 200

// --- Reactive State ---
const loading = ref(true)
const step = ref(0)
const showSpecs = ref<Luminaire | Accessory | null>(null)
const data = ref<{ lamps: Luminaire[], accessories: Accessory[] }>({ lamps: [], accessories: [] })

const config = ref<ConfigState>({
  mounting: 'Surface',
  layout: 'Straight',
  totalLength: 2,
  selectedLuminaires: []
})

// --- Steps Definition (British English) ---
const steps = [
  { id: 'mounting', name: 'Mounting Method', desc: 'Define architectural installation' },
  { id: 'topology', name: 'System Topology', desc: 'Select geometric pathing' },
  { id: 'length', name: 'System Metres', desc: 'Define linear extension' },
  { id: 'luminaires', name: 'Luminaires', desc: 'Select lighting modules' },
  { id: 'validation', name: 'Engineering', desc: 'Final technical check' }
]

// --- Data Orchestration ---
const fetchData = async () => {
  try {
    const res = await fetch(GAS_URL)
    const json = await res.json()
    if (json.status === 'success') {
      data.value = {
        lamps: json.data['S10_Magnetic_lamp'] || [],
        accessories: json.data['S10_Track&accessory'] || []
      }
    }
  } catch (err) {
    console.error('Initialisation Error:', err)
  } finally {
    loading.value = false
  }
}
onMounted(fetchData)

// Image URL Resolver (Hardened for Drive)
const getImageUrl = (url: any) => {
  if (!url) return ''
  const u = url.toString()
  if (u.includes('googleusercontent.com')) return u
  const idMatch = u.match(/id=([-\w]+)/) || u.match(/\/d\/([-\w]+)/)
  return idMatch ? `https://docs.google.com/uc?export=view&id=${idMatch[1]}` : u
}

// --- Logic Engine (BOM Calculation) ---
const findRealItem = (predicate: (a: Accessory) => boolean, prefix?: string) => {
  const items = data.value.accessories.filter(predicate)
  if (!items.length) return null
  return prefix ? (items.find(a => (a.model || '').startsWith(prefix)) || items[0]) : items[0]
}

const calculatedBOM = computed<BOMItem[]>(() => {
  if (!data.value.accessories.length) return []
  const { mounting, layout, totalLength, selectedLuminaires } = config.value
  const bom: BOMItem[] = []

  // 1. Profile Pieces
  const prefix = mounting === 'Trimless' ? 'G-TL-D' : (mounting === 'Recessed' ? 'G-TL-B' : 'G-TL-A')
  const track = findRealItem(a => (a.model || '').startsWith(prefix), prefix)
  const profileQty = Math.ceil(totalLength / TRACK_UNIT)
  bom.push({
    model: track?.model || `${prefix}-2M`,
    category: 'Profile',
    description: `10mm ${mounting} Magnetic Track (2.0 Metres)`,
    quantity: profileQty,
    price: track?.price || 0,
    photo: getImageUrl(track?.photo)
  })

  // 2. Topology Accessories
  let cornerCount = 0
  if (layout === 'L-Shape') cornerCount = 1
  if (layout === 'T-Shape') cornerCount = 2
  if (layout === 'Rectangle') cornerCount = 4

  if (cornerCount > 0) {
    const corner = findRealItem(a => (a.model || '').toLowerCase().includes('corner'), prefix)
    bom.push({
      model: corner?.model || 'CORNER-MOD',
      category: 'Hardware',
      description: '90° Structural Angle Module',
      quantity: cornerCount,
      price: corner?.price || 0,
      photo: getImageUrl(corner?.photo)
    })
  }

  if (layout === 'T-Shape' || layout === 'Rectangle') {
    const pol = findRealItem(a => (a.model || '').toLowerCase().includes('polarity'))
    bom.push({
      model: pol?.model || 'POLARITY',
      category: 'Electrical',
      description: 'Loop Safety Polarity Changer',
      quantity: 1,
      price: pol?.price || 0,
      photo: getImageUrl(pol?.photo)
    })
  }

  // 3. Components
  const cap = findRealItem(a => (a.model || '').toLowerCase().includes('end cap'), prefix)
  bom.push({ model: cap?.model || 'END-CAP', category: 'Hardware', description: 'End Plate', quantity: 2, price: cap?.price || 0, photo: getImageUrl(cap?.photo) })

  const feed = findRealItem(a => (a.model || '').toLowerCase().includes('live end'), prefix)
  bom.push({ model: feed?.model || 'LIVE-FEED', category: 'Electrical', description: 'Power Input', quantity: 1, price: feed?.price || 0, photo: getImageUrl(feed?.photo) })

  // 4. Luminaires
  selectedLuminaires.forEach(s => {
    bom.push({ model: s.item.model, category: 'Luminaire', description: `${s.item.power}W Optical Module`, quantity: s.quantity, price: s.item.price || 0, photo: getImageUrl(s.item.photo) })
  })

  // 5. PSU Logic (Auto-stacking)
  const load = selectedLuminaires.reduce((a,c) => a + (c.item.power * c.quantity), 0)
  if (load > 0) {
    const driver = data.value.accessories.filter(a => (a.category||'').toLowerCase().includes('driver')).sort((a,b) => (b.price||0)-(a.price||0))[0]
    if (driver) {
       const qty = Math.ceil((load + 15) / 185) // N+1ish safety
       bom.push({ model: driver.model, category: 'Power', description: '48V DC Industry Grade Driver', quantity: qty, price: driver.price || 0, photo: getImageUrl(driver.photo) })
    }
  }

  return bom
})

const totalLoadValue = computed(() => config.value.selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0))
const totalPriceValue = computed(() => calculatedBOM.value.reduce((a, c) => a + (c.price * c.quantity), 0))
const overloadStatus = computed(() => totalLoadValue.value > MAX_SAFE_WATTAGE)

// --- Interaction Helpers ---
const updateLamp = (lamp: Luminaire, delta: number) => {
  const existing = config.value.selectedLuminaires.find(s => s.item.model === lamp.model)
  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + delta)
    if (existing.quantity === 0) config.value.selectedLuminaires = config.value.selectedLuminaires.filter(x => x.item.model !== lamp.model)
  } else if (delta > 0) config.value.selectedLuminaires.push({ item: lamp, quantity: 1 })
}
const getLampQty = (m: string) => config.value.selectedLuminaires.find(s => s.item.model === m)?.quantity || 0

const canContinue = computed(() => {
  if (step.value === 3) return config.value.selectedLuminaires.length > 0
  if (step.value === 4) return !overloadStatus.value
  return true
})
</script>

<template>
  <div class="h-screen bg-[#0f172a] text-slate-100 font-sans flex overflow-hidden">
    
    <!-- Animated Loading Overlay -->
    <Transition name="fade">
      <div v-if="loading" class="fixed inset-0 z-[500] bg-[#0f172a] flex flex-col items-center justify-center">
        <div class="w-16 h-16 border-4 border-slate-800 border-t-[#2563eb] rounded-full animate-spin"></div>
        <p class="mt-8 text-[11px] font-black uppercase tracking-[0.6em] text-slate-500">Initialising ACOfusion S10 Engine</p>
      </div>
    </Transition>

    <!-- UI Structure: Responsive Split-Pane -->
    <div class="flex-1 flex flex-col lg:flex-row relative">
      
      <!-- Left Sidebar: Stepper (Erco Style Navigation) -->
      <aside class="hidden lg:flex w-[280px] bg-[#0f172a] border-r border-slate-800/50 p-10 flex-col shrink-0">
        <div class="mb-12">
           <h1 class="text-xl font-black uppercase tracking-tighter text-white font-serif italic">ACOfusion</h1>
           <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">S10 Smart Configuration Portal</p>
        </div>

        <div class="flex-1 space-y-1">
           <div v-for="(s, idx) in steps" :key="s.id" class="relative pl-8 pb-10 last:pb-0" :class="idx <= step ? 'opacity-100' : 'opacity-20'">
              <div v-if="idx < steps.length - 1" class="absolute left-[11px] top-6 bottom-0 w-px border-l border-slate-800"></div>
              <div class="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10"
                :class="idx < step ? 'bg-[#2563eb]' : (idx === step ? 'bg-white text-navy ring-4 ring-[#2563eb]/20' : 'bg-slate-800')">
                 <Check v-if="idx < step" class="text-white" size="12" stroke-width="4" />
                 <div v-else-if="idx === step" class="w-2 h-2 rounded-full bg-[#2563eb]"></div>
              </div>
              <span class="block text-[12px] font-black uppercase tracking-widest" :class="idx === step ? 'text-white' : 'text-slate-500'">{{ s.name }}</span>
              <p v-if="idx === step" class="text-[10px] text-[#2563eb] font-bold mt-1 uppercase">{{ s.desc }}</p>
           </div>
        </div>

        <div class="mt-auto border-t border-slate-800 pt-8 space-y-4">
           <a href="https://www.acofusion.com" target="_blank" class="flex gap-3 items-center text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
              <Monitor size="14"/> www.acofusion.com
           </a>
           <a href="mailto:james@acofusion.com" class="flex gap-3 items-center text-[10px] font-bold text-slate-600 hover:text-white transition-colors">
              <Smartphone size="14"/> james@acofusion.com
           </a>
        </div>
      </aside>

      <!-- Centre Pane: Configuration Wizard (65% on Desktop) -->
      <main class="flex-1 bg-white text-slate-900 overflow-y-auto p-6 lg:p-20 relative z-10 transition-all">
         <div class="max-w-4xl mx-auto space-y-16">
            
            <header class="flex justify-between items-center text-slate-400 font-mono text-[10px] uppercase tracking-[0.4em] mb-10">
               <span>ACOfusion // Project Sequence {{ step + 1 }}</span>
               <div class="h-1 flex-1 mx-10 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-[#2563eb] transition-all duration-1000" :style="`width: ${((step+1)/steps.length)*100}%` "></div>
               </div>
               <span>{{ step + 1 }} / 5</span>
            </header>

            <Transition name="slide" mode="out-in">
               <div :key="step" class="min-h-[500px]">
                  
                  <!-- Step 0: Mounting (British English) -->
                  <div v-if="step === 0" class="space-y-12">
                     <h2 class="text-6xl font-light tracking-tighter text-slate-900 font-serif italic mb-10 leading-none">Mounting Method</h2>
                     <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <button v-for="m in (['Surface', 'Trimless', 'Pendant', 'Recessed'] as MountingType[])" :key="m" @click="config.mounting = m"
                           class="group relative h-72 border-2 rounded-[2rem] p-10 transition-all text-left overflow-hidden"
                           :class="config.mounting === m ? 'border-[#2563eb] ring-4 ring-[#2563eb]/10 bg-white' : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'">
                           <div class="flex justify-between items-start mb-10">
                              <Layers class="w-10 h-10 group-hover:text-[#2563eb] transition-colors" :class="config.mounting === m ? 'text-[#2563eb]' : 'text-slate-200' " />
                              <div v-if="config.mounting === m" class="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white shadow-xl animate-in fade-in scale-in-75"><Check size="20" stroke-width="4"/></div>
                           </div>
                           <span class="block text-3xl font-black uppercase tracking-tighter">{{ m }}</span>
                           <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Professional Structural Protocol</p>
                        </button>
                     </div>
                  </div>

                  <!-- Step 1: Topology -->
                  <div v-if="step === 1" class="space-y-12">
                     <h2 class="text-6xl font-light tracking-tighter text-slate-900 font-serif italic mb-10 leading-none">System Topology</h2>
                     <div class="grid grid-cols-2 gap-4">
                        <button v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as LayoutType[])" :key="l" @click="config.layout = l"
                           class="p-8 border-2 rounded-[2rem] transition-all flex items-center gap-6"
                           :class="config.layout === l ? 'border-[#2563eb] bg-blue-50/20' : 'border-slate-100 hover:border-slate-200' ">
                           <div class="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                              <LayoutIcon class="text-slate-300" />
                           </div>
                           <div>
                              <p class="text-sm font-black uppercase tracking-widest text-slate-900 leading-none mb-1">{{ l }}</p>
                              <p class="text-[9px] text-slate-400 font-bold uppercase">Geometric Logic</p>
                           </div>
                        </button>
                     </div>
                  </div>

                  <!-- Step 2: System Metres -->
                  <div v-if="step === 2" class="space-y-12 text-center py-20">
                     <h2 class="text-6xl font-light tracking-tighter text-slate-900 font-serif italic mb-16 leading-none">Overall Metres</h2>
                     <div class="text-[180px] font-thin text-[#0f172a] tabular-nums tracking-tighter italic font-serif leading-none flex items-center justify-center">
                        {{ config.totalLength }}<span class="text-4xl font-black text-[#2563eb] ml-6 mb-16 not-italic">MM</span>
                     </div>
                     <div class="max-w-xl mx-auto mt-20 relative px-10">
                        <div class="absolute inset-x-10 -top-8 flex justify-between text-[10px] font-black uppercase text-slate-300"><span>500mm</span><span>10,000mm</span></div>
                        <input type="range" min="500" max="10000" step="100" v-model.number="config.totalLength" class="w-full accent-[#2563eb] h-1.5 bg-slate-100 rounded-full" />
                     </div>
                  </div>

                  <!-- Step 3: Luminaires (Enhanced Grid Layout) -->
                  <div v-if="step === 3" class="space-y-12">
                     <header class="flex justify-between items-end border-b border-slate-100 pb-10 mb-10">
                        <h2 class="text-6xl font-light text-slate-900 font-serif italic leading-none">Luminaires</h2>
                        <div v-if="config.selectedLuminaires.length === 0" class="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-2"><AlertTriangle size="14"/> Selection Required</div>
                     </header>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-6 custom-scrollbar">
                        <div v-for="lamp in data.lamps" :key="lamp.model" class="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-6 group hover:border-[#2563eb]/30 transition-all">
                           <div class="aspect-square bg-white rounded-[2rem] border border-slate-50 overflow-hidden relative mb-6 shadow-sm group-hover:scale-[1.02] transition-transform">
                              <img :src="getImageUrl(lamp.photo)" class="w-full h-full object-contain p-10 mix-blend-multiply" @error="handleImgError" />
                              <button @click="showSpecs = lamp" class="absolute bottom-6 right-6 p-4 bg-white/80 backdrop-blur rounded-full shadow-xl text-[#2563eb] hover:bg-[#2563eb] hover:text-white transition-all"><Maximize2 size="20"/></button>
                           </div>
                           <div class="px-2">
                              <h3 class="text-xl font-black uppercase tracking-tight text-slate-900 leading-none mb-2">{{ lamp.model }}</h3>
                              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{{ lamp.power }}W Smart Module</p>
                              
                              <div class="flex items-center justify-between bg-white rounded-[1.5rem] p-3 border border-slate-100 shadow-sm">
                                 <button @click="updateLamp(lamp, -1)" class="p-4 text-slate-300 hover:text-[#2563eb] transition-colors"><Minus size="20" /></button>
                                 <span class="text-3xl font-mono font-black italic">{{ getLampQty(lamp.model) }}</span>
                                 <button @click="updateLamp(lamp, 1)" class="p-4 text-slate-300 hover:text-[#2563eb] transition-colors"><Plus size="20" /></button>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <!-- Step 4: Verification -->
                  <div v-if="step === 4" class="space-y-12">
                     <h2 class="text-6xl font-light text-slate-900 font-serif italic mb-10 text-center">Engineering</h2>
                     <div class="p-16 border-4 rounded-[4rem] text-center transition-all bg-slate-50/50" :class="overloadStatus ? 'border-red-500' : 'border-[#2563eb]' ">
                        <p class="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 mb-8">System Integration Check</p>
                        <div class="text-[140px] font-thin text-slate-900 tabular-nums italic font-serif leading-none">{{ totalLoadValue.toFixed(0) }}<span class="text-3xl font-black text-slate-300 ml-4">W</span></div>
                        <div class="h-3 w-full max-w-xl mx-auto bg-slate-200 rounded-full overflow-hidden mt-12 mb-12">
                           <div class="h-full transition-all duration-1000" :class="overloadStatus ? 'bg-red-500' : 'bg-[#2563eb]' " :style="`width: ${Math.min(100, (totalLoadValue/MAX_SAFE_WATTAGE)*100)}%` "></div>
                        </div>
                        <div v-if="overloadStatus" class="bg-red-50 p-6 rounded-3xl inline-flex items-center gap-4 text-red-600 font-black uppercase text-xs animate-bounce"><AlertTriangle /> Circuit Demand Exceeded (Limit 200W)</div>
                        <div v-else class="text-[#2563eb] font-black uppercase text-[10px] flex items-center justify-center gap-3"><Check size="16" stroke-width="4"/> Optimal Structural Stability Attained</div>
                     </div>
                  </div>

               </div>
            </Transition>

            <!-- Navigation Bar -->
            <footer class="pt-20 border-t border-slate-100 flex justify-between items-center">
               <button @click="step--" v-if="step > 0" class="px-10 py-5 text-slate-400 hover:text-slate-900 flex gap-3 items-center font-black uppercase text-[10px] tracking-widest transition-all"><ChevronLeft size="18"/> Return</button>
               <div v-else></div>

               <button @click="step++" v-if="step < 4" :disabled="!canContinue" class="px-16 py-6 bg-[#0f172a] text-white flex gap-4 items-center rounded-full font-black uppercase text-[11px] tracking-[0.3em] hover:bg-[#2563eb] disabled:opacity-5 transition-all shadow-2xl active:scale-95">Next Sequence <ChevronRight size="18"/></button>
               <button v-else @click="window.print()" class="px-16 py-6 bg-[#2563eb] text-white flex gap-4 items-center rounded-full font-black uppercase text-[11px] tracking-[0.3em] hover:shadow-blue-500/50 transition-all shadow-2xl active:scale-95"><Download size="18"/> Export Spec Sheet</button>
            </footer>
         </div>
      </main>

      <!-- Right Pane: Sticky Live BOM (35% Desktop / Phase 2 Requirement) -->
      <aside class="hidden xl:flex w-[35%] bg-slate-50 border-l border-slate-200/50 flex-col h-screen sticky top-0 p-16 overflow-hidden">
         <h4 class="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 mb-12 flex items-center gap-4">
            <Package size="18" class="text-[#2563eb]"/> Technical Parts List
         </h4>

         <div class="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
            <div v-if="calculatedBOM.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300 italic text-center p-20 border-2 border-dashed border-slate-100 rounded-[3rem]">
               <Package size="60" class="opacity-10 mb-8"/>
               <p>Awaiting engineering parameters...</p>
            </div>
            
            <div v-for="(item, idx) in calculatedBOM" :key="idx" class="flex gap-6 items-center group">
               <div class="w-20 h-20 bg-white rounded-2xl border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center p-2 group-hover:border-[#2563eb] transition-colors">
                  <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain" @error="handleImgError" />
                  <Package v-else class="text-slate-100" />
               </div>
               <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                     <span class="block text-[11px] font-black uppercase tracking-widest text-[#0f172a] truncate">{{ item.model }}</span>
                     <span class="text-xs font-mono font-black italic text-slate-400 ml-4">x{{ item.quantity }}</span>
                  </div>
                  <p class="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 italic">{{ item.category }} // {{ item.description }}</p>
               </div>
            </div>
         </div>

         <!-- Sticky Summary Footer (Internal to Right Pane) -->
         <div class="mt-12 bg-[#0f172a] rounded-[3.5rem] p-12 text-white shadow-3xl relative overflow-hidden group">
            <div class="absolute inset-0 bg-[#2563eb] translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
            <div class="relative z-10">
               <div class="flex justify-between items-center mb-6 opacity-40 uppercase tracking-widest text-[9px] font-black">
                  <span>Aggregate Total (NET)</span>
                  <div class="flex items-center gap-2">
                     <span class="font-mono text-white/60">{{ totalLoadValue.toFixed(0) }}W</span>
                     <div :class="overloadStatus ? 'bg-red-500' : 'bg-[#2563eb]' " class="w-1.5 h-1.5 rounded-full group-hover:bg-white animate-pulse"></div>
                  </div>
               </div>
               <div class="text-8xl font-thin italic font-serif leading-none tracking-tighter">£{{ totalPriceValue.toLocaleString('en-GB') }}</div>
               <p class="text-[8px] font-bold uppercase opacity-20 mt-6 tracking-[0.2em] italic">Calculated Ex VAT / Logic verified</p>
            </div>
         </div>
      </aside>

    </div>

    <!-- Specification Popup (Architectural Depth) -->
    <Transition name="fade">
      <div v-if="showSpecs" class="fixed inset-0 z-[600] flex items-center justify-center p-6 lg:p-20 bg-slate-900/98 backdrop-blur-2xl" @click="showSpecs = null">
        <div class="bg-white max-w-6xl w-full flex flex-col md:flex-row rounded-[4rem] overflow-hidden h-[85vh] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-slate-700/10" @click.stop>
           <div class="w-full md:w-1/2 bg-slate-50 flex items-center justify-center p-20 relative border-r border-slate-100">
              <div class="absolute top-12 left-12 text-[10px] font-black uppercase text-slate-300 tracking-[0.5em] italic">Engineering Perspective</div>
              <img :src="getImageUrl(showSpecs.photo)" class="w-full h-full object-contain mix-blend-multiply transition-transform hover:scale-110 duration-700" />
           </div>
           <div class="flex-1 p-16 lg:p-24 flex flex-col text-left relative overflow-hidden text-slate-900 bg-white">
              <button @click="showSpecs = null" class="absolute top-12 right-12 text-slate-300 hover:text-[#0f172a] transition-all transform hover:rotate-90"><X size="40"/></button>
              <div class="mb-16">
                 <h2 class="text-6xl font-black uppercase tracking-tighter italic font-serif text-[#0f172a] leading-none mb-6">{{ (showSpecs.model || '').toString().toUpperCase() }}</h2>
                 <div class="w-32 h-2 bg-[#2563eb] rounded-full"></div>
              </div>
              <div class="flex-1 overflow-y-auto pr-10 space-y-8 custom-scrollbar">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div v-for="(v, k) in (showSpecs.specsData || {})" :key="k" class="border-b border-slate-50 pb-4 group/item">
                       <span class="block text-[10px] font-black uppercase tracking-widest text-[#2563eb] mb-2">{{ k }}</span>
                       <span class="text-lg font-bold text-slate-800 italic">{{ v }}</span>
                    </div>
                 </div>
                 <div class="pt-12 border-t border-slate-100 flex items-start gap-6 opacity-30 italic">
                    <Info size="16" class="shrink-0 mt-1"/>
                    <p class="text-[10px] uppercase font-black tracking-widest leading-loose">Automated parameter retrieval success. All data remains the intellectual property of ACOfusion Global (UK). Specification deviations are possible based on final site survey.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Transition>

    <!-- Professional Component Listing (A4 Blueprint Print) -->
    <div id="print-area" class="hidden print:block bg-white text-[#0f172a] p-20 font-sans">
       <header class="flex justify-between items-end border-b-[8px] border-[#0f172a] pb-12 mb-20">
          <div>
            <h1 class="text-9xl font-black uppercase italic font-serif tracking-tighter leading-none mb-4">ACOfusion</h1>
            <p class="text-sm font-black uppercase tracking-[0.5em] text-[#2563eb]">S10 SMART MAGNETIC 48V RAIL SYSTEM // UK SPEC</p>
          </div>
          <div class="text-right">
             <p class="text-[10px] font-black uppercase text-slate-300 mb-2">QUOTATION EXPORTED</p>
             <p class="text-4xl font-mono font-black italic border-b-2 border-slate-100 pb-2">{{ new Date().toLocaleDateString('en-GB') }}</p>
             <p class="text-[10px] font-black text-slate-400 mt-4 tracking-widest italic uppercase">ACO-REF-{{ Math.random().toString(36).substr(2, 6).toUpperCase() }}</p>
          </div>
       </header>

       <section class="grid grid-cols-2 gap-20 mb-20 bg-slate-50 p-16 rounded-[4rem] border-2 border-slate-100">
          <div class="space-y-8">
             <h4 class="text-xs font-black uppercase tracking-[0.3em] border-b-2 border-slate-200 pb-2 mb-4">Project Parameters</h4>
             <div class="grid grid-cols-1 gap-4 text-base font-black italic font-serif uppercase text-slate-500">
                <p>Mounting Style: <span class="text-slate-900 border-b border-slate-200 ml-4">{{ config.mounting }}</span></p>
                <p>System Topology: <span class="text-slate-900 border-b border-slate-200 ml-4">{{ config.layout }}</span></p>
                <p>Total Length: <span class="text-slate-900 border-b border-slate-200 ml-4">{{ (config.totalLength).toFixed(0) }}MM</span></p>
                <p>Electrical Load: <span class="text-[#2563eb] border-b border-slate-200 ml-4">{{ totalLoadValue.toFixed(1) }}W (CALCULATED)</span></p>
             </div>
          </div>
          <div class="text-right flex flex-col justify-center items-end border-l-4 border-[#2563eb] pl-20">
             <p class="text-[11px] font-black uppercase text-slate-400 tracking-[0.6em] mb-4">Quotation Total (Ex VAT)</p>
             <div class="text-[110px] font-black tracking-tighter leading-none italic font-serif">£{{ totalPriceValue.toLocaleString('en-GB') }}</div>
             <p class="text-[9px] font-black uppercase opacity-20 mt-10 tracking-[0.2em] italic max-w-xs leading-relaxed text-left border-l border-slate-200 pl-4">Net component pricing only. Does not include site installation or project consultancy fees.</p>
          </div>
       </section>

       <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-[11px] font-black uppercase tracking-[0.4em] border-b-4 border-[#0f172a] bg-slate-50">
              <th class="py-12 px-10 w-48 text-center text-slate-300 italic">Reference</th>
              <th class="py-12 px-10">Technical Material Specification</th>
              <th class="py-12 px-10 text-center">Qty</th>
              <th class="py-12 px-12 text-right bg-[#0f172a] text-white">Subtotal Net</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
             <tr v-for="(item, idx) in calculatedBOM" :key="idx">
                <td class="py-12 px-10 text-center">
                   <div class="w-24 h-24 bg-white border border-slate-100 rounded-3xl overflow-hidden mx-auto mb-4 flex items-center justify-center shadow-sm">
                      <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full p-2" />
                      <Package v-else class="text-slate-100" />
                   </div>
                   <span class="text-[9px] font-mono font-black italic opacity-20 uppercase tracking-tighter">{{ (item.model || '').toString().toUpperCase() }}</span>
                </td>
                <td class="py-12 px-10">
                   <div class="text-2xl font-black uppercase tracking-tighter leading-none mb-4 italic font-serif">{{ (item.model || '').toString().toUpperCase() }}</div>
                   <div class="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] italic">{{ item.category }} | {{ item.description }}</div>
                </td>
                <td class="py-12 px-10 text-center font-mono font-black text-3xl italic tracking-tighter">x{{ item.quantity }}</td>
                <td class="py-12 px-12 text-right font-mono font-black text-3xl italic tracking-tighter">£{{ ((item.price || 0) * (item.quantity)).toLocaleString('en-GB', { minimumFractionDigits: 1 }) }}</td>
             </tr>
          </tbody>
       </table>

       <footer class="mt-40 pt-20 border-t-8 border-slate-50 grid grid-cols-2 gap-32">
          <div class="space-y-10">
             <h5 class="text-[12px] font-black uppercase tracking-[0.5em] mb-8 border-b border-slate-800 w-fit pb-1">Compliance Protocol</h5>
             <p class="text-[11px] leading-relaxed text-slate-300 font-bold uppercase text-justify italic font-serif">
               Quantities generated by ACOfusion S10 Logic V2.4. Final circuit verification by a qualified L6 Engineer is mandatory before site integration. Total systemic demand must not exceed 200W per feed. All loop topologies must incorporate polarity alignment modules to maintain structural warranty.
             </p>
          </div>
          <div class="text-right flex flex-col justify-end gap-2">
             <div class="text-2xl font-black uppercase tracking-[0.5em] text-[#0f172a] italic font-serif mb-2">ACOfusion Global (UK)</div>
             <p class="text-[10px] font-mono font-black opacity-20 italic uppercase tracking-[0.6em] leading-none mb-1">Generated by Engine Build X-992</p>
             <p class="text-[10px] font-mono font-black opacity-20 italic uppercase tracking-[0.6em] leading-none">Standard Project Export Protocol</p>
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
  body { background: white !important; }
  aside, footer, .Transition, #app > div:not(#print-area), button, header, nav { display: none !important; }
  #print-area { display: block !important; position: static !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
  @page { size: A4 portrait; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
</style>
