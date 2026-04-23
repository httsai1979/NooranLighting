import { reactive, watch } from 'vue'
import type { ConfigState, Luminaire, Accessory } from './types'

const saved = localStorage.getItem('aco_config')
const initialConfig: ConfigState = saved ? JSON.parse(saved) : {
  mounting: 'Surface/Hanging',
  layout: 'Straight',
  totalLength: 2000,
  selectedLuminaires: []
}

export const store = reactive({
  config: initialConfig,
  catalog: {
    lamps: [] as Luminaire[],
    accessories: [] as Accessory[]
  },
  loading: true,
  
  updateConfig(newConfig: Partial<ConfigState>) {
    Object.assign(this.config, newConfig)
  }
})

watch(() => store.config, (newVal) => {
  localStorage.setItem('aco_config', JSON.stringify(newVal))
}, { deep: true })
