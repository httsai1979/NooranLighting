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
  Menu,
  Plus,
  Minus
} from 'lucide-vue-next'
import type { Luminaire, Accessory, MountingType, LayoutType, ConfigState, BOMItem } from './types'

// --- System Configuration ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzppxxh05KJPZzDHlTK6_so2ILiMCsfkeF3btexeVyZ7zoT-04ksNg4lwSGNkZxUSVkdQ/exec'
const TRACK_UNIT_MM = 2000 
const PSU_MAX_W = 160 
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1X...placeholder.../edit' 

// --- Navigation Definitions ---
const NAV_LINKS = [
  { id: 'HOME', label: 'Home' },
  { id: 'ABOUT', label: 'About Us' },
  { id: 'PRODUCT', label: 'Products' },
  { id: 'PROJECT', label: 'Portfolio' },
  { id: 'CONFIGURATOR', label: 'Technical Configurator' },
  { id: 'DOWNLOAD', label: 'Resource Center' },
  { id: 'CONTACT', label: 'Contact' }
]

// --- App State ---
const loading = ref(true)
const currentView = ref('HOME')
const step = ref(0)
const showSpecs = ref<Luminaire | Accessory | null>(null)
const data = ref<{ lamps: Luminaire[], accessories: Accessory[] }>({ lamps: [], accessories: [] })
const mobileMenuOpen = ref(false)
const luminaireFilter = ref('ALL') 

const config = ref<ConfigState>({
  mounting: 'Surface/Hanging',
  layout: 'Straight',
  totalLength: 2000, 
  selectedLuminaires: []
})

// --- Content Assets ---
const projects = [
  { id: 1, name: 'London Art Gallery', location: 'Mayfair, UK', image: 'https://images.unsplash.com/photo-1544413164-320092671092?auto=format&fit=crop&q=80', description: 'Precision accent lighting for high-value canvases.' },
  { id: 2, name: 'Minimalist Residence', location: 'Zurich, CH', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80', description: 'Discrete track integration for open-plan living.' },
  { id: 3, name: 'Executive Workspace', location: 'London City', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80', description: 'Balanced flood and spot distribution for high productivity.' }
]

const categories = [
  { id: 'ALL', name: 'All Modules' },
  { id: 'AMBIENT', name: 'Ambient Lighting (Linear/Flood)' },
  { id: 'ACCENT', name: 'Accent Lighting (Spots)' },
  { id: 'DECO', name: 'Decorative & Pendents' }
]

const luminaireScenarios = {
  'ALL': 'Explore the complete S10 high-precision collection.',
  'AMBIENT': 'Soft, uniform illumination for general architectural spaces.',
  'ACCENT': 'Directional precision to highlight textures, art, and geometry.',
  'DECO': 'Artistic elements that define the character of the space.'
}

// --- Logic A: Hardened Image Engine ---
const fixDriveUrl = (url: any) => {
  if (!url) return '';
  const strUrl = String(url);
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

// --- SEO Engine ---
watch([currentView, step], () => {
  const t = NAV_LINKS.find(n => n.id === currentView.value)?.label || 'Lighting'
  document.title = `ACOfusion | ${t}`
}, { immediate: true })

// --- Data Synchronisation ---
onMounted(async () => {
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

// --- Intelligence Logic ---
const filteredLamps = computed(() => {
  if (luminaireFilter.value === 'ALL') return data.value.lamps
  return data.value.lamps.filter(l => {
    const cat = (l.category || '').toLowerCase()
    if (luminaireFilter.value === 'ACCENT') return cat.includes('spot')
    if (luminaireFilter.value === 'AMBIENT') return cat.includes('flood') || cat.includes('grille')
    if (luminaireFilter.value === 'DECO') return cat.includes('decorative') || cat.includes('pendant')
    return true
  })
})

// --- Expert BOM Engine ---
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

  let prefix = 'G-TL-A'; 
  if (mounting === 'Embedded concealed') prefix = 'G-TL-D-B';
  else if (mounting === 'Batch ash track') prefix = 'G-TL-D-C';
  else if (mounting === 'Spring fixed') prefix = 'G-TL-D-D';
  else if (mounting === 'Ceiling soft film') prefix = 'G-TL-D-E';

  // 1. Tracks (2M Units)
  const trackQty = Math.ceil(totalLength / 2000);
  items.push(findRealItem([prefix, '2M'], `${mounting} Track (2M)`, 'Track', trackQty));

  // 2. Luminaires
  selectedLuminaires.forEach(sel => {
    items.push({
      model: sel.item.model,
      category: sel.item.category,
      description: 'Magnetic Architectural Module',
      quantity: sel.quantity,
      price: sel.item.price,
      photo: fixDriveUrl(sel.item.photo)
    });
  });

  // 3. Power Hub
  const totalW = selectedLuminaires.reduce((acc, s) => acc + (s.item.power * s.quantity), 0);
  const psuQty = Math.ceil(totalW / PSU_MAX_W) || 1;
  items.push(findRealItem(['G-TL-POW', '100W'], '48V DC Power Integration Hub', 'Power', psuQty));

  // 4. Caps & Joiners
  items.push(findRealItem([prefix, 'END'], 'System End Cap Unit', 'Hardware', 2));
  if (layout === 'L-Shape') items.push(findRealItem([prefix, 'CORNER'], '90° Structural Joiner', 'Hardware', 1));
  if (layout === 'T-Shape') items.push(findRealItem([prefix, 'T-JOIN'], 'T-Intersection Module', 'Hardware', 1));

  return items;
});

const totalPrice = computed(() => generatedBOM.value.reduce((acc, item) => acc + (item.price * item.quantity), 0));
const currentLoad = computed(() => config.value.selectedLuminaires.reduce((acc, s) => acc + (s.item.power * s.quantity), 0));
const isOverloaded = computed(() => currentLoad.value > PSU_MAX_W);

// --- Navigation ---
const navigate = (view: string) => {
  currentView.value = view
  mobileMenuOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const startConfiguration = () => {
  navigate('CONFIGURATOR')
  step.value = 0
}

const updateLamp = (lamp: Luminaire, delta: number) => {
  const existing = config.value.selectedLuminaires.find(s => s.item.model === lamp.model)
  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + delta)
    if (existing.quantity === 0) config.value.selectedLuminaires = config.value.selectedLuminaires.filter(x => x.item.model !== lamp.model)
  } else if (delta > 0) config.value.selectedLuminaires.push({ item: lamp, quantity: 1 })
}

const getQty = (m: string) => config.value.selectedLuminaires.find(s => s.item.model === m)?.quantity || 0
const safeUpper = (v: any) => String(v || '').toUpperCase()

const steps = [
  { id: 'mounting', name: 'Mounting Style', desc: 'Series protocol mapping' },
  { id: 'topology', name: 'Topology', desc: 'Select structural layout' },
  { id: 'length', name: 'System Metres', desc: 'Linear extension scale' },
  { id: 'luminaires', name: 'Luminaires', desc: 'Optical module selection' },
  { id: 'final', name: 'Parts List', desc: 'Review & Quotation' }
]
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-[#2563eb] selection:text-white" :class="currentView === 'CONFIGURATOR' ? 'h-screen overflow-hidden' : ''">
    
    <!-- Experience Loading -->
    <Transition name="fade">
      <div v-if="loading" class="fixed inset-0 z-[500] bg-white flex flex-col items-center justify-center">
         <div class="w-20 h-20 border-2 border-slate-50 border-t-[#2563eb] rounded-full animate-spin"></div>
         <p class="mt-12 text-[10px] font-black uppercase tracking-[0.8em] text-slate-300 animate-pulse">Aco Innovation Protocol</p>
      </div>
    </Transition>

    <!-- Header Navigation -->
    <header class="sticky top-0 z-[400] bg-white/90 backdrop-blur-3xl border-b border-slate-50 px-6 lg:px-12 py-5 flex justify-between items-center transition-all duration-500">
       <div class="flex items-center gap-16">
          <button @click="navigate('HOME')" class="flex flex-col group">
             <h1 class="text-3xl font-black tracking-tighter text-[#0f172a] font-serif italic leading-none transition-transform group-hover:scale-105">ACO<span class="text-[#2563eb] font-sans not-italic">fusion</span></h1>
             <p class="text-[9px] font-black text-[#2563eb] uppercase tracking-[0.5em] mt-1 opacity-60">Global Lighting Intelligence</p>
          </button>
          <nav class="hidden 2xl:flex items-center gap-8">
             <button v-for="l in NAV_LINKS.filter(n => n.id !== 'HOME')" :key="l.id" @click="navigate(l.id)"
                class="relative text-[11px] font-black uppercase tracking-[0.3em] transition-all group overflow-hidden py-2"
                :class="currentView === l.id ? 'text-[#2563eb]' : 'text-slate-400 hover:text-[#0f172a]'">
                {{ l.label }}
                <span class="absolute bottom-0 left-0 w-full h-0.5 bg-[#2563eb] transform origin-left transition-transform duration-500" 
                      :class="currentView === l.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"></span>
             </button>
          </nav>
       </div>
       <div class="flex items-center gap-4">
          <button @click="startConfiguration" 
             class="hidden sm:flex items-center gap-4 px-10 py-4 bg-[#0f172a] text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#2563eb] transition-all group">
             System Configurator <Compass size="16" class="group-hover:rotate-180 transition-transform duration-700"/>
          </button>
          <button @click="mobileMenuOpen = !mobileMenuOpen" class="2xl:hidden p-3 bg-slate-50 rounded-2xl text-slate-900 shadow-sm"><Menu/></button>
       </div>
    </header>

    <!-- Mobile Nav -->
    <Transition name="fade">
       <div v-if="mobileMenuOpen" class="fixed inset-0 z-[500] bg-white p-12 flex flex-col pt-32 overflow-y-auto">
          <button v-for="l in NAV_LINKS" :key="l.id" @click="navigate(l.id)"
             class="text-4xl sm:text-6xl font-black mb-8 border-b-2 border-slate-50 pb-4 text-left italic font-serif leading-none tracking-tighter"
             :class="currentView === l.id ? 'text-[#2563eb]' : 'text-slate-200'">{{ l.label }}</button>
          <button @click="mobileMenuOpen = false" class="absolute top-12 right-12 p-6 bg-slate-50 rounded-[2rem] shadow-xl"><X size="32"/></button>
          <div class="mt-auto pt-10 border-t border-slate-100 text-slate-400 text-lg">
            <p class="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-4">European Director</p>
            <p class="text-xl font-bold italic mb-2 text-slate-900">James Tsai</p>
            <p>+44-7510-317-505</p>
          </div>
       </div>
    </Transition>

    <main class="flex-1 flex flex-col relative">
       
       <!-- VIEW: HOME -->
       <div v-if="currentView === 'HOME'" class="animate-in fade-in zoom-in-95 duration-1000">
          <section class="min-h-[90vh] flex flex-col justify-center px-6 lg:px-20 relative bg-[#fafafa]">
             <div class="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-20">
                <div class="space-y-12">
                   <div class="inline-flex items-center gap-6 bg-white px-6 py-2.5 rounded-full border border-slate-100 shadow-xl">
                      <span class="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                      <span class="text-[11px] font-bold uppercase tracking-[0.4em] text-[#2563eb]">Engineered in UK | S10 Series</span>
                   </div>
                   <h2 class="text-7xl lg:text-[120px] font-black tracking-tighter text-[#0f172a] leading-[0.85] italic font-serif">
                      Invisible <br/><span class="text-[#2563eb]">Luminance</span>.
                   </h2>
                   <p class="text-2xl lg:text-3xl text-slate-500 font-light max-w-2xl leading-relaxed">
                      S10 is the ultimate 10mm magnetic track platform. Minimalist engineering for high-stakes architectural projects.
                   </p>
                   <div class="flex flex-col sm:flex-row gap-8 pt-6">
                      <button @click="startConfiguration" class="px-16 py-8 bg-[#0f172a] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl hover:bg-[#2563eb] transition-all duration-500">Launch Configurator</button>
                      <button @click="navigate('PRODUCT')" class="px-16 py-8 border-2 border-slate-200 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[13px] hover:bg-white transition-all">Browse Essentials</button>
                   </div>
                </div>
                <div class="relative group hidden lg:block">
                   <div class="aspect-[4/5] bg-white rounded-[4rem] overflow-hidden shadow-2xl relative border-[30px] border-white">
                      <img src="https://images.unsplash.com/photo-1544413164-320092671092?auto=format&fit=crop&q=80" class="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-105" />
                      <div class="absolute bottom-12 left-12 text-white">
                         <p class="text-[10px] font-black uppercase tracking-[0.6em] mb-4">System Application</p>
                         <h4 class="text-4xl font-serif italic font-black text-white/90">Art Basel, Berlin Pavilion</h4>
                      </div>
                   </div>
                </div>
             </div>
          </section>
       </div>

       <!-- VIEW: ABOUT -->
       <div v-if="currentView === 'ABOUT'" class="animate-in slide-in-from-right duration-1000 bg-white py-40 px-6 lg:px-20 min-h-screen">
          <div class="max-w-7xl mx-auto">
             <header class="mb-32">
                <h4 class="text-[12px] font-black uppercase tracking-[0.8em] text-[#2563eb] mb-8">Heritage</h4>
                <h2 class="text-7xl lg:text-[110px] font-black tracking-tighter italic font-serif text-[#0f172a] leading-none">ACOfusion <br/>Philosophy.</h2>
             </header>
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-32 items-start text-slate-600 text-lg leading-relaxed">
                <div class="space-y-12">
                   <p class="text-3xl font-light text-slate-500 leading-relaxed italic font-serif">"Light is the fourth dimension of architecture."</p>
                   <p>Based in the UK, ACOfusion specializes in low-voltage magnetic track protocols. Under the technical directorship of James Tsai, we serve global architectural firms with localized engineering support and patent-led innovations.</p>
                   <p>Our focus is the intersection of high-density electronics and minimalist aesthetic integration.</p>
                </div>
                <div class="grid grid-cols-2 gap-8">
                   <div v-for="i in 4" :key="i" class="aspect-square bg-slate-50 rounded-[3rem] p-12 flex flex-col justify-end group hover:bg-[#2563eb] transition-all duration-700">
                      <span class="text-4xl font-black italic font-serif mb-4 group-hover:text-white">{{ ['UK', 'S10', '48V', 'A++'][i-1] }}</span>
                      <p class="text-[11px] font-bold uppercase tracking-widest group-hover:text-white/50 transition-colors">{{ ['Design HQ', 'Patent Logic', 'Safety Protocol', 'Efficiency'][i-1] }}</p>
                   </div>
                </div>
             </div>
          </div>
       </div>

       <!-- VIEW: PRODUCT -->
       <div v-if="currentView === 'PRODUCT'" class="animate-in fade-in duration-1000 py-32 px-6 lg:px-20 min-h-screen bg-slate-50">
          <div class="max-w-7xl mx-auto">
             <header class="flex flex-col md:flex-row justify-between items-end gap-12 mb-32">
                <div class="max-w-2xl">
                   <h2 class="text-8xl font-black font-serif italic tracking-tighter text-[#0f172a] mb-8">Registry.</h2>
                   <p class="text-2xl font-light text-slate-500">Every module is a masterclass in thermal management and optical control.</p>
                </div>
                <div class="flex flex-wrap gap-4 p-3 bg-white rounded-[2.5rem] shadow-xl">
                   <button v-for="c in categories" :key="c.id" @click="luminaireFilter = c.id"
                      class="px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                      :class="luminaireFilter === c.id ? 'bg-[#0f172a] text-white' : 'text-slate-400 hover:text-slate-900'">
                      {{ c.name.split(' (')[0] }}
                   </button>
                </div>
             </header>
             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                <div v-for="l in filteredLamps" :key="l.model" class="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-3xl hover:-translate-y-4 transition-all duration-700 p-8 flex flex-col group">
                   <div class="aspect-square bg-slate-50 rounded-[2.5rem] p-10 mb-10 flex items-center justify-center relative overflow-hidden">
                      <img :src="fixDriveUrl(l.photo)" class="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-125 transition-transform duration-1000"/>
                   </div>
                   <h4 class="text-2xl font-black uppercase tracking-tight text-[#0f172a] mb-2">{{ l.model }}</h4>
                   <span class="text-[10px] font-black uppercase tracking-widest text-[#2563eb] mb-6 block">{{ l.category }} // {{ l.power }}W</span>
                   <p class="text-slate-400 text-[13px] font-medium leading-relaxed mb-auto italic">{{ l.description || 'Professional luminaire module.' }}</p>
                   <footer class="mt-10 pt-8 border-t border-slate-50 flex justify-between items-center">
                      <span class="text-2xl font-black font-serif italic text-[#0f172a]">£{{ l.price }}</span>
                      <button @click="showSpecs = l" class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#2563eb] hover:text-white transition-all"><ArrowUpRight size="20"/></button>
                   </footer>
                </div>
             </div>
          </div>
       </div>

       <!-- VIEW: PROJECT -->
       <div v-if="currentView === 'PROJECT'" class="animate-in slide-in-from-bottom-10 duration-1000 py-32 px-6 lg:px-20 bg-white">
          <div class="max-w-7xl mx-auto">
             <header class="max-w-4xl mb-32">
                <h4 class="text-[12px] font-black uppercase tracking-[0.8em] text-[#2563eb] mb-8">Library</h4>
                <h2 class="text-7xl lg:text-[110px] font-black tracking-tighter italic font-serif text-[#0f172a] leading-none mb-12">The Impact.</h2>
                <p class="text-2xl text-slate-400 font-light leading-relaxed">Cross-sectional analysis of architectural lighting implementations.</p>
             </header>
             <section class="mb-32">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-[#0f172a] rounded-[5rem] overflow-hidden">
                   <div class="relative overflow-hidden aspect-video">
                      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" class="w-full h-full object-cover grayscale opacity-40 text-white" />
                      <div class="absolute inset-0 flex items-center justify-center"><span class="px-6 py-2 bg-white/10 backdrop-blur text-[10px] font-black uppercase text-white border border-white/20 rounded-full">Skeleton Structure</span></div>
                   </div>
                   <div class="relative overflow-hidden aspect-video">
                      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" class="w-full h-full object-cover" />
                      <div class="absolute inset-0 flex items-center justify-center"><span class="px-6 py-2 bg-[#2563eb] text-[10px] font-black uppercase text-white rounded-full shadow-2xl">S10 Activation</span></div>
                   </div>
                </div>
                <p class="mt-8 text-center text-slate-400 text-[11px] font-black uppercase tracking-[0.8em]">Comparative Architecture Module</p>
             </section>
             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                <div v-for="p in projects" :key="p.id" class="group cursor-pointer">
                   <div class="aspect-[16/10] bg-slate-100 rounded-[4rem] overflow-hidden mb-10 relative">
                      <img :src="p.image" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                   </div>
                   <h4 class="text-3xl font-black uppercase tracking-tight text-[#0f172a] mb-3 leading-none">{{ p.name }}</h4>
                   <p class="text-slate-400 text-lg font-medium leading-relaxed">{{ p.description }}</p>
                </div>
             </div>
          </div>
       </div>

       <!-- VIEW: DOWNLOAD -->
       <div v-if="currentView === 'DOWNLOAD'" class="animate-in slide-in-from-right duration-1000 py-32 px-6 lg:px-20 bg-slate-50 min-h-screen">
          <div class="max-w-7xl mx-auto">
             <header class="mb-32">
                <h2 class="text-[120px] font-black font-serif italic tracking-tighter text-[#0f172a] leading-none mb-4 text-slate-800">Assets.</h2>
                <p class="text-3xl font-light text-slate-500">Engineering data and architectural library.</p>
             </header>
             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                <div v-for="i in 6" :key="i" class="bg-white p-12 rounded-[4rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all group cursor-pointer">
                   <div class="w-20 h-20 bg-[#2563eb]/5 text-[#2563eb] rounded-[2rem] flex items-center justify-center mb-10 group-hover:bg-[#2563eb] group-hover:text-white transition-all duration-500"><Download size="32"/></div>
                   <h4 class="text-3xl font-black uppercase tracking-tight text-[#0f172a] mb-6 leading-none">
                      {{ ['Full Catalog v2.9', 'Installation Kit', 'DIALux Files', 'Revit Families', 'Safety Protocol', 'Power Logic'][i-1] }}
                   </h4>
                   <p class="text-slate-400 text-lg mb-10 font-medium leading-relaxed italic">Advanced technical documentation.</p>
                   <button class="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-[#2563eb]">Secure Download <ArrowUpRight size="16"/></button>
                </div>
             </div>
          </div>
       </div>

       <!-- VIEW: CONTACT -->
       <div v-if="currentView === 'CONTACT'" class="animate-in zoom-in-95 duration-1000 py-32 px-6 lg:px-20 bg-white min-h-screen">
          <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32">
             <div class="space-y-16">
                <h2 class="text-[110px] font-serif italic font-black text-[#0f172a] leading-[0.8] tracking-tighter">Get in <br/><span class="text-[#2563eb]">Touch</span>.</h2>
                <div class="space-y-12">
                   <div class="flex gap-10 group">
                      <div class="w-24 h-24 bg-slate-50 flex items-center justify-center rounded-[3rem] group-hover:bg-[#2563eb] group-hover:text-white transition-all duration-500"><Smartphone size="36"/></div>
                      <div>
                         <p class="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-2">UK & EU Technical Director</p>
                         <p class="text-4xl font-bold italic mb-2 text-[#0f172a]">James Tsai</p>
                         <p class="text-2xl font-bold">+44-7510-317-505</p>
                      </div>
                   </div>
                   <div class="flex gap-10 group">
                      <div class="w-24 h-24 bg-slate-50 flex items-center justify-center rounded-[3rem] group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500"><MessageCircle size="36"/></div>
                      <div>
                         <p class="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-2">Direct Inquiry</p>
                         <a href="https://wa.me/447510317505" target="_blank" class="text-3xl font-bold hover:text-emerald-500 transition-colors italic">WhatsApp Advisor</a>
                      </div>
                   </div>
                </div>
             </div>
             <div class="bg-slate-50 p-20 rounded-[5rem] shadow-3xl relative overflow-hidden border border-slate-100">
                <h4 class="text-4xl font-black font-serif italic mb-12">Submit Project Detail</h4>
                <form @submit.prevent class="space-y-10">
                   <input type="text" class="w-full bg-white border-2 border-transparent rounded-[2rem] p-8 outline-none shadow-sm shadow-slate-100" placeholder="Project Name" />
                   <a href="mailto:service@acofusion.com" class="w-full py-10 bg-[#0f172a] text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl flex items-center justify-center">Email: service@acofusion.com</a>
                </form>
             </div>
          </div>
       </div>

       <!-- VIEW: CONFIGURATOR -->
       <div v-if="currentView === 'CONFIGURATOR'" class="flex-1 flex flex-col xl:flex-row overflow-hidden print:h-auto">
          <main class="flex-1 bg-white flex flex-col relative overflow-hidden print:static bg-slate-50/20">
             <!-- Steps -->
             <nav class="absolute top-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 bg-[#0f172a] px-8 py-4 rounded-full shadow-3xl print:hidden">
                <div v-for="i in 5" :key="i" class="flex items-center gap-4">
                   <div class="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all"
                      :class="step >= i-1 ? 'bg-[#2563eb] text-white' : 'bg-white/10 text-white/30'">{{ i }}</div>
                </div>
             </nav>

             <div class="absolute bottom-10 left-10 right-10 z-20 flex justify-between gap-10 print:hidden pointer-events-none">
                <button v-if="step > 0" @click="step--" class="pointer-events-auto px-10 py-5 bg-white border border-slate-200 rounded-full flex items-center gap-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl"><ChevronLeft size="18"/> Return</button>
                <div v-else></div>
                <button v-if="step < 4" @click="step++" class="pointer-events-auto px-12 py-5 bg-[#0f172a] text-white rounded-full flex items-center gap-4 text-[11px] font-black uppercase tracking-widest hover:bg-[#2563eb] transition-all shadow-2xl">Proceed to 0{{ step + 2 }} <ChevronRight size="18"/></button>
             </div>

             <!-- Phases -->
             <div v-if="step === 0" class="flex-1 flex flex-col items-center justify-center p-20">
                <h3 class="text-7xl lg:text-[100px] font-black tracking-tighter text-[#0f172a] italic font-serif leading-none text-center">Mounting <br/>Platform.</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 max-w-4xl w-full">
                   <button v-for="m in (['Surface/Hanging', 'Embedded concealed', 'Batch ash track', 'Spring fixed', 'Ceiling soft film'] as const)" :key="m"
                     @click="config.mounting = m"
                     class="p-10 rounded-[3rem] border-2 transition-all text-left group"
                     :class="config.mounting === m ? 'border-[#2563eb] bg-white shadow-2xl scale-105' : 'border-slate-100 hover:border-[#2563eb]/20'">
                     <span class="text-xl font-bold uppercase text-[#0f172a]">{{ m }}</span>
                   </button>
                </div>
             </div>

             <div v-if="step === 1" class="flex-1 flex flex-col items-center justify-center p-20">
                <h3 class="text-7xl lg:text-[100px] font-black tracking-tighter text-[#0f172a] italic font-serif leading-none text-center">Layout <br/>Topology.</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl w-full">
                   <button v-for="l in (['Straight', 'L-Shape', 'T-Shape', 'Rectangle'] as const)" :key="l" @click="config.layout = l"
                     class="aspect-square p-8 rounded-[4rem] border-2 transition-all flex flex-col items-center justify-center"
                     :class="config.layout === l ? 'border-[#2563eb] bg-white shadow-2xl scale-110' : 'border-slate-100'">
                     <LayoutIcon size="36" class="mb-4" :class="config.layout === l ? 'text-[#2563eb]' : 'text-slate-300'"/>
                     <span class="text-[11px] font-black uppercase text-[#0f172a]">{{ l }}</span>
                   </button>
                </div>
             </div>

             <div v-if="step === 2" class="flex-1 flex flex-col items-center justify-center p-20">
                <h3 class="text-7xl lg:text-[100px] font-black tracking-tighter text-[#0f172a] italic font-serif leading-none text-center">Systems <br/>Dimension.</h3>
                <div class="bg-white p-16 rounded-[5rem] space-y-10 border border-slate-100 shadow-3xl mt-16 w-full max-w-xl">
                   <div class="text-[100px] font-mono font-black italic tracking-tighter text-[#0f172a] tabular-nums leading-none">{{ (config.totalLength).toFixed(0) }}mm</div>
                   <input type="range" v-model.number="config.totalLength" min="500" max="25000" step="500" class="w-full accent-[#2563eb]" />
                </div>
             </div>

             <div v-if="step === 3" class="flex-1 flex flex-col overflow-hidden">
                <header class="p-16 py-20 bg-white border-b border-slate-100 shrink-0">
                   <h2 class="text-6xl lg:text-7xl font-serif italic font-black tracking-tighter text-[#0f172a] mb-10 leading-none">Activation Modules.</h2>
                   <div class="flex flex-wrap gap-3">
                      <button v-for="c in categories" :key="c.id" @click="luminaireFilter = c.id"
                         class="px-8 py-3 rounded-full border-2 transition-all text-[11px] font-black uppercase tracking-widest"
                         :class="luminaireFilter === c.id ? 'bg-[#0f172a] border-[#0f172a] text-white' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-900'">
                         {{ c.name.split(' (')[0] }}
                      </button>
                   </div>
                </header>
                <div class="flex-1 overflow-y-auto p-12 custom-scrollbar">
                   <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <div v-for="lamp in filteredLamps" :key="lamp.model" class="group bg-white p-8 rounded-[3.5rem] border border-slate-100 hover:shadow-3xl transition-all duration-700 flex flex-col shadow-sm">
                         <div class="aspect-square bg-slate-50 rounded-[2.5rem] p-6 mb-8 flex items-center justify-center relative">
                            <img :src="fixDriveUrl(lamp.photo)" class="max-w-full max-h-full object-contain mix-blend-multiply" />
                            <button @click="showSpecs = lamp" class="absolute top-4 right-4 text-slate-200 hover:text-[#2563eb]"><Info size="20"/></button>
                         </div>
                         <h4 class="text-2xl font-black uppercase text-[#0f172a] mb-2 leading-none whitespace-nowrap overflow-hidden text-ellipsis">{{ lamp.model }}</h4>
                         <p class="text-[9px] font-black text-slate-300 mb-8 uppercase tracking-widest">{{ lamp.category }} // {{ lamp.power }}W</p>
                         <div class="mt-auto flex items-center justify-between pt-8 border-t border-slate-50 text-2xl font-black font-serif italic">
                            <span>£{{ lamp.price }}</span>
                            <div class="flex items-center gap-3 bg-slate-50 p-2 rounded-full">
                               <button @click="updateLamp(lamp, -1)" class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-90"><Minus size="18"/></button>
                               <span class="w-10 text-center text-xl font-black tabular-nums">{{ getQty(lamp.model) }}</span>
                               <button @click="updateLamp(lamp, 1)" class="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center shadow-lg active:scale-90"><Plus size="18"/></button>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div v-if="step === 4" class="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                <header class="p-16 py-20 bg-[#0f172a] text-white shrink-0 relative overflow-hidden">
                   <h2 class="text-7xl lg:text-9xl font-serif italic font-black text-white relative z-10 leading-none">Proposal <br/>Blueprint.</h2>
                   <div class="absolute -right-20 -bottom-20 text-[200px] font-black text-white/5 italic font-serif">S10</div>
                </header>
                <div class="flex-1 overflow-y-auto p-12 custom-scrollbar">
                   <div class="max-w-7xl mx-auto">
                      <table class="w-full text-left border-collapse bg-white rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100">
                         <thead>
                           <tr class="text-[11px] font-black uppercase tracking-[0.5em] border-b-8 border-[#0f172a] bg-slate-50">
                             <th class="py-12 px-10">Component Reference</th>
                             <th class="py-12 px-10 text-center">Net Qty</th>
                             <th class="py-12 px-16 text-right bg-[#0f172a] text-white">Subtotal</th>
                           </tr>
                         </thead>
                         <tbody class="divide-y divide-slate-50">
                            <tr v-for="(item, i) in generatedBOM" :key="i">
                               <td class="py-10 px-10 flex gap-8 items-center">
                                  <img v-if="item.photo" :src="item.photo" class="w-20 h-20 object-contain bg-slate-50 rounded-2xl p-2" />
                                  <div>
                                     <div class="text-3xl font-black uppercase italic font-serif text-[#0f172a]">{{ safeUpper(item.model) }}</div>
                                     <a :href="SHEET_URL" target="_blank" class="text-[10px] font-black text-[#2563eb] italic hover:border-b border-[#2563eb]">Verify Registry Price &gt;</a>
                                  </div>
                               </td>
                               <td class="py-10 px-10 text-center font-mono font-black text-4xl italic">x{{ item.quantity }}</td>
                               <td class="py-10 px-16 text-right font-mono font-black text-3xl italic text-[#0f172a]">£{{ (item.price * item.quantity).toLocaleString() }}</td>
                            </tr>
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          </main>

          <aside v-if="currentView === 'CONFIGURATOR' && !loading" class="hidden xl:flex w-[32%] bg-slate-50/50 border-l border-slate-100 p-12 flex-col h-screen shrink-0 print:hidden overflow-hidden">
             <div class="flex justify-between items-center mb-12">
                <h4 class="text-[12px] font-black uppercase tracking-[0.4em] text-slate-900 italic font-serif">Engineering Feed</h4>
                <Compass class="text-slate-300" size="24"/>
             </div>
             <div class="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <div v-for="(item, i) in generatedBOM" :key="i" class="flex gap-4 items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:translate-x-2">
                    <img :src="item.photo" v-if="item.photo" class="w-16 h-16 object-contain" />
                    <div class="flex-1 overflow-hidden">
                       <p class="text-[10px] font-black uppercase text-[#0f172a] truncate">{{ item.model }}</p>
                       <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{{ item.category }}</p>
                    </div>
                    <div class="text-xs font-black italic">x{{ item.quantity }}</div>
                </div>
             </div>
             <div class="mt-12 pt-12 border-t border-slate-100 space-y-8">
                <div class="flex justify-between items-end p-8 bg-[#0f172a] rounded-[3rem] text-white">
                   <div>
                      <p class="text-[9px] font-black uppercase text-white/40 mb-2">Power Load (S10-MAX)</p>
                      <p class="text-5xl font-black font-serif italic" :class="isOverloaded ? 'text-red-400' : 'text-white'">{{ currentLoad.toFixed(0) }}W</p>
                   </div>
                   <Zap size="32" class="text-white/20"/>
                </div>
                <div class="flex justify-between items-end p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
                   <div class="text-5xl font-black font-serif italic text-[#0f172a] tracking-tighter">£{{ totalPrice.toLocaleString() }}</div>
                   <button @click="step = 4" class="w-16 h-16 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-xl hover:bg-[#0f172a] transition-all"><ArrowUpRight size="28"/></button>
                </div>
             </div>
          </aside>
       </div>
    </main>

    <!-- Support Orb -->
    <a href="https://wa.me/447510317505" target="_blank" class="fixed bottom-12 right-12 z-[450] group flex items-center gap-6 print:hidden">
       <div class="bg-white border border-slate-100 shadow-3xl px-8 py-5 rounded-[2.5rem] opacity-0 translate-x-12 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 pointer-events-none">
          <span class="text-[11px] font-black uppercase tracking-widest text-[#0f172a]">James Tsai Advisor</span>
       </div>
       <div class="w-24 h-24 bg-[#2563eb] text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all">
          <MessageCircle size="36" />
       </div>
    </a>

    <!-- Specs Modal -->
    <Transition name="fade">
      <div v-if="showSpecs" class="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/98 backdrop-blur-3xl" @click="showSpecs = null">
        <div class="bg-white max-w-7xl w-full flex flex-col md:flex-row rounded-[4rem] overflow-hidden h-[85vh] shadow-2xl" @click.stop>
           <div class="w-full md:w-1/2 bg-slate-50 flex items-center justify-center p-20 relative">
              <img :src="fixDriveUrl(showSpecs.photo)" class="w-full h-full object-contain mix-blend-multiply" />
           </div>
           <div class="flex-1 p-20 lg:p-24 flex flex-col relative overflow-hidden text-left">
              <button @click="showSpecs = null" class="absolute top-12 right-12 text-slate-300 hover:text-slate-900"><X size="44"/></button>
              <h2 class="text-7xl font-black italic font-serif uppercase tracking-tighter mb-6 text-[#0f172a]">{{ safeUpper(showSpecs.model) }}</h2>
              <div class="w-40 h-3 bg-[#2563eb] rounded-full mb-12"></div>
              <div class="flex-1 overflow-y-auto space-y-12 pr-10 custom-scrollbar">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div v-for="(v, k) in (showSpecs.specsData || {})" :key="k" class="border-b border-slate-50 pb-6">
                       <span class="block text-[11px] font-black uppercase text-[#2563eb] mb-2">{{ k }}</span>
                       <span class="text-xl font-bold text-[#0f172a] italic font-serif">{{ v }}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Transition>

    <!-- Print Area -->
    <div id="print-area" class="hidden print:block p-20 font-sans text-slate-900 bg-white">
       <header class="flex justify-between items-end border-b-[12px] border-[#0f172a] pb-16 mb-24 relative overflow-hidden">
          <div class="relative z-10">
            <h1 class="text-[120px] font-black uppercase italic font-serif leading-none mb-4">ACOfusion</h1>
            <p class="text-xl font-black tracking-[0.8em] text-[#2563eb] uppercase">SMART MAGNETIC 48V RAIL CONFIGURATOR // UK STANDARDS</p>
          </div>
          <div class="text-right">
             <p class="text-6xl font-mono font-black italic">{{ new Date().toLocaleDateString('en-GB') }}</p>
             <p class="text-[12px] font-black text-[#2563eb] mt-6 tracking-widest uppercase italic">DOC-ID: S10-PRO-{{ Date.now().toString(36).toUpperCase() }}</p>
          </div>
       </header>
       <table class="w-full text-left">
          <tr class="bg-slate-50 border-b-8 border-[#0f172a] text-[12px] font-black uppercase">
             <th class="p-10">Reference</th><th class="p-10 text-center">Qty</th><th class="p-10 text-right">Net Price</th>
          </tr>
          <tr v-for="item in generatedBOM" :key="item.model" class="border-b border-slate-100">
             <td class="p-10"><span class="text-4xl font-black uppercase italic font-serif text-[#0f172a]">{{ item.model }}</span><p class="text-[10px] text-slate-400 font-bold uppercase mt-1">{{ item.description }}</p></td>
             <td class="p-10 text-center font-mono font-black text-6xl italic">x{{ item.quantity }}</td>
             <td class="p-10 text-right font-mono font-black text-4xl italic">£{{ (item.price * item.quantity).toLocaleString() }}</td>
          </tr>
       </table>
       <footer class="mt-40 pt-20 border-t-[10px] border-slate-50 flex justify-between items-end">
          <div class="text-5xl font-black uppercase italic font-serif text-[#0f172a]">ACOfusion Global (UK) Ltd</div>
          <div class="text-right text-[11px] font-mono font-black italic text-slate-300">AUTOMATED B2B ENGINEERING_v2.9</div>
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

::selection { background: var(--primary); color: white; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

body { 
  margin: 0; 
  background: var(--bg-main); 
  color: var(--text-main);
  -webkit-font-smoothing: antialiased; 
  font-family: 'Inter', sans-serif;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

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
}

@media print {
  body { background: white !important; overflow: visible !important; }
  aside, footer, .Transition, #app > div:not(#print-area), button, header { display: none !important; }
  #print-area { display: block !important; position: static !important; width: 100% !important; margin: 0 !important; padding: 40px !important; }
  @page { size: A4 portrait; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}

.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
</style>
