import { defu } from 'defu'
import { createResolver, addImportsDir, addPlugin, defineNuxtModule } from '@nuxt/kit'
import { name, version } from '../package.json'
import { setupDevToolsUI } from './devtools';
import { RouteLocationNormalized } from 'vue-router';

export interface ModuleOptions {
  /**
   * Whether to show debug logs for the module
   */
  debugEnabled: boolean

  /**
   * Whether events shall be tracked when running the site in development mode
   *
   * @default false
   */
  trackDevMode: boolean

  /**
   * Whether trackPageView should be automatically integrated with the router
   *
   * @default true
   */
  enableRouterSync: boolean

  /**
   * Enable Nuxt Devtools integration
   *
   * @default true
   */
  devtools: boolean

  /**
   * Ignore some router views from being tracked - used when enableRouterSync is true
   */
  ignoredViews: string[] | ((to: RouteLocationNormalized, from: RouteLocationNormalized) => boolean)

  /**
   * Derive additional event data after navigation
   */
  vueRouterAdditionalEventData?: (to: RouteLocationNormalized, from: RouteLocationNormalized) => Record<string, any> | Promise<Record<string, any>>;

  /**
   * Whether or not call `trackView` in `Vue.nextTick`
   */
  trackOnNextTick: boolean

  /**
   * Settings for Segment
   *
   * @default {}
   */
  settings: {
    /**
     * Your segment write key - required
     */
    writeKey: string

    /**
     * The CDN URL to use, if not the default. Using 'undefined' will default to that specified by segment, i.e. https://cdn.segment.com
     *
     * @default undefined
     */
    cdnURL?: string
  }

  /**
   * Options for Segment
   *
   * @default {}
   */
  options: {
    /**
     * The API host where the events will be sent to
     *
     * @default undefined
     */
    apiHost?: string

    /**
     * The protocol for the API host. Use with options.apiHost
     *
     * @default undefined
     */
    protocol?: 'http' | 'https'
  }
}

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    segment: ModuleOptions
  }
  interface NuxtConfig {
    segment?: ModuleOptions
  }
  interface NuxtOptions {
    segment?: ModuleOptions
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'segment',
    compatibility: {
      nuxt: '^3'
    }
  },
  defaults: {
    debugEnabled: false,
    devtools: true,
    enableRouterSync: true,
    trackDevMode: false,
    ignoredViews: [],
    trackOnNextTick: false,
    settings: {
      writeKey: '',
    },
    options: {},
  },
  setup (options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add module options to public runtime config
    const moduleOptions: ModuleOptions = defu(
      nuxt.options.runtimeConfig.public.segment,
      options
    )

    nuxt.options.runtimeConfig.public.segment = moduleOptions

    // Transpile runtime
    nuxt.options.build.transpile.push(resolver.resolve('./runtime'))

    addImportsDir(resolver.resolve('./runtime/composables'))

    addPlugin({
      src: resolver.resolve('./runtime/plugin.client'),
      mode: 'client',
    })

    if (options.devtools) {
      setupDevToolsUI(nuxt, resolver)
    }
  }
})
