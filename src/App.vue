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
const PSU_MAX_W = 160 // Threshold for multi-system split

// --- App State ---
const loading = ref(true)
const step = ref(0)
const showSpecs = ref<Luminaire | Accessory | null>(null)
const data = ref<{ lamps: Luminaire[], accessories: Accessory[] }>({ lamps: [], accessories: [] })

const config = ref<ConfigState>({
  mounting: 'Surface/Hanging',
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

  // 1. Series Mapping Strategy & Construction Alert
  let prefix = 'G-TL-A'; 
  let constructionAlert = '';
  
  if (mounting === 'Embedded concealed') {
    prefix = 'G-TL-D-B';
    constructionAlert = 'Construction Alert: Slot size must be 22-25mm';
  } else if (mounting === 'Batch ash track') {
    prefix = 'G-TL-D-C';
    constructionAlert = 'Construction Alert: Slot size must be 22-25mm';
  } else if (mounting === 'Spring fixed') {
    prefix = 'G-TL-D-D';
    constructionAlert = 'Construction Alert: Slot size must be 22-25mm';
  } else if (mounting === 'Ceiling soft film') {
    prefix = 'G-TL-D-E-RM';
  }

  const trackQty = Math.ceil(totalLength / TRACK_UNIT_MM);
  
  if (trackQty > 0) {
    // Structural Infrastructure
    items.push({
      ...findRealItem([prefix, '2M'], `S10 10mm ${mounting} Track (2.0m)`, 'Infrastructure', trackQty),
      alert: constructionAlert
    });
    
    // Rule 1: 1 Input Module and 2 End Plugs
    items.push(findRealItem([prefix, 'DT'], 'System End Cap (Pair)', 'Accessory_Required', 2));
    items.push(findRealItem(['G-TL-D-SRMK'], 'Internal Live Feed Module', 'Accessory_Required', 1));
  }

  // 2. Topology & Accessories
  let corners = 0;
  if (layout === 'L-Shape') corners = 1;
  else if (layout === 'T-Shape') corners = 2;
  else if (layout === 'Rectangle') corners = 4;

  if (corners > 0) {
    items.push(findRealItem([prefix, 'Corner'], '90° Structural Angle', 'Hardware', corners));
  }

  // Linear Connectors Calculation
  const straightJoints = Math.max(0, trackQty - 1 - corners);
  if (straightJoints > 0) {
    const connectorPrefix = (mounting === 'Surface/Hanging') ? 'G-TL-A' : 'G-TL-D';
    items.push(findRealItem([connectorPrefix, 'Connector'], 'Linear Splicing Module', 'Electrical', straightJoints));
  }

  // 3. Optical Modules with Parameter Mapping
  selectedLuminaires.forEach(sel => {
    let beamAngle = '120°';
    if (sel.item.model.includes('S36-1') || sel.item.model.includes('S36-2') || sel.item.model.includes('S36-3')) beamAngle = '38°';
    else if (sel.item.model.includes('S39')) beamAngle = '24°';
    else if (sel.item.model.includes('S43')) beamAngle = '180°';

    items.push({
      model: (sel.item.model || 'MODULE').toString().toUpperCase(),
      category: 'Luminaires',
      description: `${sel.item.power}W S10 Module (Beam: ${beamAngle})`,
      quantity: sel.quantity,
      price: sel.item.price || 0,
      photo: fixDriveUrl(sel.item.photo),
      specs: { 'Beam Angle': beamAngle, 'Efficiency': '85lm/W' }
    });
  });

  // 4. Power Load Algorithm (C)
  const totalWatts = selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0);
  if (totalWatts > 0) {
    if (totalWatts < 80) {
      items.push(findRealItem(['100W'], '48V 100W Integrated Power', 'Power_Integrated', 1));
    } else if (totalWatts < 160) {
      items.push(findRealItem(['200W'], '48V 200W Integrated Power', 'Power_Integrated', 1));
    } else {
      // Handled by isOverloaded alert in UI
    }
  }

  return items;
});

// Aggregate Helpers
const currentLoad = computed(() => config.value.selectedLuminaires.reduce((a, c) => a + (c.item.power * c.quantity), 0))
const totalPrice = computed(() => generatedBOM.value.reduce((a, c) => a + (c.price * c.quantity), 0))
const isOverloaded = computed(() => currentLoad.value >= 160)
const safeUpper = (val: any) => (val || '').toString().toUpperCase()

const validationStatus = computed(() => {
  const hasInputModule = generatedBOM.value.some(i => i.model.includes('SRMK') || i.description.includes('Feed'));
  const hasEndCaps = generatedBOM.value.find(i => i.model.includes('DT'))?.quantity >= 2;
  const { mounting } = config.value;
  
  return {
    power: currentLoad.value < 160 ? 'Optimal' : 'Caution: Overload',
    accessories: (hasInputModule && hasEndCaps) ? 'Complete' : 'Missing Hardware',
    mounting: mounting.includes('Surface') ? 'Surface Series' : 'Embedded Series (22-25mm)'
  };
});

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
      
    <div class="flex-1 flex flex-col lg:flex-row relative">
      
      <!-- Premium Nav Sidebar (Desktop) -->
      <aside class="hidden lg:flex w-[280px] bg-white border-r border-slate-100 p-12 flex-col shrink-0 relative z-30 shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
        <div class="mb-16">
          <h1 class="text-3xl font-black tracking-tighter text-[#0f172a] font-serif italic">ACO<span class="text-[#2563eb] font-sans not-italic">S10</span></h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Professional Lighting System</p>
        </div>

        <nav class="flex-1 space-y-6">
          <div v-for="(s, idx) in steps" :key="s.id" @click="idx <= step ? step = idx : null" 
             class="group cursor-pointer relative pl-12 pb-10 last:pb-0" :class="idx <= step ? 'opacity-100' : 'opacity-30'">
             <div v-if="idx < steps.length - 1" class="absolute left-[13px] top-8 bottom-0 w-px bg-slate-100 group-hover:bg-blue-100 transition-colors"></div>
             <div class="absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10"
                :class="idx < step ? 'bg-emerald-500 text-white' : (idx === step ? 'bg-[#2563eb] text-white ring-4 ring-blue-50' : 'bg-slate-50 text-slate-300')">
                <Check v-if="idx < step" size="14" stroke-width="4" />
                <span v-else class="text-[10px] font-black">{{ idx + 1 }}</span>
             </div>
             <h4 class="text-[13px] font-black uppercase tracking-widest transition-colors" :class="idx === step ? 'text-[#2563eb]' : 'text-slate-600'">{{ s.name }}</h4>
             <p class="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{{ s.desc }}</p>
          </div>
        </nav>

        <footer class="mt-auto pt-10 border-t border-slate-50">
           <div class="bg-blue-50 rounded-2xl p-6 mb-8">
              <p class="text-[9px] font-black uppercase text-[#2563eb] mb-2 tracking-widest">Support Line</p>
              <a href="tel:+44201234567" class="text-sm font-bold text-slate-900 block flex items-center gap-2 mb-1"><Smartphone size="14"/> +44 20 1234 567</a>
              <a href="mailto:expert@acofusion.com" class="text-[10px] font-medium text-slate-500 hover:text-[#2563eb] transition-colors">expert@acofusion.com</a>
           </div>
        </footer>
      </aside>

      <!-- Mobile Header -->
      <header class="lg:hidden bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
         <h1 class="text-xl font-black tracking-tighter text-[#0f172a] font-serif italic">ACO<span class="text-[#2563eb] font-sans not-italic">S10</span></h1>
         <div class="flex items-center gap-3">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {{ step + 1 }}/5</span>
            <div class="w-12 h-1 px-0.5 bg-slate-100 rounded-full overflow-hidden">
               <div class="h-full bg-[#2563eb]" :style="`width: ${((step+1)/5)*100}%`"></div>
            </div>
         </div>
      </header>

      <!-- Main Interaction Pane -->
      <main class="flex-1 bg-white text-slate-900 overflow-y-auto p-4 lg:p-20 relative z-20 print:hidden transition-all pb-32 lg:pb-20">
         <div class="max-w-5xl mx-auto flex flex-col min-h-full">
            
            <header class="hidden lg:flex justify-between items-center text-slate-300 font-mono text-[10px] uppercase tracking-[0.5em] mb-12">
               <span class="flex items-center gap-2"><div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> System Online</span>
               <div class="h-[1px] flex-1 mx-10 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-[#2563eb] transition-all duration-1000" :style="`width: ${((step+1)/steps.length)*100}%` "></div>
               </div>
               <span class="text-slate-900 font-bold">CONFIGURATION LOGIC 1.0</span>
            </header>

            <Transition name="slide" mode="out-in">
               <div :key="step" class="flex-1">
                  
                  <div v-if="step === 0" class="space-y-8 lg:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                     <div class="max-w-2xl">
                        <h2 class="text-5xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-none mb-6">Discovery <br/><span class="italic font-serif font-light text-slate-400">Mounting Environment</span></h2>
                        <p class="text-base lg:text-xl text-slate-500 font-medium leading-relaxed">Choose the installation method that fits your architectural vision. Every selection auto-configures the specific rail infrastructure.</p>
                     </div>
                     
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                        <button v-for="m in (['Surface/Hanging', 'Embedded concealed', 'Batch ash track', 'Spring fixed', 'Ceiling soft film'] as MountingType[])" :key="m" @click="config.mounting = m"
                           class="p-6 lg:p-10 border-2 rounded-[2.5rem] text-left transition-all relative overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1"
                           :class="config.mounting === m ? 'border-[#2563eb] bg-blue-50/20' : 'border-slate-50 hover:border-slate-100 bg-slate-50/30' ">
                           <div class="flex justify-between items-start mb-8">
                              <Layers class="w-10 h-10 lg:w-16 lg:h-16 transition-transform group-hover:scale-110" :class="config.mounting === m ? 'text-[#2563eb]' : 'text-slate-200' "/>
                              <div v-if="config.mounting === m" class="bg-[#2563eb] text-white p-2 rounded-full shadow-lg"><Check size="20" stroke-width="4"/></div>
                           </div>
                           <span class="block text-2xl lg:text-4xl font-black uppercase tracking-tighter text-slate-900">{{ m }}</span>
                           <p class="text-[10px] font-bold text-slate-400 uppercase mt-4 tracking-widest">Protocol Series Applied</p>
                           <div v-if="m.includes('concealed') || m.includes('ash') || m.includes('Spring')" 
                              class="mt-6 p-4 bg-amber-100/50 text-amber-700 text-[10px] font-bold uppercase rounded-2xl border border-amber-100 italic flex items-center gap-3">
                              <AlertTriangle size="14"/> 開槽尺寸: 22-25mm
                           </div>
                        </button>
                     </div>
                  </div>

                  <div v-if="step === 1" class="space-y-12">
                     <div class="max-w-2xl">
                        <h2 class="text-5xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-none mb-6">Select <br/><span class="italic font-serif font-light text-slate-400">Topology</span></h2>
                        <p class="text-base lg:text-xl text-slate-500 font-medium leading-relaxed">Determine the layout architecture. Required corner modules and joint connectors will be calculated automatically.</p>
                     </div>
                     <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
                        <button v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as LayoutType[])" :key="l" @click="config.layout = l"
                           class="p-6 lg:p-8 border-2 rounded-[3rem] flex items-center gap-6 lg:gap-10 transition-all hover:bg-slate-50 hover:border-slate-200"
                           :class="config.layout === l ? 'border-[#2563eb] bg-blue-50/20' : 'border-slate-50 bg-slate-50/30' ">
                           <div class="w-16 h-16 lg:w-24 lg:h-24 bg-white rounded-3xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm relative overflow-hidden">
                              <LayoutIcon class="relative z-10 transition-colors" :class="config.layout === l ? 'text-[#2563eb]' : 'text-slate-300'" size="32" />
                              <div v-if="config.layout === l" class="absolute inset-0 bg-blue-50/50 animate-pulse"></div>
                           </div>
                           <div class="text-left">
                              <span class="block text-xl lg:text-3xl font-black uppercase tracking-tighter text-slate-900">{{ l }}</span>
                              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Smart Topology Mapping</p>
                           </div>
                        </button>
                     </div>
                  </div>

                  <div v-if="step === 2" class="space-y-12 py-10 lg:py-20 text-center bg-slate-50/40 rounded-[4rem] border border-slate-100 shadow-inner px-6">
                     <h2 class="text-3xl lg:text-5xl font-black tracking-tighter text-slate-900 mb-6 uppercase">System Dimension</h2>
                     <div class="text-[80px] lg:text-[180px] font-thin text-slate-900 tabular-nums leading-none tracking-tighter italic font-serif flex items-center justify-center">
                        {{ config.totalLength }}<span class="text-2xl lg:text-4xl font-black text-[#2563eb] not-italic ml-4 lg:ml-8 mt-10 lg:mt-20">MM</span>
                     </div>
                     <div class="max-w-xl mx-auto px-6 lg:px-10 mt-12">
                        <input type="range" min="500" max="10000" step="100" v-model.number="config.totalLength" class="w-full accent-[#2563eb] h-1.5 bg-slate-200 rounded-full" />
                        <div class="flex justify-between text-[11px] font-black uppercase text-slate-400 mt-8 tracking-[0.3em]">
                           <span class="bg-white px-4 py-1 rounded-full border border-slate-100 shadow-sm">Min 500mm</span>
                           <span class="bg-white px-4 py-1 rounded-full border border-slate-100 shadow-sm">Max 10,000mm</span>
                        </div>
                     </div>
                  </div>

                  <div v-if="step === 3" class="space-y-12">
                     <header class="flex flex-col lg:flex-row lg:justify-between lg:items-end border-b border-slate-100 pb-10 mb-8 gap-4">
                        <div>
                           <h2 class="text-5xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-none">The <span class="text-[#2563eb]">Modules</span></h2>
                           <p class="text-slate-500 font-medium mt-4 text-lg">Select magnetic luminaires to integrate into your track configuration.</p>
                        </div>
                        <div v-if="config.selectedLuminaires.length === 0" class="bg-rose-50 text-rose-500 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-3 self-start animate-bounce border border-rose-100">
                           <AlertTriangle size="14"/> Selection Required
                        </div>
                     </header>

                     <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8 transition-all">
                        <div v-for="lamp in data.lamps" :key="lamp.model" class="p-4 lg:p-8 border border-slate-100 rounded-[3rem] bg-white transition-all hover:shadow-2xl hover:border-[#2563eb]/20 group shadow-sm">
                           <div class="aspect-[4/3] lg:aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden mb-6 lg:mb-8 relative border border-slate-50/50 group-hover:bg-blue-50/30 transition-colors">
                              <img :src="fixDriveUrl(lamp.photo)" @error="e=>(e.target as any).style.opacity='0.1'" class="w-full h-full object-contain p-8 lg:p-12 transition-transform duration-700 group-hover:scale-105" />
                              <button @click="showSpecs = lamp" class="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg text-slate-400 hover:text-[#2563eb] hover:bg-white transition-all"><Info size="18"/></button>
                           </div>
                           <div class="px-2">
                              <div class="flex justify-between items-start mb-2">
                                 <h3 class="text-xl lg:text-2xl font-black uppercase tracking-tighter text-slate-900">{{ safeUpper(lamp.model) }}</h3>
                                 <span class="text-lg font-mono font-black italic text-[#2563eb]">£{{ lamp.price }}</span>
                              </div>
                              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{{ lamp.power }}W Precision Optic</p>
                              
                              <div class="flex items-center justify-between p-2 bg-slate-50 rounded-full border border-slate-100 group-hover:bg-white transition-colors">
                                 <button @click="updateLamp(lamp, -1)" 
                                    class="w-12 h-12 flex items-center justify-center rounded-full text-slate-300 hover:text-slate-900 hover:bg-slate-200 transition-all">
                                    <Minus size="18"/>
                                 </button>
                                 <span class="text-3xl font-mono font-black italic text-slate-900">{{ getQty(lamp.model) }}</span>
                                 <button @click="updateLamp(lamp, 1)" 
                                    class="w-12 h-12 flex items-center justify-center rounded-full bg-[#0f172a] text-white hover:bg-[#2563eb] shadow-lg transition-all">
                                    <Plus size="18"/>
                                 </button>
                              </div>
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
                              <div class="flex items-center gap-3 mb-1">
                                <p class="text-lg font-black uppercase italic font-serif leading-none">{{ safeUpper(item.model) }}</p>
                                <span v-if="item.alert" class="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold uppercase rounded-md">{{ item.alert }}</span>
                              </div>
                              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{{ item.category }} | {{ item.description }}</p>
                              <div v-if="item.specs" class="flex gap-4 mt-2">
                                <span v-for="(v, k) in item.specs" :key="k" class="text-[9px] font-mono text-slate-400">[{{ k }}: {{ v }}]</span>
                              </div>
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

      <!-- Price Bar (Mobile Only Style) -->
      <div v-if="step < 4" class="lg:hidden fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-10">
         <div class="bg-[#0f172a] text-white p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex justify-between items-center border border-white/10 backdrop-blur-xl">
            <div>
               <p class="text-[8px] font-black uppercase text-white/40 tracking-widest">Running Total</p>
               <span class="text-2xl font-mono font-black italic">£{{ totalPrice.toLocaleString() }}</span>
            </div>
            <button @click="step++" :disabled="step === 3 && config.selectedLuminaires.length === 0"
               class="px-8 py-3 bg-[#2563eb] rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-30">
               Next <ChevronRight size="16"/>
            </button>
         </div>
      </div>

      <!-- Right Pane: Summary Workspace (Desktop 32%) -->
      <aside v-if="!loading" class="hidden xl:flex w-[32%] bg-slate-50/50 border-l border-slate-100 p-12 flex-col h-screen sticky top-0 shrink-0 print:hidden overflow-hidden">
         <div class="flex justify-between items-center mb-12">
            <div>
               <h4 class="text-[12px] font-black uppercase tracking-[0.4em] text-slate-900">Config Summary</h4>
               <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">S10 Magnetic Ecosystem</p>
            </div>
            <div class="bg-white p-2 rounded-lg border border-slate-100 shadow-sm"><Layers size="16" class="text-slate-400"/></div>
         </div>

         <div class="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            <div v-if="generatedBOM.length === 0" class="h-full flex flex-col items-center justify-center p-20 text-center opacity-10">
               <Zap size="80" class="text-slate-900"/>
               <p class="text-[10px] uppercase font-black tracking-[0.4em] mt-8 italic">Specify Rails to begin</p>
            </div>
            <div v-for="(item, i) in generatedBOM" :key="i" class="flex gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-right-10 duration-500">
               <div class="w-12 h-12 bg-slate-50 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center p-1">
                  <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain" />
               </div>
               <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline">
                     <span class="text-[11px] font-black uppercase text-slate-900 truncate">{{ safeUpper(item.model) }}</span>
                     <span class="text-xs font-mono font-black italic text-[#2563eb]">x{{ item.quantity }}</span>
                  </div>
                  <p class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 truncate">{{ item.description }}</p>
               </div>
            </div>
         </div>

         <div class="mt-12 bg-[#0f172a] rounded-[3.5rem] p-10 text-white relative overflow-hidden group shadow-3xl">
            <div class="absolute inset-0 bg-[#2563eb] translate-y-[101%] group-hover:translate-y-0 transition-transform duration-700 z-0 opacity-10"></div>
            <div class="relative z-10">
               <!-- Sales Validation View -->
               <div class="space-y-4 mb-10">
                  <div class="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-3">
                     <span>Technical Verification</span>
                     <span class="text-emerald-400 flex items-center gap-2"><ShieldCheck size="12"/> Active</span>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                     <div>
                        <p class="text-[7px] font-black uppercase text-white/20 mb-1">Max Capacity</p>
                        <p class="text-[10px] font-mono font-bold" :class="isOverloaded ? 'text-red-400' : 'text-white' ">{{ currentLoad.toFixed(0) }}W / 160W</p>
                     </div>
                     <div class="text-right">
                        <p class="text-[7px] font-black uppercase text-white/20 mb-1">Parts Count</p>
                        <p class="text-[10px] font-mono font-bold">{{ generatedBOM.reduce((a,c)=>a+c.quantity, 0) }} SKUs</p>
                     </div>
                  </div>
               </div>

               <div v-if="isOverloaded" class="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-[9px] font-black uppercase italic text-red-400 leading-relaxed">
                  ⚠️ Power Budget Exceeded. <br/>Consider adding a second feed unit.
               </div>

               <div class="flex justify-between items-end">
                  <div>
                    <p class="text-[10px] font-black uppercase text-white/40 mb-2">Estimated Investment</p>
                    <div class="text-6xl font-black tracking-tighter italic font-serif leading-none">£{{ totalPrice.toLocaleString() }}</div>
                  </div>
                  <ChevronRight class="mb-2 text-white/20 group-hover:translate-x-2 transition-transform" size="32"/>
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
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@500;700&display=swap');

:root {
  --primary: #2563eb;
  --bg-main: #ffffff;
  --bg-sub: #f8fafc;
  --text-main: #0f172a;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

body { 
  margin: 0; 
  background: var(--bg-main); 
  color: var(--text-main);
  -webkit-font-smoothing: antialiased; 
  letter-spacing: -0.01em; 
  font-family: 'Inter', sans-serif;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from { opacity: 0; transform: translateY(20px); }
.slide-leave-to { opacity: 0; transform: translateY(-20px); }

input[type=range] { -webkit-appearance: none; background: transparent; }
input[type=range]::-webkit-slider-runnable-track { height: 2px; background: #f1f5f9; border-radius: 2px; }
input[type=range]::-webkit-slider-thumb { 
  -webkit-appearance: none; 
  height: 24px; width: 24px; 
  border-radius: 50%; 
  background: white; 
  cursor: pointer; 
  margin-top: -11px; 
  border: 2px solid var(--primary); 
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); 
  transition: all 0.2s ease;
}
input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.1); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25); }

@media print {
  body { background: white !important; overflow: visible !important; }
  aside, footer, .Transition, #app > div:not(#print-area), button, header { display: none !important; }
  #print-area { display: block !important; position: static !important; width: 100% !important; margin: 0 !important; padding: 40px !important; }
  @page { size: A4 portrait; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}

/* Custom Utilities */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}
</style>

