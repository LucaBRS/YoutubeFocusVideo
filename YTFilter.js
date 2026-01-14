// ==UserScript==
// @name         Focus Filter - YouTube Whitelist
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  YouTube: show only allowed channels or keywords (from channels.js) during focus hours
// @match        https://www.youtube.com/*
// @require      https://raw.githubusercontent.com/LucaBRS/YoutubeFocusVideo/main/channels.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Orari focus
  const FOCUS_START_HOUR = 8;
  const FOCUS_END_HOUR = 18;

  function inFocusHours() {
    const h = new Date().getHours();
    return h >= FOCUS_START_HOUR && h < FOCUS_END_HOUR;
  }
  if (!inFocusHours()) return;

  const allowedChannels = (window.allowedChannels || []).map(s => String(s).toLowerCase());
  const allowedKeywords = (window.allowedKeywords || []).map(s => String(s).toLowerCase());

  // Selettori corretti per i blocchi video
  const VIDEO_SELECTORS = [
    'ytd-rich-grid-media',         // Home feed
    'ytd-video-renderer',          // Search results
    'ytd-compact-video-renderer',  // Related sidebar
    'ytd-grid-video-renderer',     // Channel grid
    'ytd-playlist-video-renderer'  // Playlist page
  ].join(',');

  const PROCESSED = 'data-focus-checked';

  function isAllowed(title, channel) {
    const t = String(title || '').toLowerCase();
    const c = String(channel || '').toLowerCase();
    return (
      allowedChannels.some(x => x && c.includes(x)) ||
      allowedKeywords.some(x => x && t.includes(x))
    );
  }

  function isShort(item) {
    return !!item.querySelector('a[href*="/shorts/"]');
  }

  function getTitle(item) {
    return (
      item.querySelector('a#video-title')?.textContent?.trim() ||
      item.querySelector('#video-title')?.textContent?.trim() ||
      ''
    );
  }

  function getChannel(item) {
    return (
      item.querySelector('ytd-channel-name a')?.textContent?.trim() ||
      item.querySelector('#channel-name a')?.textContent?.trim() ||
      item.querySelector('#channel-name')?.textContent?.trim() ||
      ''
    );
  }

  function processItem(item) {
    if (!item || item.nodeType !== 1) return;
    if (item.getAttribute(PROCESSED) === '1') return;

    if (isShort(item)) {
      item.style.display = 'none';
      item.setAttribute(PROCESSED, '1');
      return;
    }

    const title = getTitle(item);
    const channel = getChannel(item);

    // se non sono ancora pronti, non bloccare e non segnare: riproverà al prossimo scan
    if (!title || !channel) return;

    if (!isAllowed(title, channel)) {
      item.style.display = 'none';
    }

    item.setAttribute(PROCESSED, '1');
  }

  function scan() {
    document.querySelectorAll(VIDEO_SELECTORS).forEach(processItem);
  }

  // throttle
  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      scan();
    }, 200);
  }

  // Start
  scan();

  // Observe DOM changes
  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // YouTube SPA navigation
  document.addEventListener('yt-navigate-finish', scheduleScan, true);
  window.addEventListener('popstate', scheduleScan, true);
})();
