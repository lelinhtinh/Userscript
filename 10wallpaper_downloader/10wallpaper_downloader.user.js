// ==UserScript==
// @name         10wallpaper downloader
// @namespace    http://baivong.github.io/
// @version      1.2.0
// @description  1-Click download on 10wallpaper. You should select the resolution before downloading.
// @icon         http://i.imgur.com/08zfJez.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        http://10wallpaper.com/*
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        GM_openInTab
// @grant        GM.openInTab
// ==/UserScript==

(function () {
    'use strict';

    /**
     * Resolution config
     * @type {String} // Eg: 1920x1200, 1366x768, 1280x1024, ...
     */
    var resolution = '';


    // Do not change the code below this line, unless you know how.
    var list = document.querySelectorAll('a[href^="/view/"], a[href^="/list/"]');
    if (!/\d+x\d+/.test(resolution)) resolution = screen.width + 'x' + screen.height;

    [].forEach.call(list, function (link) {
        var img = link.querySelector('img');

        if (!img) return;
        img = img.src.replace(/(\/|_)(small|medium)(\/|\.)/g, '$1' + resolution + '$3');

        link.setAttribute('href', img);
        link.setAttribute('download', '');

        link.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            GM.openInTab(img);
        });

        link.setAttribute('title', 'Click to download this image\nRight Click to open in new tab');
    });
})();
