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

  // See: https://segment.com/docs/connections/spec/identify/
  function identify(...args: Parameters<AnalyticsBrowser['identify']>) {
    wrapFn($segment.identify)(...args);
  }

  // See: https://segment.com/docs/connections/spec/alias/
  function alias(...args: Parameters<AnalyticsBrowser['alias']>) {
    wrapFn($segment.alias)(...args);
  }

  // See: https://segment.com/docs/connections/spec/page/
  function page(...args: Parameters<AnalyticsBrowser['page']>) {
    wrapFn($segment.page)(...args);
  }

  // See: https://segment.com/docs/connections/spec/screen/
  function screen(...args: Parameters<AnalyticsBrowser['screen']>) {
    wrapFn($segment.screen)(...args);
  }

  // See: https://segment.com/docs/connections/spec/group/
  function group(...args: Parameters<AnalyticsBrowser['group']>) {
    wrapFn($segment.group)(...args);
  }

  // See: https://segment.com/docs/connections/spec/track/
  function track(...args: Parameters<AnalyticsBrowser['track']>) {
    wrapFn($segment.track)(...args);
  }

  function trackSubmit(...args: Parameters<AnalyticsBrowser['trackSubmit']>) {
    wrapFn($segment.trackSubmit)(...args);
  }

  function trackClick(...args: Parameters<AnalyticsBrowser['trackClick']>) {
    wrapFn($segment.trackClick)(...args);
  }

  function trackLink(...args: Parameters<AnalyticsBrowser['trackLink']>) {
    wrapFn($segment.trackLink)(...args);
  }

  function reset(...args: Parameters<AnalyticsBrowser['reset']>) {
    return wrapFn($segment.reset)(...args);
  }

  function raw(name: string, ...args: any) {
    // @ts-ignore-next-line
    return wrapFn($segment[name])(...args);
  }

  function wrapFn(fn: CallableFunction) {
    return function analyticsFn(...args: any) {
      if (config.debugEnabled) {
        console.log(`[${logPrefix}@raw]`, ...args);
      }
      if (shouldTrack()) {
        return fn(...args);
      }
    }
  }

  return {
    $segment,
    identify,
    alias,
    page,
    screen,
    group,
    track,
    trackSubmit,
    trackClick,
    trackLink,
    reset,
    raw,
  };
}
