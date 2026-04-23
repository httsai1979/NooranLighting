<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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
  Layers,
  Layout as LayoutIcon,
  X,
  ShieldCheck,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle,
  ArrowRight,
  BookOpen,
  Image as ImageIcon,
  Compass,
  ArrowUpRight,
  Menu
} from 'lucide-vue-next'
import type { Luminaire, Accessory, MountingType, LayoutType, ConfigState, BOMItem } from './types'

// --- System Configuration ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzppxxh05KJPZzDHlTK6_so2ILiMCsfkeF3btexeVyZ7zoT-04ksNg4lwSGNkZxUSVkdQ/exec'
const TRACK_UNIT_MM = 2000 
const PSU_MAX_W = 160 // Threshold for multi-system split

// --- App State ---
const loading = ref(true)
const currentView = ref<'LANDING' | 'PROJECTS' | 'SOLUTIONS' | 'CONFIGURATOR'>('LANDING')
const step = ref(0)
const showSpecs = ref<Luminaire | Accessory | null>(null)
const data = ref<{ lamps: Luminaire[], accessories: Accessory[] }>({ lamps: [], accessories: [] })
const mobileMenuOpen = ref(false)

const config = ref<ConfigState>({
  mounting: 'Surface/Hanging',
  layout: 'Straight',
  totalLength: 2000, 
  selectedLuminaires: []
})

// --- Mock Business Data ---
const projects = [
  { id: 1, name: 'London Art Gallery', location: 'Mayfair, UK', image: 'https://images.unsplash.com/photo-1544413164-320092671092?auto=format&fit=crop&q=80', description: 'Precision accent lighting for high-value canvases.' },
  { id: 2, name: 'Minimalist Residence', location: 'Zurich, CH', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80', description: 'Discrete track integration for open-plan living.' },
  { id: 3, name: 'Executive Workspace', location: 'London City', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80', description: 'Balanced flood and spot distribution for high productivity.' }
]

const installationGuides = [
  { title: 'S10 Mounting Protocol', desc: 'Step-by-step surface and recessed installation.', category: 'Manual' },
  { title: 'Electrical Load Logic', desc: 'Configuring N+1 safety redundancy for 48V systems.', category: 'Engineering' }
]

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

// --- Persistence Logic ---
const saveToLocal = () => {
  localStorage.setItem('aco_config', JSON.stringify(config.value))
}

watch(config, saveToLocal, { deep: true })

// --- SEO & Meta Title Engine ---
watch([currentView, step], () => {
  const titles: Record<string, string> = {
    LANDING: 'ACOfusion | Home of S10 Magnetic Track Architecture',
    PROJECTS: 'Architectural Impact | ACOfusion Portfolios',
    SOLUTIONS: 'Technical Registry & Manuals | ACOfusion S10',
    CONFIGURATOR: `S10 Simulator - Step ${step.value + 1} | ACOfusion`
  }
  document.title = titles[currentView.value] || 'ACOfusion Lighting'
}, { immediate: true })

// --- Data Synchronisation ---
onMounted(async () => {
  // Load Persistence
  const saved = localStorage.getItem('aco_config')
  if (saved) {
    try { config.value = JSON.parse(saved) } catch(e) {}
  }

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
const startConfiguration = () => {
  currentView.value = 'CONFIGURATOR'
  step.value = 0
}

const navigate = (view: any) => {
  currentView.value = view
  mobileMenuOpen.value = false
  window.scrollTo(0, 0)
}
</script>


<template>
  <div class="h-screen bg-white text-slate-900 font-sans flex overflow-hidden selection:bg-[#2563eb] selection:text-white">
    
    <!-- Premium Experience Loading -->
    <Transition name="fade">
      <div v-if="loading" class="fixed inset-0 z-[500] bg-white flex flex-col items-center justify-center">
         <div class="w-20 h-20 border-2 border-slate-50 border-t-[#2563eb] rounded-full animate-spin"></div>
         <p class="mt-12 text-[10px] font-black uppercase tracking-[0.8em] text-slate-300 animate-pulse">Aco Innovation Protocol</p>
      </div>
    </Transitio    <!-- Global Navigation Header -->
    <header class="fixed top-0 left-0 right-0 z-[400] bg-white/80 backdrop-blur-xl border-b border-slate-50 px-6 lg:px-12 py-4 flex justify-between items-center">
       <div class="flex items-center gap-12">
          <button @click="navigate('LANDING')" class="flex flex-col cursor-pointer">
             <h1 class="text-2xl font-black tracking-tighter text-[#0f172a] font-serif italic leading-none">ACO<span class="text-[#2563eb] font-sans not-italic">fusion</span></h1>
             <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lighting Architecture</p>
          </button>

          <nav class="hidden lg:flex items-center gap-10">
             <button v-for="v in (['PROJECTS', 'SOLUTIONS'] as const)" :key="v" @click="navigate(v)"
                class="text-[11px] font-black uppercase tracking-widest transition-colors"
                :class="currentView === v ? 'text-[#2563eb]' : 'text-slate-400 hover:text-slate-900'">{{ v }}</button>
          </nav>
       </div>

       <div class="flex items-center gap-6">
          <button @click="startConfiguration" 
             class="hidden sm:flex items-center gap-3 px-8 py-3 bg-[#0f172a] text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#2563eb] transition-all group">
             System Configuration <ArrowRight size="14" class="group-hover:translate-x-1 transition-transform"/>
          </button>
          <button @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden p-2 text-slate-900"><Menu/></button>
       </div>
    </header>

    <!-- Mobile Navigation Overlay -->
    <Transition name="fade">
       <div v-if="mobileMenuOpen" class="fixed inset-0 z-[500] bg-white p-10 flex flex-col pt-32">
          <button v-for="v in (['LANDING', 'PROJECTS', 'SOLUTIONS', 'CONFIGURATOR'] as const)" :key="v" @click="navigate(v)"
             class="text-4xl font-black mb-8 border-b border-slate-50 pb-4 text-left italic font-serif">{{ v }}</button>
          <button @click="mobileMenuOpen = false" class="absolute top-8 right-8 p-4 bg-slate-50 rounded-full"><X/></button>
       </div>
    </Transition>

    <div class="flex-1 flex flex-col pt-20 overflow-y-auto">
       
       <!-- VIEW: LANDING -->
       <div v-if="currentView === 'LANDING'" class="animate-in fade-in duration-1000">
          <!-- Hero Section -->
          <section class="min-h-[90vh] flex flex-col justify-center px-6 lg:px-20 relative overflow-hidden bg-slate-50">
             <div class="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-20">
                <div class="space-y-10 z-10">
                   <div class="inline-flex items-center gap-4 bg-white px-5 py-2 rounded-full border border-slate-100 shadow-sm">
                      <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span class="text-[10px] font-black uppercase tracking-widest text-[#2563eb]">S10 Magnetic Track System 2026</span>
                   </div>
                   <h2 class="text-6xl lg:text-[100px] font-black tracking-tighter text-[#0f172a] leading-[0.9] italic font-serif">
                      Light is the <br/>Fourth <span class="text-[#2563eb]">Dimension</span>.
                   </h2>
                   <p class="text-xl lg:text-3xl text-slate-400 font-light max-w-xl leading-relaxed">
                      Architectural precision integrated into a 10mm ultra-thin magnetic interface. Engineered in the UK for global standards.
                   </p>
                   <div class="flex flex-col sm:flex-row gap-6">
                      <button @click="startConfiguration" class="px-12 py-6 bg-[#0f172a] text-white rounded-full font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl hover:bg-[#2563eb] transition-all">Start Your Simulation</button>
                      <button @click="navigate('PROJECTS')" class="px-12 py-6 border-2 border-slate-200 rounded-full font-black uppercase tracking-[0.2em] text-[12px] hover:bg-white transition-all">View Portfolios</button>
                   </div>
                </div>
                <div class="relative group">
                   <div class="aspect-[4/5] bg-white rounded-[4rem] overflow-hidden shadow-3xl border-[20px] border-white relative">
                      <img src="https://images.unsplash.com/photo-1544413164-320092671092?auto=format&fit=crop&q=80" class="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" />
                      <div class="absolute inset-0 bg-gradient-to-t from-[#0f172a]/60 to-transparent"></div>
                      <div class="absolute bottom-12 left-12 text-white">
                         <p class="text-[10px] font-black uppercase tracking-[0.5em] mb-4">Featured Project</p>
                         <h4 class="text-4xl font-serif italic font-black">Modernist Residence</h4>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          <!-- Core Philosophy Section -->
          <section class="py-32 px-6 lg:px-20 bg-white">
             <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20">
                <div v-for="i in [{t:'Architectural Integrity', d:'Discrete integration that respects structural aesthetics.', i:Layers}, {t:'Precision Optics', d:'Calculated beam distribution for absolute lighting control.', i:ShieldCheck}, {t:'Loop Safety Logic', d:'Advanced electrical protocol for system-wide stability.', i:Zap}]" :key="i.t" class="space-y-6">
                   <div class="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-3xl"><component :is="i.i" class="text-[#2563eb]"/></div>
                   <h3 class="text-2xl font-black uppercase tracking-tight text-[#0f172a]">{{ i.t }}</h3>
                   <p class="text-slate-400 leading-relaxed font-medium">{{ i.d }}</p>
                </div>
             </div>
          </section>
       </div>

       <!-- VIEW: PROJECTS -->
       <div v-if="currentView === 'PROJECTS'" class="animate-in slide-in-from-bottom-10 duration-1000 py-20 px-6 lg:px-20">
          <header class="max-w-4xl mb-24">
             <h2 class="text-7xl lg:text-[120px] font-black tracking-tighter italic font-serif mb-8 text-[#0f172a]">The <span class="text-[#2563eb]">Impact</span>.</h2>
             <p class="text-2xl text-slate-400 font-light leading-relaxed">Cross-sectional analysis of architectural lighting implementations. S10 series protocol in elite environments.</p>
          </header>

          <!-- Comparative Architecture (Before/After) -->
          <section class="mb-32">
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-[#0f172a] rounded-[5rem] overflow-hidden group">
                <div class="relative overflow-hidden aspect-video">
                   <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" class="w-full h-full object-cover grayscale opacity-40" />
                   <div class="absolute inset-0 flex items-center justify-center">
                      <span class="px-6 py-2 bg-white/10 backdrop-blur text-[10px] font-black uppercase text-white tracking-[0.5em] border border-white/20 rounded-full">Structural Skeleton</span>
                   </div>
                </div>
                <div class="relative overflow-hidden aspect-video">
                   <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" class="w-full h-full object-cover" />
                   <div class="absolute inset-0 flex items-center justify-center">
                      <span class="px-6 py-2 bg-[#2563eb] text-[10px] font-black uppercase text-white tracking-[0.5em] rounded-full shadow-2xl">S10 Activated</span>
                   </div>
                </div>
             </div>
             <p class="mt-8 text-center text-slate-400 text-[11px] font-black uppercase tracking-[0.8em]">Visual Synchronisation Module</p>
          </section>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             <div v-for="p in projects" :key="p.id" class="group cursor-pointer">
                <div class="aspect-[16/10] bg-slate-100 rounded-[3rem] overflow-hidden mb-8 relative border border-slate-100">
                   <img :src="p.image" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                   <div class="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest">{{ p.location }}</div>
                </div>
                <h4 class="text-2xl font-black uppercase tracking-tight text-[#0f172a] mb-2">{{ p.name }}</h4>
                <p class="text-slate-400 font-medium leading-relaxed">{{ p.description }}</p>
             </div>
          </div>
       </div>


       <!-- VIEW: SOLUTIONS (Engineering & Manuals) -->
       <div v-if="currentView === 'SOLUTIONS'" class="animate-in slide-in-from-bottom-10 duration-1000 min-h-screen bg-slate-50 py-20 px-6 lg:px-20">
          <div class="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
             <aside class="w-full lg:w-1/3 space-y-12">
                <h2 class="text-6xl font-black tracking-tighter italic font-serif text-[#0f172a]">Technical Hub.</h2>
                <nav class="space-y-4">
                   <button class="w-full text-left p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group">
                      <span class="text-[12px] font-black uppercase tracking-widest text-slate-900">S10 Installation Manual</span>
                      <Download size="18" class="text-[#2563eb] group-hover:translate-y-1 transition-transform"/>
                   </button>
                   <button class="w-full text-left p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group">
                      <span class="text-[12px] font-black uppercase tracking-widest text-[#2563eb]">Engineering Specs (PDF)</span>
                      <BookOpen size="18" class="text-[#2563eb]"/>
                   </button>
                </nav>
             </aside>
             <main class="flex-1 space-y-10">
                <section v-for="g in installationGuides" :key="g.title" class="bg-white p-12 lg:p-20 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
                   <div class="absolute -right-20 -top-20 text-[200px] font-black text-slate-50 italic select-none pointer-events-none">{{ g.category.charAt(0) }}</div>
                   <span class="px-4 py-2 bg-blue-50 text-[#2563eb] rounded-full text-[10px] font-black uppercase tracking-widest mb-8 inline-block">{{ g.category }}</span>
                   <h3 class="text-4xl font-black text-[#0f172a] mb-6 uppercase tracking-tighter">{{ g.title }}</h3>
                   <p class="text-xl text-slate-400 font-light leading-relaxed max-w-xl">{{ g.desc }}</p>
                   <button class="mt-12 flex items-center gap-4 text-slate-9 stones text-[12px] font-black uppercase tracking-widest hover:text-[#2563eb] transition-colors">Read Protocol <ArrowRight size="16"/></button>
                </section>
             </main>
          </div>
       </div>

       <!-- VIEW: CONFIGURATOR (Original App) -->
       <div v-if="currentView === 'CONFIGURATOR'" class="flex-1 flex flex-col lg:flex-row relative animate-in fade-in duration-500 h-[calc(100vh-80px)] overflow-hidden">
          
          <!-- Premium Nav Sidebar (Desktop) -->
          <aside class="hidden lg:flex w-[280px] bg-white border-r border-slate-100 p-12 flex-col shrink-0 relative z-30 shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
            <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-10">Logic Steps</h4>

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
            <button @click="navigate('LANDING')" class="mt-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"><X size="14"/> Exit Simulator</button>
          </aside>

          <!-- Main Interaction Pane -->
          <main class="flex-1 bg-white text-slate-900 overflow-y-auto p-4 lg:p-20 relative z-20 print:hidden transition-all pb-32 lg:pb-20 scrollbar-hide">
             <div class="max-w-5xl mx-auto flex flex-col min-h-full">
                
                <header class="hidden lg:flex justify-between items-center text-slate-300 font-mono text-[10px] uppercase tracking-[0.5em] mb-12">
                   <span class="flex items-center gap-2">SYS:{{ config.mounting.split(' ')[0].toUpperCase() }}_PROTO</span>
                   <div class="h-[1px] flex-1 mx-10 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-[#2563eb] transition-all duration-1000" :style="`width: ${((step+1)/steps.length)*100}%` "></div>
                   </div>
                   <span class="text-slate-900 font-bold">{{ step + 1 }} / {{ steps.length }}</span>
                </header>

                <Transition name="slide" mode="out-in">
                   <div :key="step" class="flex-1">
                      
                      <div v-if="step === 0" class="space-y-8 lg:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                         <div class="max-w-2xl">
                            <h2 class="text-5xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-none mb-6">Discovery <br/><span class="italic font-serif font-light text-slate-400">Environment</span></h2>
                         </div>
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                            <button v-for="m in (['Surface/Hanging', 'Embedded concealed', 'Batch ash track', 'Spring fixed', 'Ceiling soft film'] as MountingType[])" :key="m" @click="config.mounting = m"
                               class="p-6 lg:p-10 border-2 rounded-[2.5rem] text-left transition-all relative overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1"
                               :class="config.mounting === m ? 'border-[#2563eb] bg-blue-50/20' : 'border-slate-50 hover:border-slate-100 bg-slate-50/30' ">
                               <Layers class="w-10 h-10 lg:w-16 lg:h-16 mb-10 transition-transform group-hover:scale-110" :class="config.mounting === m ? 'text-[#2563eb]' : 'text-slate-200' "/>
                               <span class="block text-2xl lg:text-4xl font-black uppercase tracking-tighter text-slate-900">{{ m }}</span>
                               <div v-if="m.includes('concealed') || m.includes('ash') || m.includes('Spring')" class="mt-4 text-amber-600 text-[10px] font-bold uppercase italic flex items-center gap-2"><AlertTriangle size="12"/> 22-25mm Slot</div>
                            </button>
                         </div>
                      </div>

                      <div v-if="step === 1" class="space-y-12">
                         <h2 class="text-5xl lg:text-[100px] font-black tracking-tighter text-slate-900 leading-none italic font-serif mb-12">Topology.</h2>
                         <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
                            <button v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as LayoutType[])" :key="l" @click="config.layout = l"
                               class="p-6 lg:p-8 border-2 rounded-[3rem] flex items-center gap-6 lg:gap-10 transition-all hover:bg-slate-50 hover:border-slate-200"
                               :class="config.layout === l ? 'border-[#2563eb] bg-blue-50/20' : 'border-slate-50 bg-slate-50/30' ">
                               <div class="w-16 h-16 lg:w-24 lg:h-24 bg-white rounded-3xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm relative overflow-hidden">
                                  <LayoutIcon class="relative z-10 transition-colors" :class="config.layout === l ? 'text-[#2563eb]' : 'text-slate-300'" size="32" />
                               </div>
                               <span class="text-xl lg:text-3xl font-black uppercase tracking-tighter text-slate-900">{{ l }}</span>
                            </button>
                         </div>
                      </div>

                      <div v-if="step === 2" class="space-y-12 py-10 lg:py-20 text-center bg-slate-50/40 rounded-[4rem] border border-slate-100 shadow-inner px-6">
                         <div class="text-[80px] lg:text-[180px] font-thin text-slate-900 tabular-nums leading-none tracking-tighter italic font-serif">
                            {{ config.totalLength }}<span class="text-2xl lg:text-4xl font-black text-[#2563eb] not-italic ml-4 inline-block -translate-y-8">MM</span>
                         </div>
                         <div class="max-w-xl mx-auto px-6 lg:px-10 mt-12">
                            <input type="range" min="500" max="10000" step="100" v-model.number="config.totalLength" class="w-full accent-[#2563eb] h-1.5 bg-slate-200 rounded-full" />
                         </div>
                      </div>

                      <div v-if="step === 3" class="space-y-12">
                         <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8 transition-all">
                            <div v-for="lamp in data.lamps" :key="lamp.model" class="p-4 lg:p-8 border border-slate-100 rounded-[3rem] bg-white shadow-sm hover:shadow-2xl transition-all">
                               <div class="aspect-[4/3] bg-slate-50 rounded-[2.5rem] overflow-hidden mb-8 relative">
                                  <img :src="fixDriveUrl(lamp.photo)" class="w-full h-full object-contain p-8 lg:p-12 transition-transform duration-700 hover:scale-105" />
                                  <button @click="showSpecs = lamp" class="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-[#2563eb] shadow-xl transition-all"><Info size="18"/></button>
                               </div>
                               <div class="px-2">
                                  <div class="flex justify-between items-start mb-2">
                                     <h3 class="text-xl lg:text-2xl font-black uppercase tracking-tighter text-slate-900">{{ safeUpper(lamp.model) }}</h3>
                                     <span class="text-lg font-mono font-black italic text-[#2563eb]">£{{ lamp.price }}</span>
                                  </div>
                                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">{{ lamp.power }}W Engineering Module</p>
                                  <div class="flex items-center justify-between p-2 bg-slate-50 rounded-full border border-slate-100">
                                     <button @click="updateLamp(lamp, -1)" class="w-12 h-12 flex items-center justify-center rounded-full text-slate-300 hover:text-slate-900 hover:bg-slate-200 transition-all"><Minus size="18"/></button>
                                     <span class="text-3xl font-mono font-black italic text-slate-900">{{ getQty(lamp.model) }}</span>
                                     <button @click="updateLamp(lamp, 1)" class="w-12 h-12 flex items-center justify-center rounded-full bg-[#0f172a] text-white hover:bg-[#2563eb] shadow-lg transition-all"><Plus size="18"/></button>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div v-if="step === 4" class="space-y-12 animate-in slide-in-from-bottom-10 duration-700">
                         <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-12">
                            <h2 class="text-6xl lg:text-[100px] font-black italic font-serif text-[#0f172a] tracking-tighter leading-none mb-0">The <span class="text-[#2563eb]">BOM</span>.</h2>
                            <div class="bg-blue-50 text-[#2563eb] px-10 py-5 rounded-[2rem] border border-blue-100">
                               <p class="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Session Identification</p>
                               <span class="text-lg font-mono font-black italic">ACO-{{ Date.now().toString(36).toUpperCase() }}</span>
                            </div>
                         </div>

                         <!-- High-Density BOM Architecture (REFINED) -->
                         <div class="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-xl">
                            <table class="w-full text-left border-collapse">
                               <thead class="bg-slate-50/50 border-b border-slate-100">
                                  <tr class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                                     <th class="py-6 px-10">Ref</th>
                                     <th class="py-6 px-10">Engineering Component</th>
                                     <th class="py-6 px-10 text-center">Qty</th>
                                     <th class="py-6 px-10 text-right">Net Subtotal</th>
                                  </tr>
                               </thead>
                               <tbody>
                                  <tr v-for="(item, i) in generatedBOM" :key="i" class="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors group">
                                     <td class="py-6 px-10">
                                        <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center p-2 group-hover:bg-white transition-colors border border-slate-50">
                                           <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain mix-blend-multiply"/>
                                           <Package v-else class="text-slate-200" size="20"/>
                                        </div>
                                     </td>
                                     <td class="py-6 px-10">
                                        <div class="flex items-center gap-3 mb-1">
                                           <span class="text-sm font-black text-[#0f172a] uppercase tracking-tighter">{{ safeUpper(item.model) }}</span>
                                           <span v-if="item.alert" class="bg-amber-100 text-amber-700 text-[7px] font-black uppercase px-2 py-0.5 rounded italic">{{ item.alert }}</span>
                                        </div>
                                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ item.description }}</p>
                                     </td>
                                     <td class="py-6 px-10 text-center">
                                        <span class="text-2xl font-mono font-black italic text-slate-100 group-hover:text-slate-900 transition-colors">x{{ item.quantity }}</span>
                                     </td>
                                     <td class="py-6 px-10 text-right">
                                        <span class="text-lg font-mono font-black italic text-[#2563eb]">£{{ (item.price * item.quantity).toLocaleString() }}</span>
                                     </td>
                                  </tr>
                               </tbody>
                            </table>
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
                         Proceed <ChevronRight size="20"/>
                      </button>
                      <button v-else @click="window.print()" class="px-20 py-6 bg-[#2563eb] text-white rounded-full flex gap-5 items-center font-black uppercase tracking-[0.4em] text-[11px] shadow-3xl hover:shadow-blue-500/50 transition-all active:scale-95">
                         <Download size="20"/> Export B2B Proposal
                      </button>
                   </div>
                </footer>
             </div>
          </main>

          <!-- Right Pane: Summary Workspace (Desktop 32%) -->
          <aside v-if="!loading" class="hidden xl:flex w-[32%] bg-slate-50/50 border-l border-slate-100 p-12 flex-col h-screen sticky top-0 shrink-0 print:hidden overflow-hidden">
             <div class="flex justify-between items-center mb-12">
                <div>
                   <h4 class="text-[12px] font-black uppercase tracking-[0.4em] text-slate-900">Live Analysis</h4>
                   <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">S10 Engineering Core</p>
                </div>
                <Compass class="text-slate-300" size="24"/>
             </div>

             <div class="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <div v-for="(item, i) in generatedBOM" :key="i" class="flex gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm transition-all hover:translate-x-2">
                   <div class="w-12 h-12 bg-slate-50 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center p-1">
                      <img v-if="item.photo" :src="item.photo" class="max-w-full max-h-full object-contain" />
                   </div>
                   <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-baseline">
                         <span class="text-[10px] font-black uppercase text-slate-900 truncate">{{ safeUpper(item.model) }}</span>
                         <span class="text-xs font-mono font-black italic text-[#2563eb]">x{{ item.quantity }}</span>
                      </div>
                      <p class="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 truncate">{{ item.description }}</p>
                   </div>
                </div>
             </div>

             <div class="mt-12 bg-[#0f172a] rounded-[3.5rem] p-10 text-white relative overflow-hidden group shadow-3xl">
                <div class="relative z-10">
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
                      </div>
                   </div>
                   <div class="flex justify-between items-end">
                      <div>
                        <p class="text-[10px] font-black uppercase text-white/40 mb-2">Estimated Investment</p>
                        <div class="text-6xl font-black tracking-tighter italic font-serif leading-none">£{{ totalPrice.toLocaleString() }}</div>
                      </div>
                      <button @click="window.print()" class="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all"><ArrowUpRight size="20"/></button>
                   </div>
                </div>
             </div>
          </aside>
       </div>

       <!-- Global Footer -->
       <footer class="bg-[#0f172a] text-white py-24 px-6 lg:px-20 print:hidden relative overflow-hidden">
          <div class="absolute -right-20 -bottom-40 text-[300px] font-black text-white/5 italic font-serif select-none pointer-events-none uppercase">S10</div>
          <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 relative z-10">
             <div class="space-y-8">
                <div @click="navigate('LANDING')" class="flex flex-col cursor-pointer">
                   <h1 class="text-3xl font-black tracking-tighter text-white font-serif italic leading-none">ACO<span class="text-[#2563eb] font-sans not-italic">fusion</span></h1>
                   <p class="text-[10px] font-black uppercase tracking-[0.6em] text-white/30 mt-2">Global Lighting Intelligence</p>
                </div>
                <p class="text-slate-400 font-medium leading-relaxed max-w-xs">Precision magnetic track systems engineered for the highest architectural demands.</p>
                <div class="flex items-center gap-6">
                   <a href="#" class="text-white/40 hover:text-white transition-colors"><Instagram size="20"/></a>
                   <a href="#" class="text-white/40 hover:text-white transition-colors"><Facebook size="20"/></a>
                   <a href="#" class="text-white/40 hover:text-white transition-colors"><Linkedin size="20"/></a>
                </div>
             </div>

             <div class="space-y-8">
                <h5 class="text-[12px] font-black uppercase tracking-[0.5em] text-white/20">Legal & Technical</h5>
                <nav class="flex flex-col gap-4">
                   <a v-for="l in ['General Conditions', 'Privacy Policy', 'Architectural Specs', 'S10 Manuals']" :key="l" href="#" class="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#2563eb] transition-all">{{ l }}</a>
                </nav>
             </div>

             <div class="space-y-8">
                <h5 class="text-[12px] font-black uppercase tracking-[0.5em] text-white/20">UK / Europe Contact</h5>
                <div class="space-y-4">
                   <p class="text-[11px] font-black uppercase tracking-widest text-[#2563eb]">Director: James Tsai</p>
                   <p class="text-lg font-bold flex items-center gap-3"><Smartphone size="18"/> +44-7510-317-505</p>
                   <p class="text-[10px] font-medium text-slate-400">UK Office Liaison</p>
                </div>
             </div>

             <div class="space-y-8">
                <h5 class="text-[12px] font-black uppercase tracking-[0.5em] text-white/20">Global Support</h5>
                <div class="space-y-6">
                   <a href="mailto:service@acofusion.com" class="text-lg font-bold block hover:text-[#2563eb] transition-colors leading-none">service@acofusion.com</a>
                   <a href="https://wa.me/447510317505" target="_blank" class="inline-flex items-center gap-4 px-8 py-4 bg-emerald-600 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl">
                      <MessageCircle size="20"/> Direct WhatsApp
                   </a>
                   <p class="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">Response Time: &lt; 2hrs</p>
                </div>
             </div>
          </div>
          
          <div class="max-w-7xl mx-auto pt-20 mt-20 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
             <p class="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 text-center sm:text-left">© 2026 ACOFUSION LIGHTING. ALL RIGHTS RESERVED. REGISTERED IN UK.</p>
             <p class="text-[10px] font-black uppercase tracking-[0.5em] text-[#2563eb] text-center sm:text-right italic">Light is the fourth dimension of architecture.</p>
          </div>
       </footer>
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

    <!-- Persistent Growth & Support Module (Floating Action) -->
    <a href="https://wa.me/447510317505" target="_blank" class="fixed bottom-10 right-10 z-[350] group flex items-center gap-6 print:hidden">
       <div class="bg-white border border-slate-100 shadow-2xl px-6 py-4 rounded-3xl opacity-0 translate-x-10 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none">
          <span class="text-[10px] font-black uppercase tracking-widest text-[#0f172a]">Request Expert Quotation</span>
          <p class="text-[9px] font-medium text-slate-400 mt-1">James Tsai | UK Technical Liaison</p>
       </div>
       <div class="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.4)] hover:bg-emerald-500 hover:scale-110 active:scale-95 transition-all">
          <MessageCircle size="32" />
          <div class="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20 group-hover:opacity-0 transition-opacity"></div>
       </div>
    </a>


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

