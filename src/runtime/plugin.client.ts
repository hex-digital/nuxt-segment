import { AnalyticsBrowser } from '@segment/analytics-next';
import { useRoute, useRouter, defineNuxtPlugin, nextTick } from '#imports';
import type { ModuleOptions } from '../module';
import { NavigationFailureType, NavigationFailure, RouteLocationNormalized } from 'vue-router';
import { useSegment } from './composables/useSegment';

let segment: AnalyticsBrowser;
let debugEnabled = false;
let trackOnNextTick = false;
let deriveAdditionalEventData: ModuleOptions['vueRouterAdditionalEventData'] = () => ({});

export default defineNuxtPlugin((nuxt) => {
  const config = nuxt.$config.public.segment;

  debugEnabled = config.debugEnabled ?? false;
  trackOnNextTick = config.trackOnNextTick;
  deriveAdditionalEventData = config.vueRouterAdditionalEventData || deriveAdditionalEventData;

  if (!process.client) {
    return {};
  }

  if (!config.settings.writeKey) {
    console.log(`[segment]: settings.writeKey is empty - cannot initialise segment plugin`);
    return {};
  }

  const settings = config.settings;
  const options = config.options;

  let integrations = {};
  if (options?.apiHost || options?.protocol) {
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
    initVueRouterTracking(config.ignoredViews);
  }

  return {
    provide: {
      segment,
    }
  };
});

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

function fullUrlFromRoute(route: RouteLocationNormalized, baseUrl = '') {
  let fullUrl: string = baseUrl;
  if (!fullUrl.endsWith('/')) {
    fullUrl += '/';
  }
  fullUrl += route.fullPath.startsWith('/')
    ? route.fullPath.substring(1)
    : route.fullPath;

  return fullUrl;
}

function isIgnoredRoute(ignoredViews: ModuleOptions['ignoredViews'], to: RouteLocationNormalized, from?: RouteLocationNormalized) {
  if (!to.name) {
    return typeof ignoredViews === 'function' && ignoredViews(to, from);
  }

  if (typeof to.name !== 'string') {
    return false;
  }

  const isIgnoredView = Array.isArray(ignoredViews) && ignoredViews.includes(to.name);

  return typeof ignoredViews === 'function' ? ignoredViews(to, from) : isIgnoredView;
}

async function initVueRouterTracking(ignoredViews: ModuleOptions['ignoredViews']) {
  const router = useRouter();

  const baseUrl: string = router.options?.history?.base ?? '';

   router.afterEach(async (to, from, failure) => {
    if (isIgnoredRoute(ignoredViews, to, from)) {
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

    const fullToUrl = fullUrlFromRoute(to, baseUrl);
    const fullFromUrl = fullUrlFromRoute(from, baseUrl);

    const properties = {
      path: fullToUrl,
      title: to.name,
      url: fullToUrl,
      referrer: fullFromUrl,
      ...additionalEventData,
    };

    trackRoute('screenViewed', name, properties);
  });
}

async function trackRoute(category: string, name: string, properties?: any) {
  const { page: trackPage } = useSegment(segment);

  if (trackOnNextTick) {
    void nextTick(() => {
      trackPage('screenViewed', name, properties);
    });
  } else {
    await trackPage('screenViewed', name, properties);
  }
}

function trackNameFromRoute(to: RouteLocationNormalized): string {
  // Dispatch vue event using meta segment value if defined otherwise fallback to route name, or finally route path
  const name = to.meta && typeof to.meta.segment === 'string' && !!to.meta.segment
    ? to.meta.segment
    : to.name as string | undefined;

  return name ?? to.path;
}
