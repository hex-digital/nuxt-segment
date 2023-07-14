import { AnalyticsBrowser } from '@segment/analytics-next';
import { defineNuxtPlugin, nextTick } from '#imports';
import { ModuleOptions } from '../module';
import { useRouter } from 'nuxt/app';
import { NavigationFailureType, NavigationFailure, RouteLocationNormalized, Router } from 'vue-router';
import { useSegment } from './composables/useSegment';

let segment: AnalyticsBrowser;
let debugEnabled = false;
let deriveAdditionalEventData: ModuleOptions['vueRouterAdditionalEventData'] = () => ({});
let trackOnNextTick = false;

export default defineNuxtPlugin((nuxt) => {
  const config = nuxt.$config.public.segment;
  debugEnabled = config.debugEnabled;
  trackOnNextTick = config.trackOnNextTick;
  deriveAdditionalEventData = config.vueRouterAdditionalEventData || deriveAdditionalEventData;

  if (process.client && config.settings.writeKey) {

    const settings = config.settings;
    const options = config.options;

    let integrations = {};
    if (options.apiHost || options.protocol) {
      integrations = {
        integrations: {
          'Segment.io': {
            apiHost: options.apiHost,
            protocol: options.protocol || 'https',
          }
        }
      };
    }

    segment = AnalyticsBrowser.load(settings, integrations);

    if (config.enableRouterSync) {
      const router = useRouter();
      initVueRouterTracking(router, config.ignoredViews);
    }

    return {
      provide: {
        segment,
      }
    };
  }

  return {};
});

function initVueRouterTracking(router: Router, ignoredViews: ModuleOptions['ignoredViews']) {
  function isNavigationFailure(
    failure: void | NavigationFailure | undefined,
    navigationFailureType:
      | NavigationFailureType.aborted
      | NavigationFailureType.cancelled
      | NavigationFailureType.duplicated,
  ): boolean {
    if (!(failure instanceof Error)) {
      return false;
    }
    return !!(failure.type & navigationFailureType);
  }

  function fullUrlFromRoute(route: RouteLocationNormalized) {
    let fullUrl: string = baseUrl;
    if (!fullUrl.endsWith('/')) {
      fullUrl += '/';
    }
    fullUrl += route.fullPath.startsWith('/')
      ? route.fullPath.substring(1)
      : route.fullPath;

    return fullUrl;
  }

  function trackNameFromRoute(to: RouteLocationNormalized): string {
    // Dispatch vue event using meta segment value if defined otherwise fallback to route name, or finally route path
    const name = to.meta && typeof to.meta.segment === 'string' && !!to.meta.segment
      ? to.meta.segment
      : to.name as string | undefined;

    return name ?? to.path;
  }

  const { page: trackPage } = useSegment(segment);

  const baseUrl: string = router.options?.history?.base ?? '';

  router.afterEach(async (to, from, failure) => {
    // Ignore some routes
    if (
      typeof to.name !== 'string' ||
      (Array.isArray(ignoredViews) && ignoredViews.includes(to.name)) ||
      (typeof ignoredViews === 'function' && ignoredViews(to, from))
    ) {
      return;
    }

    const name: string = trackNameFromRoute(to);


    if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
      if (debugEnabled) {
        console.log(`[Segment]: '${name}' not tracked due to navigation aborted`);
      }
    } else if (isNavigationFailure(failure, NavigationFailureType.cancelled)) {
      if (debugEnabled) {
        console.log(`[Segment]: '${name}' not tracked due to navigation cancelled`);
      }
    }

    const additionalData = deriveAdditionalEventData ? await deriveAdditionalEventData(to, from) : {};

    const additionalEventData: Record<string, any> = {
      ...(additionalData),
      ...(to.meta?.segmentAdditionalEventData as Record<string, any>),
    };

    const fullToUrl = fullUrlFromRoute(to);
    const fullFromUrl = fullUrlFromRoute(from);

    const properties = {
      path: fullToUrl,
      title: to.name,
      url: fullToUrl,
      referrer: fullFromUrl,
      ...additionalEventData,
    };

    if (trackOnNextTick) {
      void nextTick(() => {
        trackPage('screenViewed', name, properties);
      });
    } else {
      await trackPage('screenViewed', name, properties);
    }
  });
}
