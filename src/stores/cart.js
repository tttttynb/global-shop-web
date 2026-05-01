import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const itemCount = ref(0)

  function setCount(count) {
    itemCount.value = count
  }

  function increment() {
    itemCount.value++
  }

  return { itemCount, setCount, increment }
})
