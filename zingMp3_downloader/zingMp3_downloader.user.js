// ==UserScript==
// @name         Download nhạc mp3 zing 320kbps
// @namespace    baivong.download.mp3zing
// @description  Download nhạc nhất lượng cao 320kbps tại mp3.zing.vn
// @version      5.2.2
// @icon         http://i.imgur.com/PnF4UN2.png
// @author       Zzbaivong
// @license      MIT
// @match        http://mp3.zing.vn/*
// @match        https://mp3.zing.vn/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=164030
// @noframes
// @connect      linksvip.net
// @connect      zing.vn
// @connect      zadn.vn
// @connect      zdn.vn
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function ($, window, document) {
    'use strict';

    GM_addStyle('.bv-icon{background-image:url(http://static.mp3.zdn.vn/skins/zmp3-v4.1/images/icon.png)!important;background-repeat:no-repeat!important;background-position:-25px -2459px!important;}.bv-download{background-color:#721799!important;border-color:#721799!important;}.bv-download span{color:#fff!important;margin-left:8px!important;}.bv-disable,.bv-download:hover{background-color:#2c3e50!important;border-color:#2c3e50!important;}.bv-text{background-image:none!important;color:#fff!important;text-align:center!important;font-size:smaller!important;line-height:25px!important;}.bv-waiting{cursor:wait!important;background-color:#2980b9!important;border-color:#2980b9!important;}.bv-complete,.bv-complete:hover{background-color:#27ae60!important;border-color:#27ae60!important;}.bv-error,.bv-error:hover{background-color:#c0392b!important;border-color:#c0392b!important;}.bv-disable{cursor:not-allowed!important;opacity:0.4!important;}');

    function linksVip(songId) {
        return 'https://linksvip.net/download/zingmp3.php?code=' + songId + '&q=320';
    }

    function downloadSong(songId, progress, complete, error) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: linksVip(songId),
            responseType: 'blob',

            onload: function (source) {
                complete(source.response, source.finalUrl.split('filename=')[1]);
            },

            onprogress: function (e) {
                if (e.total) {
                    progress(Math.floor(e.loaded * 100 / e.total) + '%');
                } else {
                    progress('');
                }
            },

            onerror: function (e) {
                console.error(e);
                error();
            }
        });
    }

    window.URL = window.URL || window.webkitURL;

    var $largeBtn = $('#tabService');
    if ($largeBtn.length) {
        var songId = location.pathname.match(/\/(\w+)\.html/)[1],
            $btn = $('<a>', {
                'class': 'button-style-1 pull-left bv-download',
                href: linksVip(songId),
                html: '<i class="zicon icon-dl"></i>'
            }),
            $txt = $('<span>', {
                text: 'Tải nhạc 320kbps'
            });

        $largeBtn.replaceWith($btn.append($txt));

        $btn.one('click', function (e) {
            e.preventDefault();

            $btn.addClass('bv-waiting');
            $txt.text('Chờ một chút...');

            downloadSong(
                songId,
                function (percent) {
                    $txt.text('Đang tải... ' + percent);
                },
                function (blob, fileName) {
                    $btn.attr({
                        href: window.URL.createObjectURL(blob),
                        download: fileName
                    }).removeClass('bv-waiting').addClass('bv-complete').off('click');
                    $txt.text('Nhấn để tải nhạc');

                    saveAs(blob, fileName);
                },
                function () {
                    $btn.removeClass('bv-waiting').addClass('bv-error');
                    $txt.text('Lỗi! Không tải được');
                }
            );
        });
    }

    function multiDownloads() {
        var $smallBtn = $('.fn-dlsong');
        if (!$smallBtn.length) return;

        $smallBtn.replaceWith(function () {
            var songId = $(this).closest('li, .item-song').attr('id').replace(/(chartitem)?song(rec)?/, '');

            return '<a title="Tải nhạc 320kbps" class="bv-download bv-icon" href="' + linksVip(songId) + '" data-id="' + songId + '"></a>';
        });

        $('.bv-download').one('click', function (e) {
            e.preventDefault();

            var $this = $(this),
                songId = $this.data('id');

            $this.addClass('bv-waiting bv-text').text('...');

            downloadSong(
                songId,
                function (percent) {
                    if (percent !== '') {
                        $this.text(percent);
                    }
                },
                function (blob, fileName) {
                    $this.attr({
                        href: window.URL.createObjectURL(blob),
                        download: fileName
                    }).removeClass('bv-waiting bv-text').addClass('bv-complete').text('').off('click');

                    saveAs(blob, fileName);
                },
                function () {
                    $this.removeClass('bv-waiting bv-text').addClass('bv-error').text('');
                }
            );
        });
    }

    multiDownloads();
    $(document).on('ready', multiDownloads);
    $(window).on('load', multiDownloads);

})(jQuery, window, document);
