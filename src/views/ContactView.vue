<script setup lang="ts">
import { Mail, Smartphone, MessageCircle, MapPin, ChevronRight, ArrowUpRight } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-white py-40 px-6 lg:px-20 font-sans">
    <div class="max-w-7xl mx-auto">
      
      <!-- Primary Contact Header -->
      <header class="max-w-4xl mb-40">
         <h2 class="text-7xl lg:text-[120px] font-serif italic font-black text-zinc-900 leading-[0.8] tracking-tighter">Direct <br/><span class="text-blue-600">Liaison</span>.</h2>
         <p class="text-2xl text-zinc-400 font-light mt-16 leading-relaxed">Systemic architectural support for UK and Global projects. Direct connection to our technical engineering desk.</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-40">
         
         <!-- Liaison Channels -->
         <div class="space-y-24">
            <div class="space-y-12">
               <h4 class="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-300">Technical Desk</h4>
               <div class="flex gap-10 group items-start">
                  <div class="w-24 h-24 bg-zinc-50 flex items-center justify-center rounded-[3rem] group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 shrink-0 shadow-sm border border-zinc-100"><Smartphone size="36"/></div>
                  <div class="space-y-4">
                     <p class="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">Technical Director (UK/Europe)</p>
                     <p class="text-5xl font-black italic font-serif text-zinc-900 leading-none">James Tsai</p>
                     <p class="text-2xl font-bold font-mono">+44-7510-317-505</p>
                  </div>
               </div>
               
               <div class="flex gap-10 group items-start">
                  <div class="w-24 h-24 bg-zinc-50 flex items-center justify-center rounded-[3rem] group-hover:bg-emerald-500 group-hover:text-white transition-all duration-700 shrink-0 shadow-sm border border-zinc-100"><MessageCircle size="36"/></div>
                  <div class="space-y-4">
                     <p class="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">Instant Global Support</p>
                     <a href="https://wa.me/447510317505" target="_blank" class="text-3xl font-black italic font-serif text-zinc-900 hover:text-emerald-500 transition-colors block">WhatsApp Advisor</a>
                     <p class="text-zinc-400 text-sm font-medium">Available 09:00 - 18:00 GMT</p>
                  </div>
               </div>

               <div class="flex gap-10 group items-start">
                  <div class="w-24 h-24 bg-zinc-50 flex items-center justify-center rounded-[3rem] group-hover:bg-zinc-900 group-hover:text-white transition-all duration-700 shrink-0 shadow-sm border border-zinc-100"><Mail size="36"/></div>
                  <div class="space-y-4">
                     <p class="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">Global Service Email</p>
                     <a href="mailto:service@acofusion.com" class="text-3xl font-black italic font-serif text-zinc-900 hover:text-blue-600 transition-colors block">service@acofusion.com</a>
                  </div>
               </div>
            </div>

            <div class="p-12 bg-zinc-50 rounded-[4rem] border border-zinc-100 space-y-6">
               <h5 class="text-xl font-black uppercase italic font-serif text-zinc-900">London Head Office</h5>
               <div class="flex gap-4 items-start text-zinc-400">
                  <MapPin size="20" class="shrink-0 text-blue-600"/>
                  <p class="text-lg font-medium leading-relaxed uppercase">Imperial House, <br/>London, United Kingdom</p>
               </div>
            </div>
         </div>

         <!-- Project Inquiry Form (Pro style) -->
         <div class="bg-zinc-950 p-16 lg:p-24 rounded-[6rem] shadow-3xl text-white relative overflow-hidden">
            <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-transparent"></div>
            <h4 class="text-4xl font-black font-serif italic mb-12">Submit Project Detail</h4>
            
            <form @submit.prevent class="space-y-10">
               <div class="space-y-4">
                  <label class="text-[9px] font-black uppercase tracking-widest text-white/30">Liaison Information</label>
                  <input type="text" placeholder="Full Name / Architectural Firm" class="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 outline-none focus:border-blue-600 transition-all font-bold" />
                  <input type="email" placeholder="Professional Email" class="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 outline-none focus:border-blue-600 transition-all font-bold" />
               </div>
               <div class="space-y-4">
                  <label class="text-[9px] font-black uppercase tracking-widest text-white/30">Project Scope</label>
                  <select class="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 outline-none focus:border-blue-600 transition-all font-bold appearance-none">
                     <option>Residential Luxury</option>
                     <option>Commercial / Retail</option>
                     <option>Gallery / Exhibition</option>
                  </select>
               </div>
               <div class="pt-10">
                  <button class="w-full py-10 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[13px] shadow-2xl hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-6 group">
                     Initialise Liaison <ArrowUpRight class="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
               </div>
            </form>
         </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
select option { background: #000; color: #fff; }
</style>
