// ==UserScript==
// @name         Download nhạc mp3 zing 320kbps
// @namespace    baivong.download.mp3zing
// @description  Download nhạc nhất lượng cao 320kbps tại mp3.zing.vn
// @version      5.0.0
// @icon         http://i.imgur.com/PnF4UN2.png
// @author       Zzbaivong
// @license      MIT
// @match        http://mp3.zing.vn/bai-hat/*
// @match        http://mp3.zing.vn/album/*
// @match        http://mp3.zing.vn/playlist/*
// @match        http://mp3.zing.vn/nghe-si/*
// @match        http://mp3.zing.vn/tim-kiem/bai-hat.html?q=*
// @match        http://mp3.zing.vn/bang-xep-hang/*
// @match        https://linksvip.net/*
// @require      https://greasyfork.org/scripts/5392-waitforkeyelements/code/WaitForKeyElements.js
// @noframes
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/* global waitForKeyElements */
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
        window.open('https://linksvip.net/?link=http://mp3.zing.vn/bai-hat/-/' + songId + '.html', 'mp3Zing320Helper_' + songId, 'height=10,width=10,left=0,top=99999,titlebar=no,toolbar=no,status=no,toolbar=no,scrollbars=no,menubar=no,location=no');
    }

    function postMessage(type) {
        var message = {
            id: window.name.split('_')[1],
            class: type
        };
        opener.postMessage(message, 'http://mp3.zing.vn');

        window.close();
    }

    function onMessage(e) {
        if (e.origin !== 'https://linksvip.net') return;

        $('.bv-download[data-id="' + e.data.id + '"]').removeClass('bv-waiting').addClass('bv-' + e.data.class);
    }

    if (location.host === 'mp3.zing.vn') {

        window.addEventListener('message', onMessage, true);

        addStyle('.bv-icon{background-image:url(http://static.mp3.zdn.vn/skins/zmp3-v4.1/images/icon.png)!important;background-repeat:no-repeat!important;background-position:-25px -2459px!important;}.bv-download{background-color:#721799!important;border-color:#721799!important;}.bv-download span{color:#fff!important;margin-left:8px!important;}.bv-disable,.bv-download:hover{background-color:#2c3e50!important;border-color:#2c3e50!important;}.bv-text{background-image:none!important;color:#fff!important;text-align:center!important;font-size:smaller!important;line-height:25px!important;}.bv-waiting{cursor:wait!important;background-color:#2980b9!important;border-color:#2980b9!important;}.bv-complete,.bv-complete:hover{background-color:#27ae60!important;border-color:#27ae60!important;}.bv-error,.bv-error:hover{background-color:#c0392b!important;border-color:#c0392b!important;}.bv-disable{cursor:not-allowed!important;opacity:0.4!important;}');

        if (location.pathname.indexOf('/bai-hat/') === 0) {
            var $btn = $('<a>', {
                    'class': 'button-style-1 pull-left bv-download',
                    href: '#download',
                    'data-id': location.pathname.match(/\/(\w+)\.html/)[1],
                    html: '<i class="zicon icon-dl"></i>'
                }),
                $txt = $('<span>', {
                    text: 'Tải nhạc 320kbps'
                });

            $('#tabService').replaceWith($btn.append($txt));
        } else {
            $('.fn-dlsong').replaceWith(function () {
                var songId = $(this).data('item').slice(5);

                return '<a title="Tải nhạc 320kbps" class="bv-download bv-icon" href="#download" data-id="' + songId + '"></a>';
            });
        }

        $('.bv-download').on('click', function (e) {
            e.preventDefault();
            var $this = $(this);

            $this.removeClass('bv-waiting bv-complete bv-error').addClass('bv-waiting');
            linksVip($(this).data('id'));
        });

    } else {

        if (window.name.indexOf('mp3Zing320') !== 0) return;

        if (location.pathname.indexOf('/thankyou/') === 0) {
            window.setTimeout(function () {
                postMessage('complete');
            }, 1000);
        } else {
            waitForKeyElements('#option_result .fa-cloud-download', function () {
                var $link = $('#option_result a:contains(320 Kbps)');

                if ($link.length) {
                    window.location.assign($link.attr('href'));
                } else {
                    postMessage('error');
                }
            });
        }

    }

})(jQuery, window, document);
