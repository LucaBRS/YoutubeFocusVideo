// ==UserScript==
// @name         YouTube Focus Mode - Whitelist Only
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Show only allowed channels or keywords during focus hours
// @match        https://www.youtube.com/*
// @require      https://raw.githubusercontent.com/LucaBRS/YoutubeFocusVideo/main/channels.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // =========================
  // CONFIG
  // =========================
  const FOCUS_START_HOUR = 8;
  const FOCUS_END_HOUR = 18;

  const hour = new Date().getHours();
  if (hour < FOCUS_START_HOUR || hour >= FOCUS_END_HOUR) return;

  const allowedChannels = (window.allowedChannels || []).map(c => c.toLowerCase());
  const allowedKeywords = (window.allowedKeywords || []).map(k => k.toLowerCase());

  const VIDEO_SELECTORS = [
    'ytd-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-playlist-video-renderer'
  ].join(',');

  const PROCESSED = 'data-focus-checked';

  function isAllowed(title, channel) {
    title = title.toLowerCase();
    channel = channel.toLowerCase();

    return (
      allowedChannels.some(c => channel.includes(c)) ||
      allowedKeywords.some(k => title.includes(k))
    );
  }

  function isShort(item) {
    const link = item.querySelector('a[href]');
    return link && link.href.includes('/shorts/');
  }

  function processItem(item) {
    if (!item || item.nodeType !== 1) return;
    if (item.getAttribute(PROCESSED)) return;
    item.setAttribute(PROCESSED, '1');

    // Blocca Shorts
    if (isShort(item)) {
      item.style.display = 'none';
      return;
    }

    const title =
      item.querySelector('#video-title')?.textContent?.trim() || '';

    const channel =
      item.querySelector('ytd-channel-name a')?.textContent?.trim() ||
      item.querySelector('#channel-name a')?.textContent?.trim() ||
      '';

    if (!title || !channel) return;

    if (!isAllowed(title, channel)) {
      item.style.display = 'none';
    }
  }

  function scan() {
    document.querySelectorAll(VIDEO_SELECTORS).forEach(processItem);
  }

  // prima scansione
  scan();

  // observer
  const observer = new MutationObserver(() => {
    scan();
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
