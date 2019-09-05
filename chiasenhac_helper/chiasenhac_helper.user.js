// ==UserScript==
// @name         ChiaSeNhac Helper
// @namespace    https://lelinhtinh.github.io
// @description  Download lossless music directly, bypass sharing dialog.
// @version      1.1.0
// @icon         https://i.imgur.com/HLqWP3g.png
// @author       lelinhtinh
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        https://chiasenhac.vn/*
// @match        https://*.chiasenhac.vn/*
// @noframes
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const getFlacLink = downloadLink => downloadLink
        .replace(/\/(128|320|m4a|32)\//, '/flac/')
        .replace(/\.(mp3|m4a)$/, '.flac');

    const $downLossLess = document.querySelector('a.download_item[href="javascript:downLossLessMusic();"]');

    if ($downLossLess) {
        $downLossLess.setAttribute('href', getFlacLink(document.querySelector('a.download_item').href));
        $downLossLess.setAttribute('target', '_blank');
    } else {

        const $down500kbps = document.querySelector('a.download_item[href*="/m4a/"]');
        if (!$down500kbps) return;

        const $parent = $down500kbps.parentNode;
        let tempSize = $down500kbps.textContent.trim().match(/([\d.]+)\sMB$/)[1];

        tempSize = Number(tempSize) * 2.4;
        tempSize = parseFloat(tempSize).toFixed(2);

        $parent.insertAdjacentHTML('afterEnd', `
            <li>
                <a class="download_item" target="_blank" href="${getFlacLink($down500kbps.href)}" title="${$down500kbps.title}">
                    <i class="material-icons">file_download</i> Link tải nhạc <span class="c4">FLAC Lossless</span> ${tempSize} MB
                </a>
            </li>
        `);

    }

}());
