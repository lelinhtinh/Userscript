// ==UserScript==
// @name         Download nhạc mp3 zing 320kbps
// @namespace    baivong.download.mp3zing
// @description  Download nhạc nhất lượng cao 320kbps tại mp3.zing.vn
// @version      5.2.0
// @icon         http://i.imgur.com/PnF4UN2.png
// @author       Zzbaivong
// @license      MIT
// @match        http://mp3.zing.vn/bai-hat/*
// @match        http://mp3.zing.vn/album/*
// @match        http://mp3.zing.vn/playlist/*
// @match        http://mp3.zing.vn/nghe-si/*
// @match        http://mp3.zing.vn/tim-kiem/bai-hat.html?q=*
// @match        http://mp3.zing.vn/bang-xep-hang/*
// @noframes
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function ($, window, document) {
    'use strict';

    function addStyle(css) {
        var head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        head.appendChild(style);
    }

    function linksVip(songId) {
        return 'https://linksvip.net/download/zingmp3.php?code=' + songId + '&q=320';
    }

    addStyle('.bv-icon{background-image:url(http://static.mp3.zdn.vn/skins/zmp3-v4.1/images/icon.png)!important;background-repeat:no-repeat!important;background-position:-25px -2459px!important;}.bv-download{background-color:#721799!important;border-color:#721799!important;}.bv-download span{color:#fff!important;margin-left:8px!important;}.bv-disable,.bv-download:hover{background-color:#2c3e50!important;border-color:#2c3e50!important;}.bv-text{background-image:none!important;color:#fff!important;text-align:center!important;font-size:smaller!important;line-height:25px!important;}.bv-waiting{cursor:wait!important;background-color:#2980b9!important;border-color:#2980b9!important;}.bv-complete,.bv-complete:hover{background-color:#27ae60!important;border-color:#27ae60!important;}.bv-error,.bv-error:hover{background-color:#c0392b!important;border-color:#c0392b!important;}.bv-disable{cursor:not-allowed!important;opacity:0.4!important;}');

    if (location.pathname.indexOf('/bai-hat/') === 0) {
        $('#tabService').replaceWith('<a class="button-style-1 pull-left bv-download" href="' + linksVip(location.pathname.match(/\/(\w+)\.html/)[1]) + '"><i class="zicon icon-dl"></i><span>Tải nhạc 320kbps</span></a>');
    } else {
        $('.fn-dlsong').replaceWith(function () {
            return '<a title="Tải nhạc 320kbps" class="bv-download bv-icon" href="' + linksVip($(this).data('item').slice(5)) + '"></a>';
        });
    }

})(jQuery, window, document);
