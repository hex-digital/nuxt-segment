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
    wrapFn('identify')(...args);
  }

  // See: https://segment.com/docs/connections/spec/alias/
  function alias(...args: Parameters<AnalyticsBrowser['alias']>) {
    wrapFn('alias')(...args);
  }

  // See: https://segment.com/docs/connections/spec/page/
  function page(...args: Parameters<AnalyticsBrowser['page']>) {
    wrapFn('page')(...args);
  }

  // See: https://segment.com/docs/connections/spec/screen/
  function screen(...args: Parameters<AnalyticsBrowser['screen']>) {
    wrapFn('screen')(...args);
  }

  // See: https://segment.com/docs/connections/spec/group/
  function group(...args: Parameters<AnalyticsBrowser['group']>) {
    wrapFn('group')(...args);
  }

  // See: https://segment.com/docs/connections/spec/track/
  function track(...args: Parameters<AnalyticsBrowser['track']>) {
    wrapFn('track')(...args);
  }

  function trackSubmit(...args: Parameters<AnalyticsBrowser['trackSubmit']>) {
    wrapFn('trackSubmit')(...args);
  }

  function trackClick(...args: Parameters<AnalyticsBrowser['trackClick']>) {
    wrapFn('trackClick')(...args);
  }

  function trackLink(...args: Parameters<AnalyticsBrowser['trackLink']>) {
    wrapFn('trackLink')(...args);
  }

  // See: https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#reset-or-log-out
  function reset(...args: Parameters<AnalyticsBrowser['reset']>) {
    return wrapFn('reset')(...args);
  }

  function raw(name: string, ...args: any) {
    return wrapFn('raw')(...args);
  }

  function wrapFn(fnName: string) {
    return function analyticsFn(...args: any) {
      if (config.debugEnabled) {
        console.log(`[${logPrefix}@${fnName}]`, ...args);
      }
      if (shouldTrack()) {
        // @ts-ignore-next-line
        return $segment[fnName](...args);
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
