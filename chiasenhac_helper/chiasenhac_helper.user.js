// ==UserScript==
// @name         ChiaSeNhac Helper
// @namespace    https://lelinhtinh.github.io
// @description  Download lossless music directly, bypass sharing dialog.
// @version      1.0.1
// @icon         https://i.imgur.com/HLqWP3g.png
// @author       lelinhtinh
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        https://chiasenhac.vn/*
// @noframes
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {

    const $downLossLess = document.querySelector('a[href="javascript:downLossLessMusic();"]');
    if (!$downLossLess) return;

    let downloadLink = document.querySelector('.download_item').href;
    downloadLink = downloadLink
        .replace(/\/(128|320|m4a|32)\//, '/flac/')
        .replace(/\.(mp3|m4a)$/, '.flac');

    $downLossLess.setAttribute('href', downloadLink);
    $downLossLess.setAttribute('target', '_blank');

}());
