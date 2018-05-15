// ==UserScript==
// @name         Wallpaperscraft downloader
// @namespace    http://baivong.github.io/
// @version      2.0.0
// @description  1-Click download on Wallpaperscraft. You should select the resolution before downloading.
// @icon         http://i.imgur.com/NA96TWE.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @include      https://wallpaperscraft.com/*
// @exclude      https://wallpaperscraft.com/wallpaper/*
// @exclude      https://wallpaperscraft.com/download/*
// @require      https://unpkg.com/file-saver@1.3.8/FileSaver.min.js
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
    var list = document.querySelectorAll('.wallpapers__link');
    if (!/\d+x\d+/.test(resolution)) resolution = screen.width + 'x' + screen.height;

    [].forEach.call(list, function (link) {
        var info = link.querySelector('.wallpapers__info'),
            infoContent = info.innerHTML,
            img = link.querySelector('img'),
            imgName,
            res;

        res = !info ? resolution : info.textContent.match(/\d+x\d+/)[0];

        if (!img) return;
        img = img.src.replace(/\d+x\d+/, res);
        imgName = img.replace(/.*\//, '');

        link.addEventListener('click', function (e) {
            e.preventDefault();
            info.innerHTML = 'Downloading...';

            fetch(img).then(function (response) {
                if (response.ok) return response.blob();
                throw 'Network response was not ok.';
            }).then(function (blob) {
                info.innerHTML = infoContent;
                link.setAttribute('href', URL.createObjectURL(blob));
                link.setAttribute('download', imgName);

                saveAs(blob, imgName);
            });
        });

        link.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            GM.openInTab(img);
        });

        link.setAttribute('title', 'Click to download this image\nRight Click to open in new tab');
    });
})();
