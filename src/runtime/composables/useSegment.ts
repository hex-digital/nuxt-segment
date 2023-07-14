import { useNuxtApp, useRuntimeConfig } from '#imports'
import { AnalyticsBrowser } from '@segment/analytics-next';

export function useSegment(segment?: AnalyticsBrowser) {
  const $segment = segment ?? useNuxtApp().$segment as AnalyticsBrowser;
  const config = useRuntimeConfig().public.segment;

  function shouldTrack() {
    return process.client && (process.env.NODE_ENV !== 'development' || config.trackDevMode);
  }

  function identify(...args: Parameters<AnalyticsBrowser['identify']>) {
    if (shouldTrack()) {
      return $segment.identify(...args)
    }
  }
  function page(...args: Parameters<AnalyticsBrowser['page']>) {
    if (shouldTrack()) {
      return $segment.page(...args)
    }
  }
  function track(...args: Parameters<AnalyticsBrowser['track']>) {
    if (shouldTrack()) {
      return $segment.track(...args)
    }
  }
  function trackSubmit(...args: Parameters<AnalyticsBrowser['trackSubmit']>) {
    if (shouldTrack()) {
      return $segment.trackSubmit(...args)
    }
  }
  function trackClick(...args: Parameters<AnalyticsBrowser['trackClick']>) {
    if (shouldTrack()) {
      return $segment.trackClick(...args)
    }
  }
  function trackLink(...args: Parameters<AnalyticsBrowser['trackLink']>) {
    if (shouldTrack()) {
      return $segment.trackLink(...args)
    }
  }

  function raw(name: string, ...args: any) {
    if (shouldTrack()) {
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
  }
}
