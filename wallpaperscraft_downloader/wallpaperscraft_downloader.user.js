// ==UserScript==
// @name         Wallpaperscraft downloader
// @namespace    http://baivong.github.io/
// @version      1.0.0
// @description  1-Click download on Wallpaperscraft. You should select the resolution before downloading.
// @icon         http://i.imgur.com/NA96TWE.png
// @author       Zzbaivong
// @license      MIT
// @include      https://wallpaperscraft.com/*
// @exclude      https://wallpaperscraft.com/wallpaper/*
// @exclude      https://wallpaperscraft.com/download/*
// @noframes
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var list = document.querySelectorAll('.wallpaper_pre');
    [].forEach.call(list, function(item) {
        var link = item.querySelector('a'),
            res = item.querySelector('.pre_size');

        if (!res) res = item.querySelector('.preview_size');

        link.setAttribute('href', link.href.replace(/\/\d+x\d+$/, '').replace(/\/(download|wallpaper)\//, '/image/') + '_' + res.textContent + '.jpg');
        link.setAttribute('download', '');
    });
})();
