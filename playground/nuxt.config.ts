export default defineNuxtConfig({
  modules: ['../src/module'],
  segment: {
    debugEnabled: true,
    settings: {
      writeKey: '',
    }
  },
  devtools: { enabled: true }
})
