import { useNuxtApp, useRuntimeConfig } from '#imports';
import type { AnalyticsBrowser } from '@segment/analytics-next';
import type {} from '@segment/analytics-core';

export function useSegment(segment?: AnalyticsBrowser) {
  const $segment = segment ?? useNuxtApp().$segment as AnalyticsBrowser;
  const config = useRuntimeConfig().public.segment;
  const logPrefix = shouldTrack() ? 'segment' : 'segment-mock';

  function shouldTrack() {
    return process.client && (process.env.NODE_ENV !== 'development' || config.trackDevMode);
  }

  function identify(...args: Parameters<AnalyticsBrowser['identify']>) {
    if (config.debugEnabled) {
      console.log(`[${logPrefix}@identify]`, ...args);
    }
    if (shouldTrack()) {
      return $segment.identify(...args);
    }
  }

  function page(...args: Parameters<AnalyticsBrowser['page']>) {
    if (config.debugEnabled) {
      console.log(`[${logPrefix}@page]`, ...args);
    }
    if (shouldTrack()) {
      return $segment.page(...args);
    }
  }

  function track(...args: Parameters<AnalyticsBrowser['track']>) {
    if (shouldTrack()) {
      if (config.debugEnabled) {
        console.log(`[${logPrefix}@track]`, ...args);
      }
      return $segment.track(...args);
    }
  }

  function trackSubmit(...args: Parameters<AnalyticsBrowser['trackSubmit']>) {
    if (shouldTrack()) {
      if (config.debugEnabled) {
        console.log(`[${logPrefix}@trackSubmit]`, ...args);
      }
      return $segment.trackSubmit(...args);
    }
  }

  function trackClick(...args: Parameters<AnalyticsBrowser['trackClick']>) {
    if (shouldTrack()) {
      if (config.debugEnabled) {
        console.log(`[${logPrefix}@trackClick]`, ...args);
      }
      return $segment.trackClick(...args);
    }
  }

  function trackLink(...args: Parameters<AnalyticsBrowser['trackLink']>) {
    if (shouldTrack()) {
      if (config.debugEnabled) {
        console.log(`[${logPrefix}@trackLink]`, ...args);
      }
      return $segment.trackLink(...args);
    }
  }

  function raw(name: string, ...args: any) {
    if (shouldTrack()) {
      if (config.debugEnabled) {
        console.log(`[${logPrefix}@raw]`, ...args);
      }
      // @ts-ignore
      $segment[name](...args);
    }
  }

  return {
    $segment,
    identify,
    page,
    track,
    trackSubmit,
    trackClick,
    trackLink,
    raw,
  };
}
