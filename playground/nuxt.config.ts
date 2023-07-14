export default defineNuxtConfig({
  modules: ['../src/module'],
  segment: {
    debugEnabled: true,
    settings: {
      writeKey: 'ObMCL6UtA5YhaHqVh2dOV37ieOETaOSD',
    }
  },
  devtools: { enabled: true }
})
