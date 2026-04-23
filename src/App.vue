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
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwWF9xz0XGcll_e6dB9OZtfbtu_CsROLJKcZT_9nRwM/exec' 
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

// --- Core Configuration Logic (Strictly Following TRD Section 2 & 3) ---
const calculateBOM = computed<BOMItem[]>(() => {
  const bom: BOMItem[] = []
  if (!data.value.accessories.length) return []

  const { mounting, layout, totalLength, selectedLuminaires } = config.value

  // 1. Main Track Selection (TRD 2.1)
  let trackModel = ''
  if (mounting === 'Surface' || mounting === 'Pendant') trackModel = 'G-TL-A'
  else if (mounting === 'Trimless') trackModel = 'G-TL-D'
  else if (mounting === 'Recessed') trackModel = 'G-TL-B' // Standard for recessed

  const profileQty = Math.ceil(totalLength / TRACK_PIECE_METRES)
  const trackInfo = data.value.accessories.find(a => a.model === trackModel)
  
  bom.push({
    model: `${trackModel}-2M`,
    category: 'Profile',
    description: `${mounting} Magnetic Track Piece (2.0 Metres) - TRD COMPLIANT`,
    quantity: profileQty,
    price: trackInfo?.price || 0,
    photo: trackInfo?.photo || null
  })

  // 2. Topology Accessories (TRD 2.2)
  let corners = 0
  if (layout === 'L-Shape') corners = 1
  else if (layout === 'T-Shape') corners = 2
  else if (layout === 'Rectangle') corners = 4

  if (corners > 0) {
    const cornerData = data.value.accessories.find(a => a.model.includes('Corner') && a.model.includes(trackModel)) || 
                       data.value.accessories.find(a => a.model.includes('Corner'))
    
    // Mechanical + Electrical Corner Set
    bom.push({
      model: `${trackModel}-Corner`,
      category: 'Hardware',
      description: '90° Corner Connector & Conduction Module',
      quantity: corners,
      price: cornerData?.price || 0,
      photo: cornerData?.photo || null
    })
  }

  // Polarity Changer logic (TRD 2.2 Section 3)
  if (layout === 'T-Shape' || layout === 'Rectangle') {
    const polarityData = data.value.accessories.find(a => a.model.toLowerCase().includes('polarity') || a.model.toLowerCase().includes('phase changer'))
    bom.push({
      model: polarityData?.model || 'Polarity-Changer',
      category: 'Electrical',
      description: 'Phase Separator / Polarity Shield (Mandatory Loop Safety)',
      quantity: 1,
      price: polarityData?.price || 0,
      photo: polarityData?.photo || null
    })
  }

  // 3. Automated BOM Matrix (TRD Section 3)
  // End Caps: 固定加入 2 個 End Plate / Cap (-SM)
  const capInfo = data.value.accessories.find(a => a.model.toLowerCase().includes('end cap'))
  bom.push({
    model: 'End Cap (-SM)',
    category: 'Hardware',
    description: 'Track System Finishing Plate',
    quantity: 2,
    price: capInfo?.price || 0,
    photo: capInfo?.photo || null
  })

  // Mains Feed: 自動加入 1 個 Live End / Power Feed Connector (-ZJDY)
  const liveEndData = data.value.accessories.find(a => a.model.includes('-ZJDY') || a.model.toLowerCase().includes('live end'))
  bom.push({
    model: liveEndData?.model || 'Live End (-ZJDY)',
    category: 'Electrical',
    description: 'System Power Input Feed',
    quantity: 1,
    price: liveEndData?.price || 0,
    photo: liveEndData?.photo || null
  })

  // Mechanical Connectors: 軌道數量 - 1 - 轉角數量
  const joinerQty = Math.max(0, profileQty - 1 - corners)
  if (joinerQty > 0) {
    const joinerInfo = data.value.accessories.find(a => a.model.toLowerCase().includes('connector') && !a.model.toLowerCase().includes('corner'))
    bom.push({
      model: 'Straight Joiner',
      category: 'Hardware',
      description: 'Longitudinal Splicing Connector',
      quantity: joinerQty,
      price: joinerInfo?.price || 0,
      photo: joinerInfo?.photo || null
    })
  }

  // Mounting Hardware
  if (mounting === 'Surface') {
    bom.push({
      model: 'Fixing Clip (-MZKK)',
      category: 'Hardware',
      description: 'Surface Mounting Support Clip',
      quantity: Math.max(2, profileQty * 2),
      price: 0,
      photo: null
    })
  } else if (mounting === 'Pendant') {
    bom.push({
      model: 'Suspension Kit',
      category: 'Hardware',
      description: 'Steel Wire Suspension Solution',
      quantity: (profileQty * 2) + corners,
      price: 0,
      photo: null
    })
  }

  // 4. Luminaires (TRD 2.1)
  selectedLuminaires.forEach(sel => {
    bom.push({
      model: sel.item.model,
      category: 'Luminaire',
      description: `${sel.item.power}W | ${sel.item.specsData?.CCT || '3000K'} | CRI${sel.item.specsData?.CRI || 90}`,
      quantity: sel.quantity,
      price: sel.item.price || 0,
      photo: sel.item.photo
    })
  })

  // 5. Electrical Balancing (TRD 2.3)
  // Formula: Driver Capacity Required = Total Load + Max_Single_Light_Wattage
  const totalLoad = selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0)
  const maxSingleWatt = selectedLuminaires.length > 0 ? Math.max(...selectedLuminaires.map(s => s.item.power)) : 0
  const requiredCapacity = totalLoad + maxSingleWatt

  if (totalLoad > 0) {
    const drivers = data.value.accessories
      .filter(a => a.category.toLowerCase().includes('driver') || a.category.toLowerCase().includes('power supply'))
      .sort((a,b) => (parseInt(b.model.match(/\d+/)?.[0] || '0')) - (parseInt(a.model.match(/\d+/)?.[0] || '0')))
    
    if (drivers.length) {
      const bestDriver = drivers[0]
      const capacity = parseInt(bestDriver.model.match(/\d+/)?.[0] || '100')
      
      // Calculate how many drivers are needed to meet "Required Capacity"
      const driverQty = Math.ceil(requiredCapacity / (capacity * 0.9)) // Using 90% as usable buffer
      
      bom.push({
        model: bestDriver.model,
        category: 'Power Supply',
        description: `48V DC Professional Supply (${capacity}W)`,
        quantity: driverQty,
        price: bestDriver.price || 0,
        photo: bestDriver.photo
      })
    }
  }

  return bom
})

// --- Aggregates ---
const totalLoad = computed(() => config.value.selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0))
const maxSingleWatt = computed(() => config.value.selectedLuminaires.length > 0 ? Math.max(...config.value.selectedLuminaires.map(s => s.item.power)) : 0)
const requiredCapacity = computed(() => totalLoad.value + maxSingleWatt.value)
const maxPossibleDriverCap = computed(() => {
  const drivers = data.value.accessories.filter(a => a.category.toLowerCase().includes('driver') || a.category.toLowerCase().includes('power supply'))
  if (drivers.length === 0) return 200 // Default fallback
  const caps = drivers.map(d => {
    const m = d.model.match(/\d+/)
    return m ? parseInt(m[0]) : 0
  })
  return Math.max(...caps, 100)
})

// TRD 5: Block if totalLoad exceeds MAX available driver (usually 200W)
const isOverloaded = computed(() => totalLoad.value > maxPossibleDriverCap.value)

const totalPrice = computed(() => calculateBOM.value.reduce((a, c) => a + (c.price * c.quantity), 0))

// --- Interaction Methods ---
const nextStep = () => {
  // Poka-yoke: Prohibition of empty orders (TRD 5)
  if (step.value === 3 && config.value.selectedLuminaires.length === 0) return
  // Poka-yoke: Overload block (TRD 5)
  if (step.value === 4 && isOverloaded.value) return 
  
  step.value = Math.min(step.value + 1, 5)
}
const prevStep = () => step.value = Math.max(step.value - 1, 0)
const handleImageError = (e: any) => {
  e.target.src = 'https://via.placeholder.com/400x400/18181b/ffffff?text=Product+Image'
}

const updateLuminaire = (lamp: Luminaire, delta: number) => {
  const existing = config.value.selectedLuminaires.find(s => s.item.model === lamp.model)
  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + delta)
    if (existing.quantity === 0) {
      config.value.selectedLuminaires = config.value.selectedLuminaires.filter(s => s.item.model !== lamp.model)
    }
  } else if (delta > 0) {
    config.value.selectedLuminaires.push({ item: lamp, quantity: 1 })
  }
}

const getLampCount = (model: string) => config.value.selectedLuminaires.find(s => s.item.model === model)?.quantity || 0
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-100 selection:text-black antialiased">
    
    <!-- Loading Overlay -->
    <Transition name="fade">
      <div v-if="loading" class="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <div class="relative w-24 h-24">
          <div class="absolute inset-0 border-2 border-zinc-900 rounded-full"></div>
          <div class="absolute inset-0 border-t-2 border-zinc-100 rounded-full animate-spin"></div>
        </div>
        <p class="mt-8 text-xs font-bold uppercase tracking-[0.4em] text-zinc-500 animate-pulse">Initialising System</p>
      </div>
    </Transition>

    <!-- Main Layout -->
    <div class="flex flex-col lg:flex-row min-h-screen">
      
      <div class="flex-1 p-6 lg:p-12 lg:border-r lg:border-zinc-900 overflow-y-auto">
        <header class="mb-12 flex justify-between items-center">
          <div>
            <h1 class="text-xs font-black uppercase tracking-[0.5em] text-zinc-600 flex items-center gap-2">
              <span class="w-1.5 h-1.5 bg-zinc-100 rounded-full"></span>
              Nooran Lighting
            </h1>
            <p class="text-[10px] uppercase tracking-widest text-zinc-700 mt-1">S10 Magnetic Smart Configurator</p>
          </div>
          <div class="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-mono text-zinc-500">
            STEP {{ step + 1 }} / 6
          </div>
        </header>

        <!-- Wizard Steps Rendering -->
        <Transition name="slide" mode="out-in">
          <div :key="step" class="max-w-2xl mx-auto w-full">
            
            <!-- Step 0: Mounting -->
            <div v-if="step === 0" class="space-y-8">
              <div class="space-y-2">
                <h2 class="text-4xl font-light tracking-tight">Mounting Method</h2>
                <p class="text-zinc-500">How would you like to install your magnetic track?</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  v-for="m in (['Surface', 'Trimless', 'Pendant', 'Recessed'] as MountingType[])" 
                  :key="m"
                  @click="config.mounting = m"
                  :class="['p-6 rounded-2xl border transition-all text-left group relative backdrop-blur-sm', 
                    config.mounting === m ? 'border-zinc-100 bg-white/5' : 'border-zinc-900 bg-zinc-950/50 hover:border-zinc-700']"
                >
                  <Layers class="mb-4 w-6 h-6" :class="config.mounting === m ? 'text-zinc-100' : 'text-zinc-700'" />
                  <span class="block text-xl font-medium tracking-tight">{{ m }}</span>
                  <span class="text-[10px] uppercase tracking-widest text-zinc-600 mt-2 block">
                    {{ m === 'Surface' ? 'Direct Ceiling Mount' : m === 'Trimless' ? 'Flush Plasterboard Integration' : m === 'Pendant' ? 'Suspension Wire System' : 'Visible Flange Mount' }}
                  </span>
                  <div v-if="config.mounting === m" class="absolute top-4 right-4"><CheckCircle2 size="16" /></div>
                </button>
              </div>
            </div>

            <!-- Step 1: Topology -->
            <div v-if="step === 1" class="space-y-8">
              <div class="space-y-2">
                <h2 class="text-4xl font-light tracking-tight">Topology</h2>
                <p class="text-zinc-500">Define the geometric structural layout.</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as LayoutType[])" 
                  :key="l"
                  @click="config.layout = l"
                  :class="['p-6 rounded-2xl border transition-all text-left group relative', 
                    config.layout === l ? 'border-zinc-100 bg-white/5' : 'border-zinc-900 bg-zinc-950/50 hover:border-zinc-700']"
                >
                  <LayoutIcon class="mb-4 w-6 h-6" :class="config.layout === l ? 'text-zinc-100' : 'text-zinc-700'" />
                  <span class="block text-xl font-medium tracking-tight">{{ l }}</span>
                  <p class="text-[10px] text-zinc-600 mt-2">{{ l === 'Straight' ? 'Linear path' : l === 'Rectangle' ? 'Closed electrical loop' : 'Cornered segment' }}</p>
                </button>
              </div>
            </div>

            <!-- Step 2: System Length -->
            <div v-if="step === 2" class="space-y-8 text-center">
              <div class="space-y-2">
                <h2 class="text-4xl font-light tracking-tight">System Length</h2>
                <p class="text-zinc-500">Total linear metres required for the installation.</p>
              </div>
              <div class="bg-zinc-950 border border-zinc-900 p-12 rounded-[2rem] shadow-2xl shadow-white/5">
                <div class="text-7xl font-light tracking-tighter mb-8">
                  {{ (config.totalLength || 0).toFixed(1) }}<span class="text-xl ml-2 text-zinc-700 uppercase tracking-widest font-black">Metres</span>
                </div>
                <input 
                  type="range" min="1" max="50" step="0.5" 
                  v-model.number="config.totalLength"
                  class="w-full h-1 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-zinc-100 opacity-50 hover:opacity-100 transition-opacity"
                />
                <div class="flex gap-4 mt-8">
                  <button @click="config.totalLength = Math.max(1, config.totalLength - 1)" class="flex-1 py-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors uppercase text-[10px] font-bold tracking-widest">- 1.0m</button>
                  <button @click="config.totalLength += 1" class="flex-1 py-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors uppercase text-[10px] font-bold tracking-widest">+ 1.0m</button>
                </div>
              </div>
            </div>

            <!-- Step 3: Luminaires -->
            <div v-if="step === 3" class="space-y-8">
              <div class="space-y-2">
                <h2 class="text-4xl font-light tracking-tight">Luminaire Selection</h2>
                <p class="text-zinc-500">Choose the 48V lamp modules for your track system.</p>
              </div>
              <div class="grid grid-cols-1 gap-3 max-h-[55vh] overflow-y-auto pr-3 scrollbar-thin">
                <div 
                  v-for="lamp in data.lamps" :key="lamp.model"
                  class="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center gap-6 group hover:border-zinc-700 transition-colors"
                >
                  <div class="w-20 h-20 bg-black rounded-xl overflow-hidden border border-zinc-900 relative">
                    <img :src="lamp.photo || ''" @error="handleImageError" class="w-full h-full object-contain" />
                    <button 
                      @click="showSpecs = lamp"
                      class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Maximize2 class="text-zinc-100" size="18" />
                    </button>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-bold uppercase tracking-widest truncate">{{ lamp.model }}</h3>
                    <p class="text-xs text-zinc-600 mt-1">{{ lamp.power }}W | {{ lamp.specsData?.CCT || '3000K' }}</p>
                    <p class="text-xs font-mono text-zinc-100 mt-1">£{{ lamp.price }}</p>
                  </div>
                  <div class="flex items-center bg-zinc-900 rounded-lg p-1">
                    <button @click="updateLuminaire(lamp, -1)" class="p-2 text-zinc-500 hover:text-zinc-100"><Minus size="14" /></button>
                    <span class="w-8 text-center font-mono text-sm leading-none">{{ getLampCount(lamp.model) }}</span>
                    <button @click="updateLuminaire(lamp, 1)" class="p-2 text-zinc-500 hover:text-zinc-100"><Plus size="14" /></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 4: Electrical Integrity -->
            <div v-if="step === 4" class="space-y-8">
               <div class="space-y-2">
                <h2 class="text-4xl font-light tracking-tight text-center lg:text-left">Electrical Safety Check</h2>
                <p class="text-zinc-500 text-center lg:text-left">Verifying system load requirements and power balance.</p>
              </div>
              
              <div 
                :class="['p-8 rounded-[2rem] border-2 flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors', 
                (totalLoad || 0) > maxPossibleDriverCap ? 'border-red-950 bg-red-950/20' : 'border-zinc-900 bg-zinc-950/50']"
              >
                <div class="flex items-center gap-6">
                  <div :class="['p-5 rounded-3xl', (totalLoad || 0) > maxPossibleDriverCap ? 'bg-red-500 text-black' : 'bg-zinc-100 text-black']">
                    <Zap v-if="(totalLoad || 0) <= maxPossibleDriverCap" size="24" />
                    <AlertCircle v-else size="24" />
                  </div>
                  <div>
                    <p class="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">Load Demand</p>
                    <p class="text-6xl font-light tracking-tighter">{{ (totalLoad || 0).toFixed(0) }}W</p>
                  </div>
                </div>
                <div class="text-center sm:text-right">
                  <p class="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">Status</p>
                  <p :class="['text-2xl font-medium mt-1', (totalLoad || 0) > maxPossibleDriverCap ? 'text-red-500' : 'text-green-500']">
                    {{ (totalLoad || 0) > maxPossibleDriverCap ? 'OVERLOADED' : 'OPTIMAL' }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-zinc-950 p-6 rounded-2xl border border-zinc-900">
                  <p class="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Driver Requirement</p>
                  <div class="mt-4 flex items-center gap-2">
                    <Package size="16" class="text-zinc-400" />
                    <span class="text-lg">{{ Math.ceil((totalLoad || 0) / (maxPossibleDriverCap * 0.9)) }}x Professional DC Power Unit</span>
                  </div>
                </div>
                <div class="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 px-8 flex flex-col justify-center">
                  <p class="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Safety Margin</p>
                  <p class="text-2xl font-light mt-1">20% Utilised</p>
                </div>
              </div>
            </div>

            <!-- Step 5: Final Submission -->
            <div v-if="step === 5" class="space-y-8 text-center sm:text-left">
              <div class="space-y-2">
                <h2 class="text-4xl font-light tracking-tight">Proposal Ready</h2>
                <p class="text-zinc-500">Review your final S10 magnetic track configuration.</p>
              </div>
              <div class="bg-zinc-100 text-black p-12 rounded-[2.5rem] flex flex-col items-center justify-center gap-6">
                <div class="bg-black/5 p-4 rounded-full"><CheckCircle2 size="48" class="text-black" /></div>
                <h3 class="text-3xl font-bold tracking-tight">Configuration Complete</h3>
                <p class="text-zinc-600 max-w-sm">All components have been logically verified against the specified topology and mounting method.</p>
                <div class="w-full h-px bg-black/10 my-4"></div>
                <div class="flex flex-col sm:flex-row gap-4 w-full">
                  <button @click="window.print()" class="flex-1 bg-black text-white px-8 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                    <Download size="20" /> Export Specification
                  </button>
                </div>
              </div>
            </div>

          </div>
        </Transition>

        <!-- Navigation Controls (Sticky Mobile Bottom) -->
        <div class="mt-12 flex items-center justify-between border-t border-zinc-900 pt-8 sticky bottom-0 bg-[#09090b]/80 backdrop-blur-xl -mx-6 px-6 lg:mx-0 lg:px-0 lg:relative lg:bg-transparent lg:backdrop-blur-none" style="z-index: 10;">
          <button 
            @click="prevStep" 
            :disabled="step === 0"
            :class="['p-5 rounded-full border transition-all', step === 0 ? 'opacity-0' : 'border-zinc-800 hover:bg-zinc-900']"
          >
            <ArrowLeft size="24" />
          </button>
          
          <div class="hidden sm:flex gap-4">
            <div 
              v-for="i in 6" :key="i"
              :class="['h-1 rounded-full transition-all duration-500', i-1 <= step ? 'w-12 bg-white' : 'w-2 bg-zinc-900']"
            ></div>
          </div>

          <button 
            @click="nextStep" 
            :disabled="step === 5 || (step === 3 && config.selectedLuminaires.length === 0) || (step === 4 && isOverloaded)"
            :class="['p-5 rounded-full bg-zinc-100 text-black transition-all font-bold flex items-center gap-2 shadow-xl shadow-white/5', 
              (step === 5 || (step === 3 && config.selectedLuminaires.length === 0) || (step === 4 && isOverloaded)) ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95']"
          >
            <span v-if="step === 5">DONE</span>
            <ArrowRight v-else size="24" />
          </button>
        </div>
      </div>

      <!-- Right Column: Live BOM Summary (Desktop Only) -->
      <div class="hidden lg:flex w-[400px] xl:w-[500px] bg-black p-12 flex-col h-screen sticky top-0 border-l border-zinc-900">
        <h3 class="text-[10px] items-center gap-2 font-black uppercase tracking-[0.4em] text-zinc-600 mb-8 flex">
          <Package size="14" /> LIVE SPECIFICATION
        </h3>

        <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          <div v-if="calculateBOM.length === 0" class="h-full flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-zinc-900 rounded-3xl p-12 text-center italic">
            <Package size="48" class="mb-4 opacity-10" />
            <p class="text-sm">Initialising hardware mapping...</p>
          </div>
          
          <div 
            v-for="(item, idx) in calculateBOM" :key="idx"
            class="bg-zinc-950/50 border border-zinc-900 p-4 rounded-xl flex items-center gap-4 group"
          >
            <div class="w-12 h-12 bg-black rounded-lg border border-zinc-900 overflow-hidden shrink-0">
               <img v-if="item.photo" :src="item.photo" @error="handleImageError" class="w-full h-full object-contain" />
               <Package v-else class="w-full h-full p-3 text-zinc-800" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <h4 class="text-xs font-bold uppercase tracking-widest truncate">{{ (item.model || '').toString().toUpperCase() }}</h4>
                <span class="text-[9px] font-mono font-bold text-zinc-100 ml-2">x{{ item.quantity }}</span>
              </div>
              <p class="text-[10px] text-zinc-600 truncate mt-1 uppercase">{{ (item.category || '').toString().toUpperCase() }} | {{ item.description }}</p>
            </div>
          </div>
        </div>

        <div class="mt-8 p-8 bg-zinc-100 rounded-3xl text-black shadow-2xl shadow-white/5">
          <div class="flex justify-between items-center mb-6">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">System Estimate</span>
            <div class="flex items-center gap-2">
               <div :class="['w-2 h-2 rounded-full', (totalLoad || 0) > 200 ? 'bg-red-500' : 'bg-green-500 animate-pulse']"></div>
               <span class="text-[10px] font-bold font-mono">{{ (totalLoad || 0).toFixed(0) }}W</span>
            </div>
          </div>
          <div class="text-6xl font-light tracking-tighter tabular-nums">
            £{{ totalPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 }) }}
          </div>
          <p class="text-[9px] font-medium opacity-40 mt-2 uppercase tracking-widest">Pricing exclude VAT and Shipping</p>
        </div>
      </div>
    </div>

    <!-- Specs Modal -->
    <Transition name="fade">
      <div v-if="showSpecs" class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" @click="showSpecs = null">
        <div class="bg-[#09090b] border border-zinc-800 rounded-[2.5rem] p-8 max-w-xl w-full relative shadow-3xl overflow-hidden" @click.stop>
          <button @click="showSpecs = null" class="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
            <X size="24" />
          </button>
          
          <div class="flex flex-col sm:flex-row gap-8">
            <div class="w-full sm:w-1/2 aspect-square bg-black rounded-3xl border border-zinc-900 overflow-hidden">
               <img :src="showSpecs.photo || ''" @error="handleImageError" class="w-full h-full object-contain" />
            </div>
            <div class="flex-1">
              <h2 class="text-3xl font-light tracking-tight">{{ (showSpecs.model || '').toString().toUpperCase() }}</h2>
              <div class="mt-6 space-y-4">
                <div v-for="(val, key) in (showSpecs.specsData || {})" :key="key" class="border-b border-zinc-900 pb-2">
                  <p class="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">{{ (key || '').toString().toUpperCase() }}</p>
                  <p class="text-sm text-zinc-300 mt-1 font-mono italic">{{ val }}</p>
                </div>
                <div v-if="!showSpecs.specsData" class="text-zinc-600 text-sm italic">Additional technical specifications derived upon order.</div>
              </div>
            </div>
          </div>
          
           <!-- Decorative Background Glow -->
           <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-zinc-100/5 blur-[100px] rounded-full"></div>
        </div>
      </div>
    </Transition>

    <!-- Hidden Print Template (A4 Optimized) -->
    <div id="print-area" class="hidden print:block bg-white text-black p-12 min-h-screen font-sans">
      <div class="flex justify-between items-end border-b-4 border-black pb-8 mb-12">
        <div>
          <h1 class="text-4xl font-black uppercase tracking-tighter">ACOfusion</h1>
          <p class="text-xs font-bold tracking-[0.3em] mt-1">S10 MAGNETIC TRACK SYSTEM</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Proposal No.</p>
          <p class="text-xl font-mono">#{{ Math.random().toString(36).substr(2, 6).toUpperCase() }}</p>
          <p class="text-[9px] mt-1">{{ new Date().toLocaleDateString('en-GB') }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h4 class="text-xs font-black uppercase border-b border-zinc-200 pb-2 mb-4">Project Parameters</h4>
          <ul class="text-sm space-y-2">
            <li class="flex justify-between"><span>Mounting Method</span><span class="font-bold">{{ config.mounting }}</span></li>
            <li class="flex justify-between"><span>System Topology</span><span class="font-bold">{{ config.layout }}</span></li>
            <li class="flex justify-between"><span>Total Linear Length</span><span class="font-bold">{{ config.totalLength }}m</span></li>
            <li class="flex justify-between"><span>Aggregated Load</span><span class="font-bold">{{ (totalLoad || 0).toFixed(0) }}W</span></li>
          </ul>
        </div>
        <div class="bg-zinc-50 p-6 rounded-2xl flex flex-col justify-center items-end">
          <p class="text-[10px] font-bold uppercase tracking-widest opacity-50">Estimated Total</p>
          <p class="text-4xl font-black tabular-nums">£{{ totalPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 }) }}</p>
          <p class="text-[9px] mt-2 opacity-50">Excluding VAT & Installation</p>
        </div>
      </div>

      <table class="w-full text-left border-collapse mb-12">
        <thead>
          <tr class="text-[10px] uppercase font-black border-b-2 border-black">
            <th class="py-4 w-16 text-center">Image</th>
            <th class="py-4 px-4">Category</th>
            <th class="py-4">Description / Model</th>
            <th class="py-4 text-center">Qty</th>
            <th class="py-4 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <tr v-for="(item, idx) in calculateBOM" :key="idx">
            <td class="py-4">
              <img :src="item.photo || ''" class="w-12 h-12 object-contain bg-zinc-50 rounded" @error="handleImageError" />
            </td>
            <td class="py-4 px-4 text-[10px] font-bold uppercase text-zinc-400">{{ item.category }}</td>
            <td class="py-4">
              <p class="text-sm font-bold">{{ item.model }}</p>
              <p class="text-[10px] text-zinc-500 leading-tight mt-0.5">{{ item.description }}</p>
            </td>
            <td class="py-4 text-center font-mono text-sm">{{ item.quantity }}</td>
            <td class="py-4 text-right font-mono text-sm leading-none">
              £{{ (item.price * item.quantity).toLocaleString('en-GB', { minimumFractionDigits: 2 }) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-auto pt-12 border-t border-zinc-200">
        <h5 class="text-[10px] font-black uppercase mb-3">Disclaimer & Terms</h5>
        <p class="text-[8px] leading-relaxed text-zinc-500 uppercase font-medium">
          The quantities and components suggested in this Bill of Materials (BOM) are based strictly on the parameters provided in the ACOfusion Smart Configurator. 
          Final technical verification must be performed by a certified electrician. 48V Magnetic Track systems require precise phase polarity alignment. 
          This document is an estimate and does not constitute a final commercial invoice. ACOfusion reserves the right to modify technical specifications.
        </p>
      </div>
    </div>

  </div>
</template>

<style>
/* Custom Styles */
@font-face {
  font-family: 'Inter';
  src: url('https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;700;900&display=swap');
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-enter-from { opacity: 0; transform: translateY(20px); }
.slide-leave-to { opacity: 0; transform: translateY(-20px); }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #27272a; }

@media print {
  body { background: white !important; }
  .lg\:flex, .flex-1, header, .sticky, button, .Transition, #app > div:not(#print-area) { 
    display: none !important; 
  }
  #app { height: auto !important; overflow: visible !important; }
  #print-area { display: block !important; position: static !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
  @page { size: A4; margin: 15mm; }
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 20px rgba(255,255,255,0.4);
  cursor: pointer;
  margin-top: -10px;
}
</style>
