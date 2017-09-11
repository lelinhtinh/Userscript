// ==UserScript==
// @name         Download nhạc mp3 zing 320kbps
// @namespace    baivong.download.mp3zing
// @description  Download nhạc nhất lượng cao 320kbps tại mp3.zing.vn
// @version      5.4.0
// @icon         http://i.imgur.com/PnF4UN2.png
// @author       Zzbaivong
// @license      MIT
// @match        http://mp3.zing.vn/bai-hat/*
// @match        http://mp3.zing.vn/album/*
// @match        http://mp3.zing.vn/playlist/*
// @match        http://mp3.zing.vn/bang-xep-hang/*
// @match        http://mp3.zing.vn/nghe-si/*
// @match        http://mp3.zing.vn/tim-kiem/bai-hat.html?q=*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=164030
// @noframes
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

    /**
     * Cookie tài khoản VIP
     * 04/10/2017
     */
    var vipKey = 'miup.107493696.0.HpC1cghJzuNgwf-3gjFtXT_Hfbc9CFm2gxSKCFFJzuK';


    GM_addStyle('.bv-icon{background-image:url(http://static.mp3.zdn.vn/skins/zmp3-v4.1/images/icon.png)!important;background-repeat:no-repeat!important;background-position:-25px -2459px!important;}.bv-download{background-color:#721799!important;border-color:#721799!important;}.bv-download span{color:#fff!important;margin-left:8px!important;}.bv-disable,.bv-download:hover{background-color:#2c3e50!important;border-color:#2c3e50!important;}.bv-text{background-image:none!important;color:#fff!important;text-align:center!important;font-size:smaller!important;line-height:25px!important;}.bv-waiting{cursor:wait!important;background-color:#2980b9!important;border-color:#2980b9!important;}.bv-complete,.bv-complete:hover{background-color:#27ae60!important;border-color:#27ae60!important;}.bv-error,.bv-error:hover{background-color:#c0392b!important;border-color:#c0392b!important;}.bv-disable{cursor:not-allowed!important;opacity:0.4!important;}');

    function albumCounter() {
        if (!enableAlbum) return;
        if (!$album.length) return;

        var temp = ++listCurr;
        if (temp === listSize) {
            $btnAll.removeClass('bv-waiting').addClass('bv-disable').off('click');
            $txtAll.text('Đã tải toàn bộ');
            return;
        }

        $txtAll.text('Đã tải ' + temp + '/' + listSize);
        $list.eq(temp).trigger('click');
    }

    function downloadSong(songCode, progress, complete, error) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://mp3.zing.vn/json/song/get-source/' + songCode,
            headers: {
                'Cookie': 'wsid=' + vipKey
            },
            responseType: 'json',

            onload: function (source) {
                var data = source.response.data;

                if (data) data = data[0];
                if (data.source_list && data.source_list.length >= 2 && data.source_list[1] !== '') {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: data.source_list[1],
                        responseType: 'blob',

                        onload: function (source) {
                            complete(source.response, data.link.match(/^\/bai-hat\/([^\/]+)/)[1] + '.mp3');
                            albumCounter();
                        },

                        onprogress: function (e) {
                            if (e.lengthComputable) {
                                progress(Math.floor(e.loaded * 100 / e.total) + '%');
                            } else {
                                progress('');
                            }
                        },

                        onerror: function (e) {
                            console.error(e);
                            error();
                            albumCounter();
                        }
                    });
                } else {
                    error();
                    albumCounter();
                }
            },

            onerror: function (e) {
                console.error(e);
                error();
                albumCounter();
            }
        });
    }

    window.URL = window.URL || window.webkitURL;

    var $largeBtn = $('#tabService');
    if ($largeBtn.length) {
        var songCode = $largeBtn.data('code'),
            $btn = $('<a>', {
                class: 'button-style-1 pull-left bv-download',
                href: '#download',
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
                songCode,
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
            var songCode = $(this).closest('[data-code]').data('code');

            if (songCode !== '') return '<a title="Tải nhạc 320kbps" class="bv-download bv-multi-download bv-icon" href="#download" data-code="' + songCode + '"></a>';
        });

        $('.bv-multi-download').one('click', function (e) {
            e.preventDefault();

            var $this = $(this),
                songCode = $this.data('code');

            $this.addClass('bv-waiting bv-text').text('...').attr({
                href: '#downloading'
            }).off('contextmenu');

            downloadSong(
                songCode,
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


    var $album = $('#playlistItems'),
        $btnAll,
        $txtAll,
        $list,
        listCurr = 0,
        listSize = 0,
        checkList = function () {
            $list = $album.find('.bv-multi-download[href="#download"]');
            listSize = $list.length;

            return listSize > 0;
        },
        enableAlbum;

    if ($album.length) {
        $btnAll = $('<a>', {
            class: 'button-style-1 pull-left bv-download',
            href: '#download-album',
            html: '<i class="zicon icon-dl"></i>'
        });
        $txtAll = $('<span>', {
            text: 'Tải toàn bộ'
        });
        $btnAll.append($txtAll).insertAfter('#tabAdd');

        if (!checkList()) return;

        $list.one('contextmenu', function (e) {
            e.preventDefault();

            $(this).removeClass('bv-multi-download').addClass('bv-disable').attr({
                href: '#download-disabled',
            }).off('click');
        });

        $btnAll.one('click', function (e) {
            e.preventDefault();

            if (!checkList()) {
                $btnAll.addClass('bv-error').off('click');
                $txtAll.text('Không có nhạc cần tải');
                return;
            }

            enableAlbum = true;
            $btnAll.addClass('bv-waiting');
            $txtAll.text('Đang tải...');

            $list.eq(listCurr).trigger('click');
        });
    }

})(jQuery, window, document);
