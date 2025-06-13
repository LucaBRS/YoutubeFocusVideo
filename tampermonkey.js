// ==UserScript==
// @name         YouTube Filter - Custom Channels
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Only show allowed channels or keywords
// @match        https://www.youtube.com/*
// @require      https://raw.githubusercontent.com/LucaBRS/YoutubeFocusVideo/main/channels.js
// @grant        none
// @author       Luca Barsottini
// ==/UserScript==

(function () {
    'use strict';

    const hour = new Date().getHours();
    if (hour < 8 || hour >= 18) return;

    const allowedChannels = window.allowedChannels || [];
    const allowedKeywords = window.allowedKeywords || [];

    const isAllowedVideo = (title, channel) =>
        allowedChannels.some(c => channel.includes(c)) ||
        allowedKeywords.some(k => title.includes(k));

    const observer = new MutationObserver(() => {
        // Main feed
        document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer').forEach(item => {
            const title = item.querySelector('#video-title')?.textContent.trim() || '';
            const channel = item.querySelector('ytd-channel-name, #channel-name')?.textContent.trim() || '';
            if (!isAllowedVideo(title, channel) || item.innerHTML.toLowerCase().includes('shorts')) {
                item.style.display = 'none';
            }
        });

        // Sidebar
        document.querySelectorAll('#secondary ytd-compact-video-renderer').forEach(item => {
            const title = item.querySelector('#video-title')?.textContent.trim() || '';
            const channel = item.querySelector('#channel-name')?.textContent.trim() || '';
            if (!isAllowedVideo(title, channel)) {
                item.style.display = 'none';
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
