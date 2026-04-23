<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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
  Package
} from 'lucide-vue-next'
import type { Luminaire, Accessory, MountingType, LayoutType, ConfigState, BOMItem } from './types'

// --- Data & Constants ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzppxxh05KJPZzDHlTK6_so2ILiMCsfkeF3btexeVyZ7zoT-04ksNg4lwSGNkZxUSVkdQ/exec'
const TRACK_UNIT = 2.0

// --- App State ---
const loading = ref(true)
const currentStep = ref(0)
const showSpecs = ref<Luminaire | Accessory | null>(null)
const data = ref<{ lamps: Luminaire[], accessories: Accessory[] }>({ lamps: [], accessories: [] })

const config = ref<ConfigState>({
  mounting: 'Surface',
  layout: 'Straight',
  totalLength: 2,
  selectedLuminaires: []
})

// --- Interaction Steps (ERCO Style) ---
const steps = [
  { id: 'mounting', name: 'Type of mounting', desc: 'Define architectural integration' },
  { id: 'layout', name: 'Topology', desc: 'Geometric structural layout' },
  { id: 'length', name: 'System Metres', desc: 'Linear extension scale' },
  { id: 'luminaires', name: 'Light distribution', desc: 'Optical module selection' },
  { id: 'engineering', name: 'Power supply unit', desc: 'Electrical load & safety' },
  { id: 'summary', name: 'Parts list', desc: 'Final technical specification' }
]

// --- Logic Implementation ---
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
  } catch (e) {
    console.error('Fetch Error:', e)
  } finally {
    loading.value = false
  }
}
onMounted(fetchData)

// Image logic (resilient)
const getImageUrl = (url: any) => {
  if (!url) return ''
  const u = url.toString()
  if (u.includes('googleusercontent.com')) return u
  const id = u.match(/id=([-\w]+)/)?.[1] || u.match(/\/d\/([-\w]+)/)?.[1]
  return id ? `https://docs.google.com/uc?export=view&id=${id}` : u
}

// BOM Engine
const findRealItem = (predicate: (a: Accessory) => boolean, prefix?: string) => {
  const items = data.value.accessories.filter(predicate)
  if (!items.length) return null
  return prefix ? (items.find(a => (a.model || '').toString().startsWith(prefix)) || items[0]) : items[0]
}

const calculatedBOM = computed<BOMItem[]>(() => {
  if (!data.value.accessories.length) return []
  const { mounting, layout, totalLength, selectedLuminaires } = config.value
  const bom: BOMItem[] = []

  // 1. Tracks (PDF Logic)
  const seriesPrefix = mounting === 'Trimless' ? 'G-TL-D' : (mounting === 'Recessed' ? 'G-TL-B' : 'G-TL-A')
  const track = findRealItem(a => (a.model || '').toString().startsWith(seriesPrefix), seriesPrefix)
  const qty = Math.ceil(totalLength / TRACK_UNIT)
  
  bom.push({
    model: track?.model || `${seriesPrefix}-2M`,
    category: 'Profile',
    description: `10mm Slim ${mounting} Track (2.0 Metres)`,
    quantity: qty,
    price: track?.price || 0,
    photo: getImageUrl(track?.photo)
  })

  // 2. Topology
  let corners = 0
  if (layout === 'L-Shape') corners = 1
  else if (layout === 'T-Shape') corners = 2
  else if (layout === 'Rectangle') corners = 4

  if (corners > 0) {
    const corner = findRealItem(a => (a.model || '').toString().toLowerCase().includes('corner'), seriesPrefix)
    bom.push({
      model: corner?.model || 'CORNER-MOD',
      category: 'Hardware',
      description: '90° Structural Angle',
      quantity: corners,
      price: corner?.price || 0,
      photo: getImageUrl(corner?.photo)
    })
  }

  if (layout === 'T-Shape' || layout === 'Rectangle') {
    const pol = findRealItem(a => (a.model || '').toString().toLowerCase().includes('polarity'))
    bom.push({
      model: pol?.model || 'POL-CHANGER',
      category: 'Electrical',
      description: 'Loop Phase Alignment Module',
      quantity: 1,
      price: pol?.price || 0,
      photo: getImageUrl(pol?.photo)
    })
  }

  // 3. Hardware
  const cap = findRealItem(a => (a.model || '').toString().toLowerCase().includes('end cap'), seriesPrefix)
  bom.push({ model: cap?.model || 'END-CAP', category: 'Hardware', description: 'End Closure', quantity: 2, price: cap?.price || 0, photo: getImageUrl(cap?.photo) })

  const live = findRealItem(a => (a.model || '').toString().toLowerCase().includes('live end'), seriesPrefix)
  bom.push({ model: live?.model || 'LIVE-FEED', category: 'Electrical', description: 'Mains Feed', quantity: 1, price: live?.price || 0, photo: getImageUrl(live?.photo) })

  // 4. Lights
  selectedLuminaires.forEach(s => {
    bom.push({ model: s.item.model, category: 'Luminaire', description: `${s.item.power}W Module`, quantity: s.quantity, price: s.item.price || 0, photo: getImageUrl(s.item.photo) })
  })

  // 5. Power
  const load = selectedLuminaires.reduce((a,c) => a + (c.item.power * c.quantity), 0)
  if (load > 0) {
    const driver = data.value.accessories.filter(a => (a.category||'').toString().toLowerCase().includes('driver')).sort((a,b) => (b.price||0) - (a.price||0))[0]
    if (driver) {
       const qtyP = Math.ceil((load + 20) / 180) // 200W limit with safety
       bom.push({ model: driver.model, category: 'Power', description: 'DC48V Power Supply', quantity: qtyP, price: driver.price || 0, photo: getImageUrl(driver.photo) })
    }
  }

  return bom
})

const totalLoad = computed(() => config.value.selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0))
const totalPrice = computed(() => calculatedBOM.value.reduce((a, c) => a + (c.price * c.quantity), 0))
const isOverloaded = computed(() => totalLoad.value > 200)

// Methods
const updateLamp = (lamp: Luminaire, delta: number) => {
  const existing = config.value.selectedLuminaires.find(s => s.item.model === lamp.model)
  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + delta)
    if (existing.quantity === 0) config.value.selectedLuminaires = config.value.selectedLuminaires.filter(x => x.item.model !== lamp.model)
  } else if (delta > 0) config.value.selectedLuminaires.push({ item: lamp, quantity: 1 })
}
const getLampQty = (m: string) => config.value.selectedLuminaires.find(s => s.item.model === m)?.quantity || 0

// Validation
const canProceed = computed(() => {
  if (currentStep.value === 3) return config.value.selectedLuminaires.length > 0
  if (currentStep.value === 4) return !isOverloaded.value
  return true
})
</script>

<template>
  <div class="h-screen bg-white text-zinc-800 font-sans flex overflow-hidden">
    
    <!-- Left Sidebar Stepper (Architectural Style) -->
    <aside class="w-[320px] bg-[#f9f9f9] border-r border-zinc-200 p-10 flex flex-col h-full shrink-0 relative z-20 shadow-sm">
      <div class="mb-12">
        <h1 class="text-lg font-bold tracking-tight text-[#f27b21]">ACOfusion S10</h1>
        <p class="text-[11px] text-zinc-400 font-medium uppercase tracking-widest mt-2 leading-relaxed">
          10mm Magnetic Configurator<br/>Plan your system intelligently.
        </p>
      </div>

      <div class="flex-1 space-y-2">
        <div v-for="(s, idx) in steps" :key="s.id" 
          class="relative pl-8 pb-10 last:pb-0"
          :class="idx <= currentStep ? 'opacity-100' : 'opacity-30'"
        >
          <!-- Stepper Line -->
          <div v-if="idx < steps.length - 1" class="absolute left-[11px] top-6 bottom-0 w-px border-l-2 border-dotted border-zinc-300"></div>
          
          <!-- Stepper Dot / Check -->
          <div class="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-10"
            :class="idx < currentStep ? 'bg-[#f27b21]' : (idx === currentStep ? 'bg-[#f27b21]/20 border-2 border-[#f27b21]' : 'bg-white border-2 border-zinc-200')">
            <Check v-if="idx < currentStep" class="text-white" size="14" stroke-width="4" />
            <div v-else-if="idx === currentStep" class="w-2 h-2 rounded-full bg-[#f27b21]"></div>
          </div>

          <!-- Step Info -->
          <div>
            <h4 class="text-[13px] font-bold" :class="idx <= currentStep ? 'text-zinc-900' : 'text-zinc-400'">{{ s.name }}</h4>
            <p v-if="idx === currentStep" class="text-[11px] text-zinc-500 mt-0.5 leading-tight">{{ s.desc }}</p>
          </div>
        </div>
      </div>

      <div class="pt-8 border-t border-zinc-200">
        <a href="#" class="text-[11px] text-[#f27b21] font-bold flex items-center gap-2 hover:underline">
          <HelpCircle size="14" /> Do you need help?
        </a>
      </div>
    </aside>

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col bg-white overflow-hidden relative">
      
      <!-- Interactive Content Area -->
      <main class="flex-1 p-12 lg:p-20 overflow-y-auto">
        <div class="max-w-4xl mx-auto w-full">
           
           <Transition name="fade" mode="out-in">
             <div :key="currentStep" class="space-y-12">
               
               <!-- PHASE 0: Mounting -->
               <div v-if="currentStep === 0" class="space-y-10">
                  <h2 class="text-3xl font-light text-zinc-900">Type of mounting</h2>
                  <div class="grid grid-cols-2 gap-6">
                    <button v-for="m in (['Surface', 'Trimless', 'Pendant', 'Recessed'] as MountingType[])" :key="m" @click="config.mounting = m"
                      class="flex flex-col items-center justify-center p-12 border-2 transition-all rounded-sm aspect-square bg-[#fbfbfb]"
                      :class="config.mounting === m ? 'border-[#f27b21] shadow-lg' : 'border-zinc-100 hover:border-zinc-300'">
                       <!-- Simplified Diagram Icons (Mimic Architectural cards) -->
                       <div class="w-32 h-32 bg-white border border-zinc-100 mb-8 rounded-sm shadow-inner flex items-center justify-center overflow-hidden">
                          <img :src="idx === 0 ? 'https://docs.google.com/uc?export=view&id=1P_L_E_Scene_Example' : ''" @error="e=>(e.target as any).style.display='none'" />
                          <Layers size="40" stroke-width="1.5" class="text-zinc-300" />
                       </div>
                       <span class="text-sm font-bold uppercase tracking-widest text-zinc-800">{{ m }}</span>
                       <div class="mt-4 w-4 h-4 rounded-full border border-zinc-300 flex items-center justify-center">
                          <div v-if="config.mounting === m" class="w-2.5 h-2.5 bg-[#f27b21] rounded-full"></div>
                       </div>
                    </button>
                  </div>
               </div>

               <!-- PHASE 1: Layout -->
               <div v-if="currentStep === 1" class="space-y-10 text-center">
                  <h2 class="text-3xl font-light text-zinc-900">Select System Topology</h2>
                  <div class="grid grid-cols-2 gap-6 text-left">
                    <button v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as LayoutType[])" :key="l" @click="config.layout = l"
                      class="p-10 border transition-all rounded-sm flex items-center gap-8 bg-[#fdfdfd]"
                      :class="config.layout === l ? 'border-[#f27b21] ring-1 ring-[#f27b21]' : 'border-zinc-100 hover:border-zinc-200'">
                       <div class="w-20 h-20 bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                          <LayoutIcon stroke-width="1" size="32" class="text-zinc-400" />
                       </div>
                       <div class="flex-1">
                          <h4 class="text-sm font-black uppercase text-zinc-800">{{ l }}</h4>
                          <p class="text-xs text-zinc-400 mt-1 italic">Structural Protocol Mapping</p>
                       </div>
                    </button>
                  </div>
               </div>

               <!-- PHASE 2: Length -->
               <div v-if="currentStep === 2" class="space-y-12">
                  <h2 class="text-3xl font-light text-zinc-900">Define Total Length</h2>
                  <div class="bg-[#f9f9f9] p-20 rounded-sm border border-zinc-100 text-center relative overflow-hidden">
                     <div class="text-[120px] font-black tracking-tighter text-zinc-400/20 absolute -top-8 left-8 select-none">M_ENG</div>
                     <div class="text-[160px] font-thin leading-none text-zinc-900 tabular-nums">
                        {{ config.totalLength }}<span class="text-4xl text-[#f27b21] ml-4 font-black">MM</span>
                     </div>
                     <div class="mt-20 max-w-xl mx-auto space-y-10">
                        <input type="range" min="500" max="10000" step="100" v-model.number="config.totalLength" class="w-full accent-[#f27b21]" />
                        <div class="flex justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                           <span>Min Extension (500mm)</span>
                           <span>Max Segment (10,000mm)</span>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- PHASE 3: Light Options -->
               <div v-if="currentStep === 3" class="space-y-10">
                  <div class="flex justify-between items-center border-b border-zinc-200 pb-10">
                    <h2 class="text-3xl font-light text-zinc-900 uppercase tracking-tighter italic">Luminaire Specification</h2>
                    <div v-if="config.selectedLuminaires.length === 0" class="text-[11px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">
                       <AlertTriangle size="14" /> Add modules to proceed
                    </div>
                  </div>
                  <div class="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-6 custom-scroll">
                     <div v-for="lamp in data.lamps" :key="lamp.model" class="p-6 border border-zinc-100 bg-[#fdfdfd] flex items-center gap-10 hover:border-zinc-300 transition-all rounded-sm shadow-sm group">
                        <div class="w-24 h-24 bg-white border border-zinc-50 rounded-sm relative overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                           <img :src="getImageUrl(lamp.photo)" class="w-full h-full object-contain" @error="e => (e.target as any).style.opacity='0.1'" />
                           <button @click="showSpecs = lamp" class="absolute bottom-2 right-2 p-1.5 bg-white shadow-md border border-zinc-100 text-zinc-400 hover:text-[#f27b21] transition-colors"><Maximize2 size="14" /></button>
                        </div>
                        <div class="flex-1">
                           <h4 class="text-sm font-black uppercase text-zinc-800 tracking-widest">{{ lamp.model }}</h4>
                           <p class="text-[11px] text-zinc-500 mt-2 italic">{{ lamp.power }}W S10 ULTRA-THIN DESIGN</p>
                        </div>
                        <div class="flex items-center gap-4 bg-white border border-zinc-100 p-3 rounded-sm shadow-sm">
                           <button @click="updateLamp(lamp, -1)" class="p-2 text-zinc-300 hover:text-[#f27b21] transition-colors"><Minus size="16" /></button>
                           <span class="text-xl font-mono font-black w-8 text-center">{{ getLampQty(lamp.model) }}</span>
                           <button @click="updateLamp(lamp, 1)" class="p-2 text-zinc-300 hover:text-[#f27b21] transition-colors"><Plus size="16" /></button>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- PHASE 4: PSU Setting -->
               <div v-if="currentStep === 4" class="space-y-12 text-center">
                  <h2 class="text-3xl font-light text-zinc-900">Power Supply Unit</h2>
                  <div :class="['p-16 border-2 transition-all rounded-sm', isOverloaded ? 'border-red-500 bg-red-50' : 'border-zinc-100 bg-[#f9f9f9]']">
                     <p class="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-6">Aggregate Project Load</p>
                     <div class="text-9xl font-thin tracking-tighter text-zinc-900 italic font-serif">{{ totalLoad.toFixed(0) }}<span class="text-2xl text-zinc-300 ml-4 font-black">W</span></div>
                     <div class="mt-12 h-1.5 bg-zinc-200 rounded-full overflow-hidden max-w-md mx-auto">
                        <div :class="['h-full transition-all duration-1000', isOverloaded ? 'bg-red-500' : 'bg-[#f27b21]']" :style="'width:'+ Math.min(100, (totalLoad/200)*100) + '%'"></div>
                     </div>
                     <p v-if="isOverloaded" class="text-red-600 text-xs font-bold mt-8 uppercase animate-pulse italic">! System Overload Detected - Safety Protocol Engaged</p>
                     <p v-else class="text-zinc-500 text-xs mt-8 uppercase tracking-widest font-medium">System Status: Optimal Structural Integrity</p>
                  </div>
                  <div class="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                    <div class="p-8 border border-zinc-100 bg-white text-left flex items-start gap-6 rounded-sm shadow-sm">
                       <Zap class="text-[#f27b21] shrink-0" size="24" />
                       <div>
                          <h4 class="text-[11px] font-black uppercase text-zinc-400 tracking-widest">Feed Location</h4>
                          <p class="text-sm font-bold text-zinc-800 mt-1 uppercase">S10 Live End (Standard Position)</p>
                       </div>
                    </div>
                    <div class="p-8 border border-zinc-100 bg-white text-left flex items-start gap-6 rounded-sm shadow-sm">
                       <Package class="text-zinc-300 shrink-0" size="24" />
                       <div>
                          <h4 class="text-[11px] font-black uppercase text-zinc-400 tracking-widest">Calculated Driver</h4>
                          <p class="text-sm font-bold text-zinc-800 mt-1 uppercase">{{ Math.ceil((totalLoad+20)/200) }}x Industrial 48V (200W)</p>
                       </div>
                    </div>
                  </div>
               </div>

               <!-- PHASE 5: SUMMARY -->
               <div v-if="currentStep === 5" class="space-y-12">
                  <header class="flex justify-between items-end border-b-2 border-zinc-900 pb-10">
                     <div>
                        <h2 class="text-5xl font-black tracking-tighter text-zinc-900 uppercase leading-none italic font-serif">Product Selection</h2>
                        <p class="text-[10px] uppercase font-black text-[#f27b21] mt-3 tracking-[0.5em]">Synchronised S10 Configuration Output</p>
                     </div>
                     <button @click="window.print()" class="px-10 py-5 bg-[#f27b21] text-white flex items-center gap-3 font-black uppercase tracking-widest text-[11px] rounded-sm hover:scale-105 active:scale-95 transition-all shadow-lg">
                        <Download size="16" /> Generate parts list
                     </button>
                  </header>

                  <div class="grid grid-cols-1 gap-px bg-zinc-200">
                    <div v-for="(item, idx) in calculatedBOM" :key="idx" class="bg-white p-8 group hover:bg-[#fbfbfb] transition-colors flex items-center gap-12">
                       <div class="w-20 h-20 bg-[#f9f9f9] border border-zinc-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner rounded-sm group-hover:scale-110 transition-transform">
                           <img v-if="item.photo" :src="item.photo" class="w-full h-full object-contain p-2" />
                           <Package v-else class="text-zinc-200" />
                       </div>
                       <div class="flex-1 min-w-0">
                          <h4 class="text-sm font-black uppercase text-zinc-900 tracking-widest leading-none">{{ item.model }}</h4>
                          <p class="text-[11px] font-bold text-zinc-400 mt-2 uppercase italic">{{ item.category }} | {{ item.description }}</p>
                       </div>
                       <div class="flex items-center gap-12">
                          <div class="text-right">
                             <p class="text-[10px] font-black text-zinc-300 uppercase leading-none mb-1">Quantity</p>
                             <p class="text-2xl font-mono font-black italic tracking-tighter">x{{ item.quantity }}</p>
                          </div>
                          <div class="text-right w-32 border-l border-zinc-100 pl-8">
                             <p class="text-[10px] font-black text-zinc-300 uppercase leading-none mb-1">Subtotal</p>
                             <p class="text-xl font-mono font-bold tracking-tight">£{{ (item.price * item.quantity).toFixed(0) }}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div class="bg-[#f27b21] p-16 text-white flex justify-between items-center rounded-sm shadow-2xl relative overflow-hidden">
                     <div class="absolute -top-10 -right-10 text-[180px] font-black text-white/5 select-none leading-none tracking-tighter">TOTAL</div>
                     <div class="relative z-10">
                        <p class="text-[11px] font-black uppercase tracking-[0.5em] text-white/60 mb-2 leading-none">Estimate Ex VAT</p>
                        <h3 class="text-7xl font-black tracking-tighter italic font-serif">£{{ totalPrice.toLocaleString('en-GB') }}</h3>
                     </div>
                     <div class="relative z-10 text-right space-y-2 uppercase font-black tracking-[0.2em] text-[10px]">
                        <p>Delivery: Pending Logic</p>
                        <p>Lead Time: 14-21 Days</p>
                     </div>
                  </div>
               </div>

             </div>
           </Transition>

        </div>
      </main>

      <!-- Footer Control Bar (Floating) -->
      <footer class="h-24 border-t border-zinc-100 bg-white/80 backdrop-blur-md px-12 flex items-center justify-between relative z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
         <button @click="currentStep--" v-if="currentStep > 0" class="px-8 py-4 border border-zinc-200 text-zinc-800 font-bold uppercase tracking-widest text-[11px] rounded-sm hover:bg-zinc-50 transition-colors flex items-center gap-3 active:scale-95 shadow-sm">
            <ChevronLeft size="16" /> Return
         </button>
         <div v-else></div>

         <button @click="currentStep++" :disabled="!canProceed || currentStep === steps.length - 1"
            class="px-12 py-4 bg-[#333] text-white font-bold uppercase tracking-[0.3em] text-[11px] rounded-sm hoverSpec:bg-black transition-all flex items-center gap-4 disabled:opacity-10 active:scale-95 shadow-xl">
            Next step <ChevronRight size="16" />
         </button>
      </footer>
    </div>

    <!-- Specs Modal (Architecture Detail) -->
    <Transition name="fade">
      <div v-if="showSpecs" class="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-white/95 backdrop-blur-xl" @click="showSpecs = null">
        <div class="max-w-6xl w-full flex bg-white border border-zinc-200 shadow-3xl rounded-sm overflow-hidden h-[80vh]">
           <div class="w-1/2 bg-[#f9f9f9] flex items-center justify-center p-20 relative">
              <div class="absolute top-10 left-10 text-[10px] font-black uppercase text-zinc-300 tracking-[0.5em] leading-none italic font-serif">Technical Render</div>
              <img :src="getImageUrl(showSpecs.photo)" class="w-full h-full object-contain mix-blend-multiply" />
           </div>
           <div class="flex-1 p-20 flex flex-col text-left relative overflow-hidden">
              <button @click="showSpecs = null" class="absolute top-10 right-10 text-zinc-400 hover:text-zinc-900 transition-colors uppercase font-black text-[10px] tracking-widest flex items-center gap-2">Close <X size="14"/></button>
              <div class="mb-12">
                 <h2 class="text-4xl font-black tracking-tighter uppercase mb-4 italic font-serif text-zinc-900 leading-none">{{ showSpecs.model }}</h2>
                 <div class="w-24 h-1.5 bg-[#f27b21]"></div>
              </div>
              <div class="flex-1 overflow-y-auto pr-10 custom-scroll space-y-10">
                 <div class="grid grid-cols-2 gap-12">
                   <div v-for="(v, k) in (showSpecs.specsData || {})" :key="k" class="border-b border-zinc-100 pb-4">
                      <span class="text-[10px] font-black uppercase tracking-widest text-[#f27b21] block mb-2">{{ k }}</span>
                      <span class="text-base font-bold text-zinc-800">{{ v }}</span>
                   </div>
                 </div>
                 <div class="pt-10 border-t border-zinc-50 italic text-zinc-400 text-xs leading-secondary">
                    All specifications are subject to systemic deviation based on DC48V rail alignment protocol. Engineering verification recommended before final procurement.
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Transition>

    <!-- Professional Print Template (B2B Blueprint) -->
    <div id="print-area" class="hidden print:block p-16 font-sans text-zinc-900 bg-white">
       <header class="flex justify-between items-end border-b-[3px] border-zinc-800 pb-10 mb-16">
          <div>
            <h1 class="text-8xl font-black uppercase italic font-serif tracking-tighter leading-none mb-4">ACOfusion</h1>
            <p class="text-sm font-black uppercase tracking-[0.5em] text-zinc-400">S10 System Engineering // Part Listing Export</p>
          </div>
          <div class="text-right">
             <p class="text-[10px] font-black uppercase text-zinc-300">Quotation Created:</p>
             <p class="text-2xl font-mono font-bold">{{ new Date().toLocaleDateString('en-GB') }}</p>
          </div>
       </header>

       <section class="grid grid-cols-2 gap-20 mb-20">
          <div class="space-y-6">
             <h4 class="text-xs font-black uppercase tracking-widest border-b border-zinc-100 pb-2 mb-4">Structural Parameters</h4>
             <div class="grid grid-cols-1 gap-2 text-sm italic font-serif font-bold">
                <p>Mounting: {{ config.mounting }}</p>
                <p>Topology: {{ config.layout }}</p>
                <p>Segment Length: {{ (config.totalLength).toFixed(0) }}MM</p>
                <p>Engineering Load: {{ totalLoad.toFixed(1) }}W</p>
             </div>
          </div>
          <div class="text-right border-l-[3px] border-[#f27b21] pl-20 flex flex-col justify-end">
             <p class="text-[11px] font-black uppercase text-zinc-400 tracking-widest mb-2">Total System Net Cost</p>
             <p class="text-9xl font-black tracking-tighter leading-none italic font-serif">£{{ totalPrice.toLocaleString('en-GB') }}</p>
          </div>
       </section>

       <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-[11px] font-black uppercase tracking-widest border-b-2 border-zinc-800 bg-zinc-50">
              <th class="py-10 px-8">Technical Model / Spec</th>
              <th class="py-10 px-8 text-center">Quantity</th>
              <th class="py-10 px-8 text-right">Unit Net</th>
              <th class="py-10 px-8 text-right">Aggregate Net</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 text-sm">
             <tr v-for="(item, idx) in calculatedBOM" :key="idx">
                <td class="py-10 px-8 flex items-center gap-10">
                   <div class="w-20 h-20 bg-zinc-50 rounded-sm border border-zinc-100 overflow-hidden shrink-0 flex items-center justify-center p-2">
                      <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full" />
                   </div>
                   <div>
                      <p class="text-base font-black uppercase italic font-serif leading-none mb-2">{{ item.model }}</p>
                      <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{{ item.category }} / {{ item.description }}</p>
                   </div>
                </td>
                <td class="py-10 px-8 text-center font-mono font-black text-2xl italic">x{{ item.quantity }}</td>
                <td class="py-10 px-8 text-right font-mono text-zinc-400">£{{ item.price.toFixed(2) }}</td>
                <td class="py-10 px-8 text-right font-mono font-black text-2xl italic">£{{ (item.price * item.quantity).toFixed(2) }}</td>
             </tr>
          </tbody>
       </table>
    </div>

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap');

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }

body { margin:0; background: white; -webkit-font-smoothing: antialiased; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

input[type=range] { -webkit-appearance: none; background: transparent; }
input[type=range]::-webkit-slider-runnable-track { height: 2px; background: #eee; border-radius: 10px; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #f27b21; cursor: pointer; margin-top: -8px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

@media print {
  body { background: white !important; }
  aside, footer, .Transition, #app > div:not(#print-area), button { display: none !important; }
  #print-area { display: block !important; position: static !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
  @page { size: A4 portrait; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
</style>
