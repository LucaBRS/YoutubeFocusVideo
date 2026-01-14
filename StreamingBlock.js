// ==UserScript==
// @name         Focus Gate - Streaming Block
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Blocks streaming sites (from window.notAllowedStreamingSite) and shows a gate with 2 choices
// @match        *://*/*
// @require      https://raw.githubusercontent.com/LucaBRS/YoutubeFocusVideo/main/channels.js
// @grant        none
// @author Luca Barsottini
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

  const allowedLearningSite = (window.allowedLearningSite || [])
    .map(u => String(u).trim())
    .filter(u => /^https?:\/\//i.test(u));

  const notAllowedStreamingSite = new Set(
    (window.notAllowedStreamingSite || [])
      .map(d => String(d).trim().toLowerCase())
      .filter(Boolean)
  );

  function hostMatches(domainSet, host) {
    for (const d of domainSet) {
      if (host === d || host.endsWith('.' + d)) return true;
    }
    return false;
  }

  const host = location.host.toLowerCase();
  const isBlocked = notAllowedStreamingSite.size && hostMatches(notAllowedStreamingSite, host);
  if (!isBlocked) return;

  const allowKey = '__focus_allow_host__:' + location.host;
  try {
    if (sessionStorage.getItem(allowKey) === '1') return; // già sbloccato per questa tab
  } catch {}

  function showGateOverlay() {
    if (document.getElementById('__focus_gate_overlay__')) return;

    const overlay = document.createElement('div');
    overlay.id = '__focus_gate_overlay__';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; background: rgba(0,0,0,0.86); color: #fff;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      width: min(760px, 100%);
      background: rgba(18,18,18,0.96);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 18px; padding: 22px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;

    const title = document.createElement('div');
    title.textContent = 'vuoi veramente perdere tempo ora e non investirlo in modo piu intelligente?';
    title.style.cssText = `font-size: 22px; line-height: 1.3; margin-bottom: 14px; font-weight: 800;`;

    const sub = document.createElement('div');
    sub.textContent = `Blocco attivo (${FOCUS_START_HOUR}:00–${FOCUS_END_HOUR}:00). Dominio: ${location.host}`;
    sub.style.cssText = `opacity: 0.9; margin-bottom: 18px; font-size: 13px;`;

    const row = document.createElement('div');
    row.style.cssText = `display:flex; gap:12px; flex-wrap:wrap;`;

    const btnBad = document.createElement('button');
    btnBad.type = 'button';
    btnBad.textContent = 'voglio farmi male ed essere un coglione';
    btnBad.style.cssText = `
      flex: 1 1 280px; padding: 12px 14px; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.08);
      color: #fff; cursor: pointer; font-size: 14px; font-weight: 700;
    `;

    const btnGood = document.createElement('button');
    btnGood.type = 'button';
    btnGood.textContent = 'no, voglio imparare, crescere e diventare un fenomeno';
    btnGood.style.cssText = `
      flex: 1 1 280px; padding: 12px 14px; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.22);
      background: rgba(255,255,255,0.14);
      color: #fff; cursor: pointer; font-size: 14px; font-weight: 800;
    `;

    btnBad.addEventListener('click', () => {
      try { sessionStorage.setItem(allowKey, '1'); } catch {}
      overlay.remove();
      document.documentElement.style.overflow = '';
    });

    btnGood.addEventListener('click', () => {
      const list = allowedLearningSite.length ? allowedLearningSite : ['https://developer.mozilla.org/'];
      const pick = list[Math.floor(Math.random() * list.length)];
      location.href = pick;
    });

    row.appendChild(btnBad);
    row.appendChild(btnGood);

    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(row);
    overlay.appendChild(card);

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.appendChild(overlay);
  }

  showGateOverlay();
})();
