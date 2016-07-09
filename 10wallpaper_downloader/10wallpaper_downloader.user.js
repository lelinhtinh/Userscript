// ==UserScript==
// @name         10wallpaper downloader
// @namespace    http://baivong.github.io/
// @version      1.0.0
// @description  1-Click download on 10wallpaper. You should select the resolution before downloading.
// @icon         http://i.imgur.com/08zfJez.png
// @author       Zzbaivong
// @license      MIT
// @match        http://10wallpaper.com/*
// @noframes
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Resolution config:
    var resolution = ''; // Eg: 1920x1200, 1366x768, 1280x1024, ...


    // Do not change the code below this line, unless you know how.
    var list = document.querySelectorAll('a[href^="/view/"], a[href^="/list/"]');
    if(!/\d+x\d+/.test(resolution)) resolution = screen.width + 'x' + screen.height;
    [].forEach.call(list, function (item) {
        var img = item.querySelector('img');
        if (!img) return;

        item.setAttribute('href', img.src.replace(/(\/|_)(small|medium)(\/|\.)/g, '$1' + resolution + '$3'));
        item.setAttribute('download', '');
    });
})();
