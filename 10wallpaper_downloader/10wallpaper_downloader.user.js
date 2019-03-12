// ==UserScript==
// @name         10wallpaper downloader
// @namespace    http://baivong.github.io/
// @version      2.1.5
// @description  1-Click download on 10wallpaper. You should select the resolution before downloading.
// @icon         http://i.imgur.com/08zfJez.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        http://10wallpaper.com/*
// @match        http://www.10wallpaper.com/*
// @match        https://10wallpaper.com/*
// @match        https://www.10wallpaper.com/*
// @require      https://unpkg.com/file-saver@2.0.1/dist/FileSaver.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect      self
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.openInTab
// @grant        GM_openInTab
// ==/UserScript==

(function () {
    'use strict';

    /**
     * Resolution config
     * @type {String} // Eg: 1920x1200, 1366x768, 1280x1024, ...
     */
    var resolution = '';


    // Do not change the code below this line, unless you know how.
    var list = document.querySelectorAll('a[href^="/view/"]'),
        res = location.pathname.match(/\d+x\d+/);
    if (!/\d+x\d+/.test(resolution)) resolution = screen.width + 'x' + screen.height;
    res = !res ? resolution : res[0];

    [].forEach.call(list, function (link) {
        var info = link.querySelector('span'),
            infoContent = info.innerHTML,
            img = link.querySelector('img'),
            imgName;

        if (!img) return;
        img = img.src.replace(/(\/|_)(small|medium)(\/|\.)/g, '$1' + res + '$3');
        imgName = img.replace(/.*\//, '');

        link.addEventListener('click', function (e) {
            e.preventDefault();
            info.innerHTML = 'Downloading...';

            GM.xmlHttpRequest({
                method: 'GET',
                url: img,
                responseType: 'blob',
                onprogress: function (e) {
                    var percent = Math.round((e.loaded / e.total) * 100);
                    info.innerHTML = percent + ' %';
                },
                onload: function (response) {
                    if (response.status !== 200) {
                        info.innerHTML = '<span style="color:red">' + res + ' resolution is not available</span>';
                        return;
                    }

                    var blob = response.response;

                    info.innerHTML = infoContent;
                    link.setAttribute('href', URL.createObjectURL(blob));
                    link.setAttribute('download', imgName);

                    saveAs(blob, imgName);
                },
                onerror: function (err) {
                    info.innerHTML = '<span style="color:red">' + err.message + '</span>';
                    console.error(err);
                }
            });
        });

        link.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            GM.openInTab(img);
        });

        link.setAttribute('title', 'Click to download this image\nRight Click to open in new tab');
    });
})();
