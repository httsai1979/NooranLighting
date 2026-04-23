<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Info, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Download, 
  Layers, 
  Layout as LayoutIcon, 
  Zap, 
  AlertCircle,
  Package,
  X,
  Maximize2
} from 'lucide-vue-next'
import type { Luminaire, Accessory, MountingType, LayoutType, ConfigState, BOMItem } from './types'

// --- Constants & Config ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzppxxh05KJPZzDHlTK6_so2ILiMCsfkeF3btexeVyZ7zoT-04ksNg4lwSGNkZxUSVkdQ/exec' 
const TRACK_PIECE_METRES = 2.0

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

// --- Data Initialisation ---
onMounted(async () => {
  try {
    const res = await fetch(GAS_URL)
    const response = await res.json()
    if (response.status === 'success') {
      data.value = {
        lamps: response.data['S10_Magnetic_lamp'] || [],
        accessories: response.data['S10_Track&accessory'] || []
      }
    }
  } catch (err) {
    console.error('System Data Initialisation Error:', err)
  } finally {
    loading.value = false
  }
})

// --- Core Configuration Logic (Strictly Following TRD Expert Rule Engine) ---
const findRealItem = (predicate: (a: Accessory) => boolean, preferredPrefix?: string) => {
  const items = data.value.accessories.filter(predicate)
  if (!items.length) return null
  if (preferredPrefix) {
    const match = items.find(a => (a.model || '').toString().startsWith(preferredPrefix))
    if (match) return match
  }
  return items[0]
}

const calculateBOM = computed<BOMItem[]>(() => {
  const bom: BOMItem[] = []
  if (!data.value.accessories.length) return []

  const { mounting, layout, totalLength, selectedLuminaires } = config.value

  // 1. Main Track Selection (Strict Prefix Logic)
  const seriesPrefix = mounting === 'Trimless' ? 'G-TL-D' : (mounting === 'Recessed' ? 'G-TL-B' : 'G-TL-A')
  const trackInfo = findRealItem(a => (a.model || '').toString().startsWith(seriesPrefix), seriesPrefix)
  const profileQty = Math.ceil(totalLength / TRACK_PIECE_METRES)
  
  bom.push({
    model: `${trackInfo?.model || seriesPrefix}-2M`,
    category: 'Profile',
    description: `${mounting} Magnetic Track Piece (2.0 Metres)`,
    quantity: profileQty,
    price: trackInfo?.price || 0,
    photo: trackInfo?.photo || null
  })

  // 2. Topology Accessories
  let corners = 0
  if (layout === 'L-Shape') corners = 1
  else if (layout === 'T-Shape') corners = 2
  else if (layout === 'Rectangle') corners = 4

  if (corners > 0) {
    const cornerData = findRealItem(a => {
      const cat = (a.category || '').toString().toLowerCase()
      const mod = (a.model || '').toString().toLowerCase()
      return cat.includes('corner') || mod.includes('corner')
    }, seriesPrefix)
    
    bom.push({
      model: cornerData?.model || `${seriesPrefix}-Corner`,
      category: 'Hardware',
      description: '90° Corner Connector & Conduction Module',
      quantity: corners,
      price: cornerData?.price || 0,
      photo: cornerData?.photo || null
    })
  }

  // Polarity Changer logic (Mandatory for loops as per TRD 2.2)
  if (layout === 'T-Shape' || layout === 'Rectangle') {
    const polarityData = findRealItem(a => {
      const mod = (a.model || '').toString().toLowerCase()
      return mod.includes('polarity') || mod.includes('phase changer')
    })
    bom.push({
      model: polarityData?.model || 'Polarity-Changer',
      category: 'Electrical',
      description: 'Phase Separator / Polarity Shield (Loop Safety)',
      quantity: 1,
      price: polarityData?.price || 0,
      photo: polarityData?.photo || null
    })
  }

  // 3. Automated BOM Matrix
  const capInfo = findRealItem(a => {
    const mod = (a.model || '').toString().toLowerCase()
    return mod.includes('-sm') || mod.includes('end cap')
  }, seriesPrefix)

  bom.push({
    model: capInfo?.model || 'End Cap (-SM)',
    category: 'Hardware',
    description: 'Track System Finishing Plate',
    quantity: 2,
    price: capInfo?.price || 0,
    photo: capInfo?.photo || null
  })

  const liveEndData = findRealItem(a => {
    const mod = (a.model || '').toString().toLowerCase()
    return mod.includes('-zjdy') || mod.includes('live end')
  }, seriesPrefix)

  bom.push({
    model: liveEndData?.model || 'Live End (-ZJDY)',
    category: 'Electrical',
    description: 'System Power Input Feed',
    quantity: 1,
    price: liveEndData?.price || 0,
    photo: liveEndData?.photo || null
  })

  // Mechanical Connectors = Profile Qty - 1 - Corners
  const joinerQty = Math.max(0, profileQty - 1 - corners)
  if (joinerQty > 0) {
    const joinerInfo = findRealItem(a => {
      const cat = (a.category || '').toString().toLowerCase()
      const mod = (a.model || '').toString().toLowerCase()
      return cat.includes('connector') && !mod.includes('corner')
    }, seriesPrefix)
    
    bom.push({
      model: joinerInfo?.model || 'Straight Joiner',
      category: 'Hardware',
      description: 'Longitudinal Splicing Connector',
      quantity: joinerQty,
      price: joinerInfo?.price || 0,
      photo: joinerInfo?.photo || null
    })
  }

  // 4. Mounting Specifics
  if (mounting === 'Surface') {
    const clipInfo = findRealItem(a => {
      const mod = (a.model || '').toString().toLowerCase()
      return mod.includes('-mzkk') || mod.includes('clip')
    }, seriesPrefix)
    bom.push({
      model: clipInfo?.model || 'Fixing Clip (-MZKK)',
      category: 'Hardware',
      description: 'Surface Mounting Support Clip',
      quantity: Math.ceil(totalLength * 1.5), 
      price: clipInfo?.price || 0,
      photo: clipInfo?.photo
    })
  } else if (mounting === 'Pendant') {
    const suspInfo = findRealItem(a => (a.category || '').toString().toLowerCase().includes('suspension'), seriesPrefix)
    bom.push({
      model: suspInfo?.model || 'Suspension Kit',
      category: 'Hardware',
      description: 'Steel Wire Suspension Solution',
      quantity: profileQty + corners + 1,
      price: suspInfo?.price || 0,
      photo: suspInfo?.photo
    })
  }

  // 5. Luminaires
  selectedLuminaires.forEach(sel => {
    bom.push({
      model: (sel.item.model || 'Unknown').toString(),
      category: 'Luminaire',
      description: `${sel.item.power || 0}W | ${sel.item.specsData?.CCT || '3000K'}`,
      quantity: sel.quantity,
      price: sel.item.price || 0,
      photo: sel.item.photo
    })
  })

  // 6. Electrical Engineering (N+1 Safety rule)
  const totalLoadVal = selectedLuminaires.reduce((a, c) => a + ((c.item.power || 0) * (c.quantity || 0)), 0)
  const maxSingleVal = selectedLuminaires.length > 0 ? Math.max(...selectedLuminaires.map(s => s.item.power || 0)) : 0
  const requiredCap = totalLoadVal + maxSingleVal

  if (totalLoadVal > 0) {
    const drivers = data.value.accessories
      .filter(a => {
        const cat = (a.category || '').toString().toLowerCase()
        return cat.includes('driver') || cat.includes('power supply')
      })
      .sort((a,b) => {
        const capB = parseInt((b.model || '').toString().match(/\d+/)?.[0] || '0')
        const capA = parseInt((a.model || '').toString().match(/\d+/)?.[0] || '0')
        return capB - capA
      })
    
    if (drivers.length) {
      const bestDriver = drivers[0]
      const unitCap = parseInt((bestDriver.model || '').toString().match(/\d+/)?.[0] || '200')
      const driverQty = Math.ceil(requiredCap / (unitCap * 0.9))
      
      bom.push({
        model: (bestDriver.model || 'DRIVER-SMART').toString(),
        category: 'Power Supply',
        description: `Industrial 48V DC Supply (${unitCap}W Unit)`,
        quantity: driverQty,
        price: bestDriver.price || 0,
        photo: bestDriver.photo
      })
    }
  }

  return bom
})

// --- Aggregates ---
const totalLoad = computed(() => config.value.selectedLuminaires.reduce((a, c) => a + ((c.item.power || 0) * (c.quantity || 0)), 0))
const maxSingleWatt = computed(() => config.value.selectedLuminaires.length > 0 ? Math.max(...config.value.selectedLuminaires.map(s => s.item.power || 0)) : 0)
const maxPossibleDriverCap = computed(() => {
  const drivers = data.value.accessories.filter(a => {
    const cat = (a.category || '').toString().toLowerCase()
    return cat.includes('driver') || cat.includes('power supply')
  })
  if (drivers.length === 0) return 200
  const caps = drivers.map(d => {
    const m = (d.model || '').toString().match(/\d+/)
    return m ? parseInt(m[0]) : 0
  })
  return Math.max(...caps, 100)
})
const isOverloaded = computed(() => totalLoad.value > maxPossibleDriverCap.value)
const totalPrice = computed(() => calculateBOM.value.reduce((a, c) => a + ((c.price || 0) * (c.quantity || 0)), 0))

// --- Interaction Methods ---
const nextStep = () => {
  if (step.value === 3 && config.value.selectedLuminaires.length === 0) return
  if (step.value === 4 && isOverloaded.value) return 
  step.value = Math.min(step.value + 1, 5)
}
const prevStep = () => step.value = Math.max(step.value - 1, 0)

const updateLuminaire = (lamp: Luminaire, delta: number) => {
  const existing = config.value.selectedLuminaires.find(s => s.item.model === lamp.model)
  if (existing) {
    existing.quantity = Math.max(0, (existing.quantity || 0) + delta)
    if (existing.quantity === 0) {
      config.value.selectedLuminaires = config.value.selectedLuminaires.filter(s => s.item.model !== lamp.model)
    }
  } else if (delta > 0) {
    config.value.selectedLuminaires.push({ item: lamp, quantity: 1 })
  }
}

const getLampCount = (model: string) => config.value.selectedLuminaires.find(s => s.item.model === model)?.quantity || 0

const handleImageError = (e: any) => {
  e.target.style.display = 'none' 
  const container = e.target.parentElement
  if (container) {
    container.classList.add('flex', 'items-center', 'justify-center', 'bg-zinc-900')
    const icon = document.createElement('div')
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-700 animate-pulse"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>'
    container.appendChild(icon.firstChild!)
  }
}

const safeUpper = (val: any) => (val || '').toString().toUpperCase()
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-zinc-100 font-sans antialiased text-sm overflow-x-hidden">
    
    <!-- Animated Loading -->
    <Transition name="fade">
      <div v-if="loading" class="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <div class="w-12 h-12 border-2 border-zinc-900 border-t-zinc-100 rounded-full animate-spin"></div>
        <p class="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">ACOfusion Protocol Engine</p>
      </div>
    </Transition>

    <div class="flex flex-col lg:flex-row min-h-screen relative print:hidden">
      
      <!-- Left Configuration Wizard -->
      <main class="flex-1 p-6 lg:p-20 relative z-10">
        <header class="mb-20 flex justify-between items-center">
          <div>
            <h1 class="text-xs font-black uppercase tracking-[0.6em] text-zinc-700 flex items-center gap-2">
              <span class="w-2 h-2 bg-white rounded-full"></span>
              ACOfusion S10
            </h1>
            <p class="text-[10px] uppercase tracking-[0.2em] text-zinc-800 mt-3 font-bold">Intelligent Structural Configurator</p>
          </div>
          <div class="px-4 py-2 bg-zinc-900/40 border border-zinc-800/50 rounded-xl text-[10px] font-mono text-zinc-500">
            PHASE {{ step + 1 }} / 6
          </div>
        </header>

        <Transition name="slide" mode="out-in">
          <div :key="step" class="w-full max-w-4xl mx-auto">
            
            <div v-if="step === 0" class="space-y-12">
              <div class="space-y-3">
                <h2 class="text-6xl font-light tracking-tight text-white leading-tight italic font-serif">Mounting Method</h2>
                <p class="text-zinc-600 text-lg">Define the architectural integration for the 48V rail system.</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button v-for="m in (['Surface', 'Trimless', 'Pendant', 'Recessed'] as MountingType[])" :key="m" @click="config.mounting = m"
                  :class="['p-10 rounded-[2.5rem] border transition-all text-left flex flex-col justify-between h-64 relative overflow-hidden group', config.mounting === m ? 'border-zinc-100 bg-white/5' : 'border-zinc-900 bg-zinc-950/20 hover:border-zinc-700']">
                  <Layers class="w-10 h-10" :class="config.mounting === m ? 'text-white' : 'text-zinc-800'" />
                  <div>
                    <span class="block text-3xl font-medium tracking-tight mb-2 uppercase">{{ m }}</span>
                    <p class="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold">Structural Protocol</p>
                  </div>
                  <div v-if="config.mounting === m" class="absolute top-10 right-10"><CheckCircle2 class="text-white w-8 h-8" /></div>
                </button>
              </div>
            </div>

            <div v-if="step === 1" class="space-y-12">
               <h2 class="text-6xl font-light tracking-tight text-white leading-tight italic font-serif">Topology</h2>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as LayoutType[])" :key="l" @click="config.layout = l"
                    :class="['p-10 rounded-[2.5rem] border transition-all text-left flex flex-col justify-between h-64 relative', config.layout === l ? 'border-zinc-100 bg-white/5' : 'border-zinc-900 bg-zinc-950/20']">
                    <LayoutIcon class="w-10 h-10" />
                    <span class="text-3xl font-medium tracking-tight uppercase">{{ l }}</span>
                  </button>
               </div>
            </div>

            <div v-if="step === 2" class="space-y-12">
               <h2 class="text-6xl font-light tracking-tight text-white leading-tight italic font-serif">System Metres</h2>
               <div class="bg-zinc-950/20 border border-zinc-900 p-20 rounded-[4rem] flex flex-col items-center">
                <div class="text-[140px] font-thin tracking-tighter text-white leading-none tabular-nums flex items-end">
                   {{ (config.totalLength || 0).toFixed(1) }}<span class="text-2xl mb-8 ml-6 font-black uppercase text-zinc-800">m</span>
                </div>
                <input type="range" min="1" max="50" step="0.5" v-model.number="config.totalLength" class="w-full max-w-xl mt-12 accent-white bg-zinc-900 h-1.5 rounded-full" />
               </div>
            </div>

            <div v-if="step === 3" class="space-y-12">
               <h2 class="text-6xl font-light tracking-tight text-white leading-tight italic font-serif">Luminaires</h2>
               <div class="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-6 custom-scrollbar mt-12">
                  <div v-for="lamp in data.lamps" :key="lamp.model" class="bg-zinc-950/30 border border-zinc-900 p-8 rounded-[2.5rem] flex items-center gap-10">
                    <div class="w-24 h-24 bg-black rounded-3xl border border-zinc-900 relative overflow-hidden group">
                      <img :src="lamp.photo" @error="handleImageError" class="w-full h-full object-contain" />
                      <button @click="showSpecs = lamp" class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Maximize2 size="24" /></button>
                    </div>
                    <div class="flex-1">
                      <h3 class="text-xl font-bold uppercase tracking-widest text-white leading-none">{{ lamp.model }}</h3>
                      <p class="text-[10px] font-bold text-zinc-600 mt-2 uppercase tracking-widest">{{ lamp.power }}W / High Contrast</p>
                    </div>
                    <div class="flex items-center gap-6 bg-zinc-900/40 p-4 rounded-3xl border border-zinc-800">
                      <button @click="updateLuminaire(lamp, -1)" class="p-2"><Minus size="18" /></button>
                      <span class="font-mono font-bold text-xl">{{ getLampCount(lamp.model) }}</span>
                      <button @click="updateLuminaire(lamp, 1)" class="p-2"><Plus size="18" /></button>
                    </div>
                  </div>
               </div>
            </div>

            <div v-if="step === 4" class="space-y-12">
               <h2 class="text-6xl font-light tracking-tight text-white leading-tight italic font-serif text-center">Engineering Check</h2>
               <div :class="['p-16 rounded-[4rem] border-2 transition-all mt-12', isOverloaded ? 'border-red-900 bg-red-950/10' : 'border-zinc-900 bg-zinc-900/20']">
                  <div class="text-9xl font-thin tracking-tighter text-white tabular-nums mb-8">{{ totalLoad.toFixed(1) }}<span class="text-2xl ml-4 text-zinc-800 font-bold">W</span></div>
                  <div class="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div :class="['h-full transition-all duration-1000', isOverloaded ? 'bg-red-500' : 'bg-white']" :style="'width:' + (totalLoad/maxPossibleDriverCap*100) + '%'"></div>
                  </div>
               </div>
            </div>

            <div v-if="step === 5" class="space-y-12 text-center">
               <h2 class="text-6xl font-light tracking-tight text-white leading-tight italic font-serif">Proposal Synchronised</h2>
               <div class="py-24 flex flex-col items-center">
                  <div class="w-32 h-32 bg-white text-black rounded-full flex items-center justify-center mb-12 shadow-2xl"><CheckCircle2 size="48" /></div>
                  <button @click="window.print()" class="px-20 py-8 bg-zinc-100 text-black font-black uppercase tracking-widest text-sm rounded-full hover:scale-110 active:scale-95 transition-all">Export PDF Spec Sheet</button>
               </div>
            </div>
          </div>
        </Transition>

        <div class="mt-24 pt-16 border-t border-zinc-900 flex justify-between items-center max-w-4xl mx-auto">
          <button @click="prevStep" v-if="step > 0" class="text-zinc-600 hover:text-white flex items-center gap-3">
             <ArrowLeft size="18" /> <span class="text-[10px] font-black uppercase tracking-widest">Previous PHASE</span>
          </button>
          <div v-else></div>
          <button @click="nextStep" :disabled="(step === 3 && config.selectedLuminaires.length === 0) || (step === 4 && isOverloaded)" 
            class="px-16 py-6 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-5">
            {{ step === 5 ? 'RESTART' : 'Next PHASE' }} <ArrowRight size="18" />
          </button>
        </div>
      </main>

      <!-- Sidebar Dash -->
      <aside class="hidden lg:flex w-[500px] bg-[#080808] border-l border-zinc-900/50 p-16 flex-col h-screen sticky top-0">
        <h3 class="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-700 flex items-center gap-3 mb-10">
          <Package size="16" /> Live Bill of Materials
        </h3>
        <div class="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
           <div v-for="(item, idx) in calculateBOM" :key="idx" class="bg-zinc-900/20 border border-zinc-800/20 p-5 rounded-[2.5rem] flex items-center gap-6 animate-fade-in group">
              <div class="w-16 h-16 bg-black rounded-2xl border border-zinc-800 overflow-hidden shrink-0">
                 <img v-if="item.photo" :src="item.photo" @error="handleImageError" class="w-full h-full object-contain p-1" />
              </div>
              <div class="flex-1 min-w-0">
                 <div class="flex justify-between items-start">
                    <h4 class="text-[11px] font-black text-white truncate uppercase tracking-widest leading-none">{{ safeUpper(item.model) }}</h4>
                    <span class="text-xs font-mono font-bold text-zinc-500 ml-2">x{{ item.quantity }}</span>
                 </div>
                 <p class="text-[9px] text-zinc-700 truncate mt-2 font-bold leading-none uppercase italic">{{ item.description }}</p>
              </div>
           </div>
        </div>
        <div class="mt-16 bg-white text-black p-12 rounded-[3.5rem] shadow-3xl">
           <div class="flex justify-between items-center mb-6">
              <span class="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">System Subtotal</span>
              <div class="flex items-center gap-2">
                 <span class="text-[11px] font-black font-mono">{{ totalLoad.toFixed(0) }}W</span>
                 <div :class="['w-2 h-2 rounded-full', isOverloaded ? 'bg-red-500' : 'bg-green-600 animate-pulse']"></div>
              </div>
           </div>
           <div class="text-7xl font-thin tracking-tighter tabular-nums leading-none font-serif italic">
              £{{ totalPrice.toLocaleString('en-GB') }}
           </div>
        </div>
      </aside>
    </div>

    <!-- Details Modal -->
    <Transition name="fade">
      <div v-if="showSpecs" class="fixed inset-0 z-[200] flex items-center justify-center p-10 bg-black/98 backdrop-blur-3xl" @click="showSpecs = null">
        <div class="bg-zinc-950 border border-zinc-800 rounded-[4rem] max-w-4xl w-full p-20 relative overflow-hidden" @click.stop>
          <button @click="showSpecs = null" class="absolute top-16 right-16 text-zinc-700 hover:text-white transition-all transform hover:rotate-90">
             <X size="32" />
          </button>
          <div class="flex flex-col md:flex-row gap-20">
             <div class="w-full md:w-1/2 aspect-square bg-black border border-zinc-900 rounded-[3rem] overflow-hidden">
                <img :src="showSpecs.photo" @error="handleImageError" class="w-full h-full object-contain p-10" />
             </div>
             <div class="flex-1 text-left">
                <h2 class="text-5xl font-light italic font-serif text-white uppercase tracking-tight mb-8">{{ safeUpper(showSpecs.model) }}</h2>
                <div class="space-y-4 max-h-[40vh] overflow-y-auto pr-6 custom-scrollbar">
                   <div v-for="(val, key) in (showSpecs.specsData || {})" :key="key" class="border-b border-zinc-900 pb-4">
                      <span class="block text-[11px] font-black uppercase tracking-widest text-zinc-700 mb-1">{{ safeUpper(key) }}</span>
                      <span class="text-sm font-mono text-zinc-300 italic">{{ val }}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Professional B2B PDF Export (ACOfusion Blue Theme) -->
    <div id="print-area" class="hidden print:block bg-white text-[#002d5a] p-16 font-sans">
       <header class="flex justify-between items-end border-b-8 border-[#002d5a] pb-12 mb-16">
          <div>
            <h1 class="text-8xl font-black uppercase tracking-tighter leading-none italic font-serif">ACOfusion</h1>
            <p class="text-sm font-black tracking-[0.5em] mt-3">S10 SMART MAGNETIC 48V RAIL SYSTEM</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] font-black uppercase text-zinc-300 mb-1">PROPOSAL DATE</p>
            <p class="text-3xl font-mono font-black italic">{{ new Date().toLocaleDateString('en-GB') }}</p>
            <p class="text-xs uppercase font-black mt-2 text-[#002d5a]/40 tracking-widest">REF: {{ Math.random().toString(36).substr(2, 8).toUpperCase() }}</p>
          </div>
       </header>

       <section class="grid grid-cols-2 gap-20 mb-20 bg-zinc-50 p-12 rounded-[3.5rem]">
          <div>
            <h4 class="text-xs font-black uppercase tracking-widest border-b-2 border-zinc-200 pb-3 mb-8">Technical Parameters</h4>
            <div class="grid grid-cols-2 gap-y-4 text-sm font-bold">
              <span class="opacity-40">MOUNTING:</span> <span>{{ config.mounting }}</span>
              <span class="opacity-40">TOPOLOGY:</span> <span>{{ config.layout }}</span>
              <span class="opacity-40">SYSTEM LENGTH:</span> <span>{{ config.totalLength }}m</span>
              <span class="opacity-40">TOTAL LOAD:</span> <span>{{ totalLoad.toFixed(1) }}W</span>
            </div>
          </div>
          <div class="flex flex-col justify-center items-end border-l-2 border-zinc-200 pl-20">
            <p class="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 mb-4">Final System Estimate (GBP)</p>
            <div class="text-9xl font-black tracking-tighter italic font-serif leading-none">£{{ totalPrice.toLocaleString('en-GB') }}</div>
            <p class="text-[9px] font-black opacity-30 mt-6 uppercase tracking-widest italic">All pricing excluding VAT & Logistics</p>
          </div>
       </section>

       <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-[11px] font-black uppercase tracking-widest border-b-4 border-[#002d5a] bg-zinc-50">
              <th class="py-8 px-6 w-32 text-center">Ref</th>
              <th class="py-8 px-6">Specification Detail</th>
              <th class="py-8 px-6 text-center">Qty</th>
              <th class="py-8 px-6 text-right">Unit Price</th>
              <th class="py-8 px-8 text-right bg-[#002d5a] text-white">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 text-sm">
            <tr v-for="(item, idx) in calculateBOM" :key="idx">
              <td class="py-10 px-6 text-center">
                 <div class="w-24 h-24 bg-white border border-zinc-100 rounded-3xl flex items-center justify-center overflow-hidden mx-auto mb-3 shadow-sm">
                    <img v-if="item.photo" :src="item.photo" class="w-full h-full object-contain p-2" />
                    <Package v-else class="text-zinc-100" />
                 </div>
                 <span class="text-[9px] font-mono font-black opacity-30 block truncate italic">{{ safeUpper(item.model) }}</span>
              </td>
              <td class="py-10 px-6">
                <div class="text-xl font-black uppercase leading-none mb-3 italic">{{ safeUpper(item.model) }}</div>
                <div class="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">{{ item.category }} // {{ item.description }}</div>
              </td>
              <td class="py-10 px-6 text-center font-mono font-black text-2xl italic">x{{ item.quantity }}</td>
              <td class="py-10 px-6 text-right font-mono opacity-40 italic">£{{ (item.price || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 }) }}</td>
              <td class="py-10 px-8 text-right font-mono font-black text-2xl italic">£{{ ((item.price || 0) * (item.quantity)).toLocaleString('en-GB', { minimumFractionDigits: 2 }) }}</td>
            </tr>
          </tbody>
       </table>

       <footer class="mt-24 pt-16 border-t-2 border-zinc-100 grid grid-cols-2 gap-20">
          <div class="space-y-4">
             <h5 class="text-[10px] font-black uppercase tracking-[0.4em] mb-4">Compliance Protocol</h5>
             <p class="text-[9px] leading-relaxed text-zinc-300 font-bold uppercase text-justify italic">
               Suggestive quantities generated via ACOfusion Logic Engine V2. Final electrical verification by a certified L6 engineer is mandatory. All 48V rail phases must be aligned using Polarity Changers on loop topologies. Failure to comply void architectural warranty. 
             </p>
          </div>
          <div class="text-right flex flex-col justify-end">
             <div class="text-xs font-black uppercase tracking-[0.5em] text-[#002d5a] mb-2 italic">ACOfusion Global (UK)</div>
             <p class="text-[9px] font-mono font-black opacity-30 italic uppercase">Configurator Build 0933 // Automated Export System</p>
          </div>
       </footer>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fragment+Mono&family=Inter:wght@100..900&family=Playfair+Display:ital,wght@1,400..900&display=swap');

body { margin: 0; background: black; -webkit-font-smoothing: antialiased; letter-spacing: -0.02em; color-scheme: dark; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from { opacity: 0; transform: translateY(40px) scale(0.98); }
.slide-leave-to { opacity: 0; transform: translateY(-40px) scale(0.98); }

@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 28px;
  width: 28px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}

@media print {
  body { background: white !important; color-scheme: light; }
  .grid, header, main, aside, .Transition, #app > div:not(#print-area), button { display: none !important; }
  #print-area { display: block !important; position: static !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
  @page { size: A4 portrait; margin: 10mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
</style>
