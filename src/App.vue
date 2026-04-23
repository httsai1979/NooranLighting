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
  Maximize2,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-vue-next'
import type { Luminaire, Accessory, MountingType, LayoutType, ConfigState, BOMItem } from './types'

// --- Constants & Config ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzppxxh05KJPZzDHlTK6_so2ILiMCsfkeF3btexeVyZ7zoT-04ksNg4lwSGNkZxUSVkdQ/exec' 
const TRACK_PIECE_METRES = 2.0

// --- Reactive State ---
const loading = ref(true)
const step = ref(-1) // -1 is the new Welcome/Scene page
const showSpecs = ref<Luminaire | Accessory | null>(null)
const data = ref<{ lamps: Luminaire[], accessories: Accessory[] }>({ lamps: [], accessories: [] })

const config = ref<ConfigState>({
  mounting: 'Surface',
  layout: 'Straight',
  totalLength: 2,
  selectedLuminaires: []
})

// --- Data Initialisation ---
const fetchData = async () => {
  loading.value = true
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
}

onMounted(fetchData)

// --- Helper: Robust Image Link Formatting ---
const getImageUrl = (url: string | null) => {
  if (!url) return ''
  // If it's already a standard lh3 google link, we keep it but ensure it's high res
  if (url.includes('googleusercontent.com')) return url
  // If it's a direct drive link format, convert it to the reliable uc?id format
  const driveIdMatch = url.match(/id=([-\w]+)/) || url.match(/\/d\/([-\w]+)/)
  if (driveIdMatch) return `https://docs.google.com/uc?export=view&id=${driveIdMatch[1]}`
  return url
}

// --- Core Configuration Logic ---
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

  // 1. Tracks (Prefix matched to PDF spec)
  const seriesPrefix = mounting === 'Trimless' ? 'G-TL-D' : (mounting === 'Recessed' ? 'G-TL-B' : 'G-TL-A')
  const trackInfo = findRealItem(a => (a.model || '').toString().startsWith(seriesPrefix), seriesPrefix)
  const profileQty = Math.ceil(totalLength / TRACK_PIECE_METRES)
  
  bom.push({
    model: `${trackInfo?.model || seriesPrefix}-2M`,
    category: 'Profile',
    description: `10mm Ultra-thin ${mounting} Track (2.0m)`,
    quantity: profileQty,
    price: trackInfo?.price || 0,
    photo: getImageUrl(trackInfo?.photo || null)
  })

  // 2. Topology
  let corners = 0
  if (layout === 'L-Shape') corners = 1
  else if (layout === 'T-Shape') corners = 2
  else if (layout === 'Rectangle') corners = 4

  if (corners > 0) {
    const cornerData = findRealItem(a => (a.model || '').toString().toLowerCase().includes('corner'), seriesPrefix)
    bom.push({
      model: cornerData?.model || `${seriesPrefix}-CORNER`,
      category: 'Hardware',
      description: '90° Corner Connector Module',
      quantity: corners,
      price: cornerData?.price || 0,
      photo: getImageUrl(cornerData?.photo || null)
    })
  }

  // Polarity for Loops (PDF Instruction)
  if (layout === 'T-Shape' || layout === 'Rectangle') {
    const polarityData = findRealItem(a => (a.model || '').toString().toLowerCase().includes('polarity'))
    bom.push({
      model: polarityData?.model || 'POLARITY-CHANGER',
      category: 'Electrical',
      description: 'DC48V Phase Alignment Module',
      quantity: 1,
      price: polarityData?.price || 0,
      photo: getImageUrl(polarityData?.photo || null)
    })
  }

  // 3. Components
  const capInfo = findRealItem(a => (a.model || '').toString().toLowerCase().includes('end cap'), seriesPrefix)
  bom.push({
    model: capInfo?.model || 'END-CAP',
    category: 'Hardware',
    description: 'Track Finishing Terminal',
    quantity: 2,
    price: capInfo?.price || 0,
    photo: getImageUrl(capInfo?.photo || null)
  })

  const liveEndData = findRealItem(a => (a.model || '').toString().toLowerCase().includes('live end'), seriesPrefix)
  bom.push({
    model: liveEndData?.model || 'LIVE-FEED',
    category: 'Electrical',
    description: 'System Main Power Feed',
    quantity: 1,
    price: liveEndData?.price || 0,
    photo: getImageUrl(liveEndData?.photo || null)
  })

  const joinerQty = Math.max(0, profileQty - 1 - corners)
  if (joinerQty > 0) {
    const joinerInfo = findRealItem(a => (a.model || '').toString().toLowerCase().includes('connector') && !(a.model || '').toString().toLowerCase().includes('corner'), seriesPrefix)
    bom.push({
      model: joinerInfo?.model || 'LINEAR-JOINER',
      category: 'Hardware',
      description: 'Internal Splicing Connector',
      quantity: joinerQty,
      price: joinerInfo?.price || 0,
      photo: getImageUrl(joinerInfo?.photo || null)
    })
  }

  selectedLuminaires.forEach(sel => {
    bom.push({
      model: (sel.item.model || 'MODULE').toString(),
      category: 'Luminaire',
      description: `${sel.item.power}W | 10mm Slim Module`,
      quantity: sel.quantity,
      price: sel.item.price || 0,
      photo: getImageUrl(sel.item.photo)
    })
  })

  // Power Calculation (Total + Max Single Watt)
  const totalLoadVal = selectedLuminaires.reduce((a, c) => a + ((c.item.power || 0) * (c.quantity || 0)), 0)
  const maxSingleVal = selectedLuminaires.length > 0 ? Math.max(...selectedLuminaires.map(s => s.item.power || 0)) : 0
  const requiredCap = totalLoadVal + maxSingleVal

  if (totalLoadVal > 0) {
    const drivers = data.value.accessories.filter(a => (a.category || '').toString().toLowerCase().includes('driver'))
      .sort((a,b) => parseInt((b.model || '').toString().match(/\d+/)?.[0] || '0') - parseInt((a.model || '').toString().match(/\d+/)?.[0] || '0'))
    
    if (drivers.length) {
      const bestDriver = drivers[0]
      const unitCap = parseInt((bestDriver.model || '').toString().match(/\d+/)?.[0] || '200')
      const driverQty = Math.ceil(requiredCap / (unitCap * 0.9))
      bom.push({
        model: (bestDriver.model || 'DC48V-PWR').toString(),
        category: 'Power Supply',
        description: `Industrial 48V DC (${unitCap}W)`,
        quantity: driverQty,
        price: bestDriver.price || 0,
        photo: getImageUrl(bestDriver.photo)
      })
    }
  }

  return bom
})

// --- Logic Checks ---
const totalLoad = computed(() => config.value.selectedLuminaires.reduce((a, c) => a + ((c.item.power || 0) * (c.quantity || 0)), 0))
const maxSafeLoad = 200 // S10 System standard
const isOverloaded = computed(() => totalLoad.value > maxSafeLoad)
const totalPrice = computed(() => calculateBOM.value.reduce((a, c) => a + ((c.price || 0) * (c.quantity || 0)), 0))

// --- UI Methods ---
const nextStep = () => {
  if (step.value === 3 && config.value.selectedLuminaires.length === 0) return
  if (step.value === 4 && isOverloaded.value) return 
  step.value++
}
const prevStep = () => step.value--
const selectScene = (type: MountingType) => {
  config.value.mounting = type
  step.value = 1
}

const updateLuminaire = (lamp: Luminaire, delta: number) => {
  const existing = config.value.selectedLuminaires.find(s => s.item.model === lamp.model)
  if (existing) {
    existing.quantity = Math.max(0, (existing.quantity || 0) + delta)
    if (existing.quantity === 0) config.value.selectedLuminaires = config.value.selectedLuminaires.filter(s => s.item.model !== lamp.model)
  } else if (delta > 0) {
    config.value.selectedLuminaires.push({ item: lamp, quantity: 1 })
  }
}
const getCount = (m: string) => config.value.selectedLuminaires.find(s => s.item.model === m)?.quantity || 0

const handleImgError = (e: any) => {
  e.target.style.opacity = '0.1' 
}
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-zinc-100 font-sans antialiased text-sm overflow-hidden selection:bg-white selection:text-black">
    
    <!-- Heavy Loading -->
    <Transition name="fade">
      <div v-if="loading" class="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center">
        <div class="w-16 h-16 border-t-2 border-white rounded-full animate-spin"></div>
        <p class="mt-8 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Synchronising S10 Technical Data</p>
      </div>
    </Transition>

    <!-- Welcome / Scene Phase (Issue 1 & 2) -->
    <Transition name="fade">
      <div v-if="step === -1" class="fixed inset-0 z-[200] bg-[#050505] overflow-y-auto">
        <div class="max-w-[1400px] mx-auto px-8 py-20 lg:py-32">
          <header class="mb-20 text-center lg:text-left flex flex-col lg:flex-row justify-between items-end gap-12">
            <div class="space-y-6 max-w-2xl">
               <h1 class="text-xs font-black uppercase tracking-[1em] text-zinc-500">Nooran Lighting</h1>
               <div class="text-7xl lg:text-9xl font-thin tracking-tighter text-white font-serif italic leading-none">ACOfusion S10</div>
               <p class="text-xl text-zinc-500 font-medium leading-relaxed uppercase">10mm Ultra-narrow DC48V Magnetic Track System</p>
            </div>
            <div class="bg-zinc-900/50 p-10 rounded-[3rem] border border-zinc-800/50 max-w-sm">
               <h4 class="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><HelpCircle size="14" /> Logic Manual</h4>
               <p class="text-xs text-zinc-500 leading-secondary italic">Define your mounting method first. The algorithm will then automatically map the 10mm topology, calculate structural joiners, and balance your electrical load real-time.</p>
            </div>
          </header>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <!-- Scene Selection Cards -->
            <button @click="selectScene('Surface')" class="group relative h-[500px] rounded-[3rem] overflow-hidden border border-zinc-900 hover:border-zinc-500 transition-all">
               <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
               <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1000" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
               <div class="absolute bottom-12 left-12 z-20 text-left">
                  <span class="px-4 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">Professional</span>
                  <h3 class="text-4xl font-light italic font-serif leading-none">Surface Mount</h3>
                  <p class="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-4">Exposed Ceilings & Concrete</p>
               </div>
            </button>

            <button @click="selectScene('Trimless')" class="group relative h-[500px] rounded-[3rem] overflow-hidden border border-zinc-900 hover:border-zinc-500 transition-all">
               <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
               <img src="https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=1000" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
               <div class="absolute bottom-12 left-12 z-20 text-left">
                  <span class="px-4 py-1.5 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">Minimalist</span>
                  <h3 class="text-4xl font-light italic font-serif leading-none">Trimless Flush</h3>
                  <p class="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-4">Plaster-in Seamless Finish</p>
               </div>
            </button>

            <button @click="selectScene('Pendant')" class="group relative h-[500px] rounded-[3rem] overflow-hidden border border-zinc-900 hover:border-zinc-500 transition-all">
               <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
               <img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1000" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
               <div class="absolute bottom-12 left-12 z-20 text-left">
                  <span class="px-4 py-1.5 border border-white text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">Architectural</span>
                  <h3 class="text-4xl font-light italic font-serif leading-none">Pendant Suspension</h3>
                  <p class="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-4">Office & Studio High Ceilings</p>
               </div>
            </button>
          </div>
          
          <div class="mt-20 py-12 border-t border-zinc-900 flex justify-between items-center opacity-30 uppercase text-[10px] font-black tracking-[0.5em]">
             <span>S10 10MM PRO PROTOCOL</span>
             <span>VER 2.4.0</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main Configurator UI -->
    <div v-if="step >= 0" class="flex flex-col lg:flex-row min-h-screen relative print:hidden">
      
      <!-- Sticky Navigation Bar (Top) -->
      <nav class="fixed top-0 left-0 right-0 h-2 bg-zinc-900 z-50">
        <div class="h-full bg-white transition-all duration-1000" :style="`width: ${(step/5)*100}%` "></div>
      </nav>

      <main class="flex-1 p-6 lg:p-20 relative z-10 overflow-y-auto">
        <header class="mb-16 flex justify-between items-center">
           <button @click="step = -1" class="text-zinc-600 hover:text-white flex items-center gap-3 transition-colors">
              <RotateCcw size="14" /> <span class="text-[10px] font-black uppercase tracking-widest">Main Menu</span>
           </button>
           <div class="px-4 py-1.5 bg-zinc-900 rounded-lg text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Project Sequence {{ step }} / 5
           </div>
        </header>

        <div class="max-w-3xl mx-auto">
           <!-- Step 0: Already chosen in welcome, but can change here -->
           <div v-if="step === 0" class="space-y-12">
              <div class="space-y-4">
                 <h2 class="text-7xl font-thin italic font-serif text-white tracking-tighter">Mounting Style</h2>
                 <p class="text-zinc-500 text-lg uppercase tracking-widest">Selected: {{ config.mounting }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                 <button v-for="m in (['Surface', 'Trimless', 'Pendant', 'Recessed'] as MountingType[])" :key="m" @click="config.mounting = m"
                  :class="['p-8 rounded-[2.5rem] border text-left flex flex-col justify-between h-56 transition-all', config.mounting === m ? 'border-white bg-white/5' : 'border-zinc-900 hover:border-zinc-700']">
                  <Layers class="w-8 h-8" />
                  <span class="text-2xl font-black uppercase tracking-tighter">{{ m }}</span>
                 </button>
              </div>
           </div>

           <!-- Step 1: Topology -->
           <div v-if="step === 1" class="space-y-12">
              <h2 class="text-7xl font-thin italic font-serif text-white tracking-tighter">System Topology</h2>
              <div class="grid grid-cols-2 gap-4">
                <button v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as LayoutType[])" :key="l" @click="config.layout = l"
                  :class="['p-8 rounded-[2.5rem] border text-left flex flex-col justify-between h-56 transition-all', config.layout === l ? 'border-white bg-white/5' : 'border-zinc-900 hover:border-zinc-700']">
                   <LayoutIcon />
                   <span class="text-2xl font-black uppercase tracking-tighter">{{ l }}</span>
                </button>
              </div>
           </div>

           <!-- Step 2: Metres -->
           <div v-if="step === 2" class="space-y-12 text-center">
              <h2 class="text-7xl font-thin italic font-serif text-white tracking-tighter mb-20">Linear Metres</h2>
              <div class="text-[180px] font-thin leading-none tracking-tighter text-white tabular-nums flex items-end justify-center">
                 {{ (config.totalLength || 0).toFixed(1) }}<span class="text-3xl mb-12 ml-6 font-black uppercase text-zinc-800">m</span>
              </div>
              <input type="range" min="1" max="50" step="0.5" v-model.number="config.totalLength" class="w-full max-w-xl accent-white bg-zinc-900 h-2 rounded-full cursor-pointer" />
           </div>

           <!-- Step 3: Luminaires (Issue 4 Enforced) -->
           <div v-if="step === 3" class="space-y-10">
              <div class="flex justify-between items-end border-b border-zinc-900 pb-10">
                 <h2 class="text-7xl font-thin italic font-serif text-white tracking-tighter">Luminaires</h2>
                 <div v-if="config.selectedLuminaires.length === 0" class="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                    <AlertCircle size="14" /> Add modules to proceed
                 </div>
              </div>
              <div class="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                 <div v-for="lamp in data.lamps" :key="lamp.model" class="p-8 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] flex items-center gap-10 group hover:border-zinc-600 transition-all">
                    <div class="w-28 h-28 bg-black rounded-3xl overflow-hidden shrink-0 relative">
                       <img :src="getImageUrl(lamp.photo)" @error="handleImgError" class="w-full h-full object-contain" />
                       <button @click="showSpecs = lamp" class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Info /></button>
                    </div>
                    <div class="flex-1">
                       <h3 class="text-xl font-bold uppercase tracking-widest text-white leading-none">{{ lamp.model }}</h3>
                       <p class="text-[9px] font-black text-zinc-600 mt-2 uppercase tracking-[0.2em]">{{ lamp.power }}W S10 MODULE / DC48V</p>
                    </div>
                    <div class="flex items-center gap-6 bg-black rounded-3xl p-4 border border-zinc-900">
                       <button @click="updateLuminaire(lamp, -1)" class="p-2 hover:text-white transition-colors"><Minus size="18" /></button>
                       <span class="text-2xl font-mono font-bold w-12 text-center">{{ getCount(lamp.model) }}</span>
                       <button @click="updateLuminaire(lamp, 1)" class="p-2 hover:text-white transition-colors"><Plus size="18" /></button>
                    </div>
                 </div>
              </div>
           </div>

           <!-- Step 4: Engineering (Issue 4 Enforced) -->
           <div v-if="step === 4" class="space-y-12">
              <h2 class="text-7xl font-thin italic font-serif text-white tracking-tighter text-center">Engineering</h2>
              <div :class="['p-16 rounded-[4rem] border-4 transition-all mt-12 text-center', isOverloaded ? 'border-red-600 bg-red-950/20' : 'border-zinc-900 bg-zinc-900/30']">
                  <div v-if="isOverloaded" class="text-red-500 font-black uppercase tracking-[0.5em] text-xs mb-10 flex items-center justify-center gap-4 animate-bounce">
                     <AlertCircle /> LOAD LIMIT EXCEEDED
                  </div>
                  <div class="text-9xl font-thin text-white tabular-nums mb-10">{{ totalLoad.toFixed(1) }}<span class="text-2xl ml-4 text-zinc-800 font-black">W</span></div>
                  <div class="h-4 w-full bg-black rounded-full overflow-hidden mb-12 border border-zinc-800">
                    <div :class="['h-full transition-all duration-1000', isOverloaded ? 'bg-red-500' : 'bg-white']" :style="'width:' + Math.min(100, (totalLoad/maxSafeLoad*100)) + '%'"></div>
                  </div>
                  <p v-if="isOverloaded" class="text-zinc-500 uppercase text-[10px] font-bold max-w-sm mx-auto">Please reduce the number of luminaires. S10 standard rail capacity is {{ maxSafeLoad }}W per feed.</p>
                  <p v-else class="text-green-500 uppercase text-[10px] font-bold flex items-center justify-center gap-2"><Zap size="14" /> System Optimized for Architectural Stability</p>
              </div>
           </div>

           <!-- Step 5: Complete -->
           <div v-if="step === 5" class="py-20 text-center space-y-12">
              <h2 class="text-7xl font-thin italic font-serif text-white tracking-tighter">Synchronised</h2>
              <div class="w-48 h-48 bg-white text-black rounded-full mx-auto flex items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.1)]">
                 <CheckCircle2 size="80" stroke-width="1" />
              </div>
              <p class="text-zinc-500 uppercase font-bold tracking-widest">Configuration verified against S10 technical PDF protocols.</p>
              <button @click="window.print()" class="px-20 py-10 bg-zinc-100 text-black rounded-full text-xl font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95">Download Proposal</button>
           </div>

           <!-- Footer Nav (Guided) -->
           <footer class="mt-24 pt-16 border-t border-zinc-900 flex justify-between items-center">
              <button @click="prevStep" v-if="step > 0" class="text-zinc-700 hover:text-white flex items-center gap-2 transition-all uppercase text-[10px] font-black tracking-widest"><ArrowLeft /> Back</button>
              <div v-else></div>
              <button @click="nextStep" :disabled="(step === 3 && config.selectedLuminaires.length === 0) || (step === 4 && isOverloaded)"
                class="px-16 py-6 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-4 hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-5 transition-all">
                {{ step === 5 ? 'RESTART' : 'Next Sequence' }} <ArrowRight size="16" />
              </button>
           </footer>
        </div>
      </main>

      <!-- Fixed Sidebar Dash (Issue 5 - Critical Information) -->
      <aside class="hidden lg:flex w-[500px] bg-[#080808] border-l border-zinc-900/50 p-16 flex-col h-screen sticky top-0 z-40">
        <h3 class="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-700 mb-10 border-b border-zinc-900 pb-8 flex items-center gap-3"><Package size="18" /> Project Live Feed</h3>
        
        <div class="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
           <div v-if="calculateBOM.length === 0" class="h-full flex flex-col items-center justify-center border border-zinc-900 rounded-[3rem] text-zinc-800 italic p-12 text-center">
              <p>Awaiting structural parameters...</p>
           </div>
           <div v-for="(item, idx) in calculateBOM" :key="idx" class="bg-zinc-900/40 p-6 rounded-[2.5rem] flex items-center gap-6 border border-transparent hover:border-zinc-800 transition-all">
              <div class="w-16 h-16 bg-black rounded-2xl overflow-hidden shrink-0 border border-zinc-900">
                 <img v-if="item.photo" :src="item.photo" @error="handleImgError" class="w-full h-full object-contain p-1" />
                 <Package v-else class="w-full h-full p-4 text-zinc-900" />
              </div>
              <div class="flex-1 min-w-0">
                 <div class="flex justify-between items-start">
                    <h4 class="text-[11px] font-bold text-white uppercase tracking-wider truncate">{{ item.model }}</h4>
                    <span class="text-xs font-mono font-black text-zinc-600">x{{ item.quantity }}</span>
                 </div>
                 <p class="text-[10px] text-zinc-600 truncate mt-1.5 uppercase font-medium">{{ item.description }}</p>
              </div>
           </div>
        </div>

        <div class="mt-12 bg-white text-black p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
           <div class="absolute inset-0 bg-[#002d5a] scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-700 z-0"></div>
           <div class="relative z-10">
              <div class="flex justify-between items-center mb-4 opacity-40 uppercase tracking-widest font-black text-[10px] group-hover:text-white/40">
                 <span>Subtotal (GBP)</span>
                 <span>{{ totalLoad.toFixed(0) }}W</span>
              </div>
              <div class="text-8xl font-thin tracking-tighter tabular-nums group-hover:text-white transition-colors italic font-serif">£{{ totalPrice.toLocaleString('en-GB') }}</div>
           </div>
        </div>
      </aside>
    </div>

    <!-- Technical Specs Modal -->
    <Transition name="fade">
      <div v-if="showSpecs" class="fixed inset-0 z-[400] flex items-center justify-center p-12 bg-black/98 backdrop-blur-3xl" @click="showSpecs = null">
        <div class="bg-zinc-950 border border-zinc-900 rounded-[4rem] max-w-4xl w-full p-20 relative overflow-hidden shadow-2xl" @click.stop>
          <button @click="showSpecs = null" class="absolute top-16 right-16 text-zinc-700 hover:text-white transition-all transform hover:rotate-90"><X size="32" /></button>
          <div class="flex flex-col md:flex-row gap-20">
             <div class="w-full md:w-1/2 aspect-square bg-black border border-zinc-900 rounded-[3rem] overflow-hidden">
                <img :src="getImageUrl(showSpecs.photo)" @error="handleImgError" class="w-full h-full object-contain p-10" />
             </div>
             <div class="flex-1 text-left">
                <h2 class="text-5xl font-light italic font-serif text-white uppercase tracking-tight mb-8 leading-tight">{{ showSpecs.model }}</h2>
                <div class="space-y-4 max-h-[40vh] overflow-y-auto pr-6 custom-scrollbar">
                   <div v-for="(val, key) in (showSpecs.specsData || {})" :key="key" class="border-b border-zinc-900 pb-4">
                      <span class="text-[11px] font-black uppercase tracking-widest text-zinc-700 mb-1 block">{{ key }}</span>
                      <span class="text-sm font-mono text-zinc-300 italic">{{ val }}</span>
                   </div>
                   <div v-if="!showSpecs.specsData || Object.keys(showSpecs.specsData).length === 0" class="py-12 border-2 border-dashed border-zinc-900 rounded-3xl text-center text-zinc-800 italic text-xs uppercase tracking-widest">S10 System Technical Data Point</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Professional Print Template (B2B Standard) -->
    <div id="print-area" class="hidden print:block bg-white text-[#002855] p-20 font-sans">
       <header class="flex justify-between items-end border-b-[12px] border-[#002855] pb-12 mb-20">
          <div>
            <h1 class="text-9xl font-black uppercase tracking-tighter leading-none italic font-serif">ACOfusion</h1>
            <p class="text-lg font-black tracking-[0.6em] mt-6">S10 SMART MAGNETIC 48V RAIL SYSTEM</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] font-black uppercase text-zinc-300 mb-2">QUOTATION EXPORTED ON</p>
            <p class="text-4xl font-mono font-black italic">{{ new Date().toLocaleDateString('en-GB') }}</p>
            <p class="text-[11px] uppercase font-black mt-4 text-[#002855]/40 tracking-widest italic">REF: S10-ARC-{{ Math.random().toString(36).substr(2, 6).toUpperCase() }}</p>
          </div>
       </header>

       <section class="grid grid-cols-2 gap-20 mb-20 bg-zinc-50 p-12 rounded-[4rem] border border-zinc-100">
          <div>
            <h4 class="text-xs font-black uppercase tracking-widest border-b-2 border-zinc-200 pb-4 mb-8">Technical Parameters</h4>
            <div class="grid grid-cols-2 gap-y-6 text-base font-bold italic font-serif">
              <span class="opacity-40 uppercase tracking-tighter">Mounting:</span> <span>{{ config.mounting }}</span>
              <span class="opacity-40 uppercase tracking-tighter">Topology:</span> <span>{{ config.layout }}</span>
              <span class="opacity-40 uppercase tracking-tighter">Length:</span> <span class="font-mono">{{ config.totalLength }} Metres</span>
              <span class="opacity-40 uppercase tracking-tighter">Electrical:</span> <span class="font-mono text-xl">{{ totalLoad.toFixed(1) }}W (Total Demand)</span>
            </div>
          </div>
          <div class="flex flex-col justify-center items-end border-l-2 border-zinc-200 pl-20">
            <p class="text-[11px] font-black uppercase tracking-[0.6em] opacity-40 mb-6">Total Project Estimate (GBP)</p>
            <div class="text-[120px] font-black tracking-tighter italic font-serif leading-none">£{{ totalPrice.toLocaleString('en-GB') }}</div>
            <p class="text-[10px] font-black opacity-30 mt-8 uppercase tracking-[0.3em] italic">All system component pricing ex VAT & Carriage</p>
          </div>
       </section>

       <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-[11px] font-black uppercase tracking-widest border-b-4 border-[#002855] bg-[#f8faff]">
              <th class="py-10 px-8 w-40 text-center">Ref</th>
              <th class="py-10 px-8">System Engineering Specifications</th>
              <th class="py-10 px-8 text-center">Qty</th>
              <th class="py-10 px-8 text-right">Net Price</th>
              <th class="py-10 px-12 text-right bg-[#002855] text-white">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 text-base">
            <tr v-for="(item, idx) in calculateBOM" :key="idx">
              <td class="py-12 px-8 text-center">
                 <div class="w-24 h-24 bg-white border border-zinc-100 rounded-[2rem] flex items-center justify-center overflow-hidden mx-auto mb-4">
                    <img v-if="item.photo" :src="item.photo" class="w-full h-full object-contain p-2" />
                    <Package v-else class="text-zinc-100" />
                 </div>
                 <span class="text-[9px] font-mono font-black opacity-20 block truncate italic uppercase">{{ (item.model || '').toString().toUpperCase() }}</span>
              </td>
              <td class="py-12 px-8">
                <div class="text-2xl font-black uppercase tracking-tighter leading-none mb-4 italic font-serif">{{ (item.model || '').toString().toUpperCase() }}</div>
                <div class="text-[11px] font-bold text-zinc-400 uppercase tracking-widest italic">{{ item.category }} | {{ item.description }}</div>
              </td>
              <td class="py-12 px-8 text-center font-mono font-black text-3xl italic">x{{ item.quantity }}</td>
              <td class="py-12 px-8 text-right font-mono opacity-50 italic">£{{ (item.price || 0).toLocaleString('en-GB', { minimumFractionDigits: 1 }) }}</td>
              <td class="py-12 px-12 text-right font-mono font-black text-3xl italic">£{{ ((item.price || 0) * (item.quantity)).toLocaleString('en-GB', { minimumFractionDigits: 1 }) }}</td>
            </tr>
          </tbody>
       </table>

       <footer class="mt-32 pt-20 border-t-8 border-zinc-100 grid grid-cols-2 gap-32">
          <div class="space-y-8">
             <h5 class="text-[11px] font-black uppercase tracking-[0.5em] mb-6">Technical Compliance Clause</h5>
             <p class="text-[10px] leading-relaxed text-zinc-400 font-bold uppercase text-justify italic font-serif">
               Quantities derived from algorithmic configuration based on ACO 10mm Ultra-thin S10 protocol. Final circuit verification by a certified L6 lighting engineer is mandatory. DC48V polarity alignment must be confirmed using official Polarity Changer modules on all loop-based topologies. ACOfusion reserves deviation rights for systemic stability.
             </p>
          </div>
          <div class="text-right flex flex-col justify-end">
             <div class="text-xl font-black uppercase tracking-[0.5em] text-[#002855] mb-4 italic font-serif">ACOfusion Global (UK) Ltd</div>
             <p class="text-[10px] font-mono font-black opacity-20 italic uppercase tracking-widest">S10-SYSTEM-PROTOCOL-V2.0 // AUTOMATED EXPORT ENGINE</p>
          </div>
       </footer>
    </div>

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fragment+Mono&family=Inter:wght@100..900&family=Playfair+Display:ital,wght@1,400..900&display=swap');

body { margin: 0; background: black; -webkit-font-smoothing: antialiased; letter-spacing: -0.02em; color-scheme: dark; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from { opacity: 0; transform: translateY(40px) scale(0.98); }
.slide-leave-to { opacity: 0; transform: translateY(-40px) scale(0.98); }

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 32px;
  width: 32px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 0 40px rgba(255,255,255,0.4);
}

@media print {
  body { background: white !important; color-scheme: light; }
  .grid, header, main, aside, .Transition, #app > div:not(#print-area), button, nav { display: none !important; }
  #print-area { display: block !important; position: static !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
  @page { size: A4 portrait; margin: 5mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
</style>
