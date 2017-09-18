// ==UserScript==
// @name         Download nhạc mp3 zing 320kbps
// @namespace    baivong.download.mp3zing
// @description  Nghe và tải nhạc nhất lượng cao 320kbps tại mp3.zing.vn
// @version      5.6.2
// @icon         http://i.imgur.com/PnF4UN2.png
// @author       Zzbaivong
// @license      MIT
// @match        http://mp3.zing.vn/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
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


    GM_addStyle('.bv-icon{background-image:url(http://static.mp3.zdn.vn/skins/zmp3-v4.1/images/icon.png)!important;background-repeat:no-repeat!important;background-position:-25px -2459px!important;}.bv-download{background-color:#721799!important;border-color:#721799!important;}.bv-download span{color:#fff!important;margin-left:8px!important;}.bv-disable,.bv-download:hover{background-color:#2c3e50!important;border-color:#2c3e50!important;}.bv-text{background-image:none!important;color:#fff!important;text-align:center!important;font-size:smaller!important;line-height:25px!important;}.bv-waiting{cursor:wait!important;background-color:#2980b9!important;border-color:#2980b9!important;}.bv-complete,.bv-complete:hover{background-color:#27ae60!important;border-color:#27ae60!important;}.bv-error,.bv-error:hover{background-color:#c0392b!important;border-color:#c0392b!important;}.bv-disable{cursor:not-allowed!important;opacity:0.4!important;}.zm-quanlity-display{font-size:0!important}.zm-quanlity-display::after{content:"320kbps";font-size:12px!important}.zm-quanlity .zm-tooltip{display:none!important}');

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

        if ($list.eq(temp).attr('href') !== '#download') {
            albumCounter();
            return;
        }
        multiDownloads($list.eq(temp));
    }

    function getData(callback, songCode) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: songCode ? '/json/song/get-source/' + songCode : $('#zplayerjs-wrapper').attr('data-xml'),
            headers: {
                'Cookie': 'wsid=' + vipKey
            },
            responseType: 'json',

            onload: function (source) {
                var data = source.response.data;
                if (data && data.length) {
                    callback(data);
                } else {
                    callback();
                }
            },

            onerror: function (e) {
                console.error(e);
                callback();
            }
        });
    }

    function downloadSong(url, name, progress, complete, error) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'blob',

            onload: function (source) {
                complete(source.response, name + '.mp3');
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
    }

    function baiHat() {
        var $largeBtn = $('#tabService'),
            $btn = $('<a>', {
                class: 'button-style-1 pull-left bv-download',
                href: '#download',
                html: '<i class="zicon icon-dl"></i>'
            }),
            $txt = $('<span>', {
                text: 'Tải nhạc 320kbps'
            }),
            downloadFail = function () {
                $btn.removeClass('bv-waiting').addClass('bv-error');
                $txt.text('Lỗi! Không tải được');
            };

        $largeBtn.replaceWith($btn.append($txt));

        getData(function (data) {
            if (data && data[0].source_list && data[0].source_list.length >= 2 && data[0].source_list[1] !== '') {
                $('#zplayerjs').attr('src', data[0].source_list[1]);

                $btn.attr({
                    'data-name': data[0].link.match(/^\/bai-hat\/([^\/]+)/)[1],
                    'data-mp3': data[0].source_list[1]
                });
            } else {
                downloadFail();
                return;
            }
        });

        $btn.one('click', function (e) {
            e.preventDefault();

            $btn.addClass('bv-waiting');
            $txt.text('Chờ một chút...');

            downloadSong(
                $btn.data('mp3'),
                $btn.data('name'),
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
                    downloadFail();
                }
            );
        });
    }

    function multiDownloads($btn) {
        $btn.addClass('bv-waiting bv-text').text('...').attr({
            href: '#downloading'
        });

        downloadSong(
            $btn.data('mp3'),
            $btn.data('name'),
            function (percent) {
                if (percent !== '') {
                    $btn.text(percent);
                }
            },
            function (blob, fileName) {
                $btn.attr({
                    href: window.URL.createObjectURL(blob),
                    download: fileName
                }).removeClass('bv-waiting bv-text').addClass('bv-complete').text('').off('click');

                saveAs(blob, fileName);
            },
            function () {
                $btn.removeClass('bv-waiting bv-text').addClass('bv-error').text('');
            }
        );
    }

    function album() {
        getData(function (data) {
            var playlist = window.eval('window.playlist;'),
                download = function (e) {
                    e.preventDefault();
                    multiDownloads($(this));
                };

            if (data) $album.find('.fn-dlsong').each(function (i, v) {
                if (data[i].source_list && data[i].source_list.length >= 2 && data[i].source_list[1] !== '') {
                    playlist[i].sourceLevel[0].source = data[i].source_list[1];
                    $(v).replaceWith('<a title="Tải nhạc 320kbps" class="bv-download bv-album-download bv-icon" href="#download" data-name="' + data[i].link.match(/^\/bai-hat\/([^\/]+)/)[1] + '" data-mp3="' + data[i].source_list[1] + '"></a>');
                }
            });

            window.eval('var disableRePlaying; player2.on("play", function(){ if (!disableRePlaying) { $(".fn-name", ".playing.fn-current").click(); disableRePlaying = true; } });');

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

            $list.on('contextmenu', function (e) {
                e.preventDefault();
                var $this = $(this),
                    href = $this.attr('href');

                if (href === '#download') {
                    $this.addClass('bv-disable').attr({
                        href: '#download-disabled',
                    }).off('click', download);
                } else if (href === '#download-disabled') {
                    $this.removeClass('bv-disable').attr({
                        href: '#download',
                    }).one('click', download);
                }
            }).one('click', download);

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

                $list.off('click');

                listCurr = 0;
                multiDownloads($list.eq(listCurr));
            });
        });
    }

    function checkPath(key) {
        return (location.pathname.indexOf('/' + key + '/') === 0);
    }


    window.URL = window.URL || window.webkitURL;

    if (checkPath('bai-hat')) baiHat();

    var $album = $('#playlistItems'),
        $btnAll,
        $txtAll,
        $list,
        listCurr = 0,
        listSize = 0,
        checkList = function () {
            $list = $album.find('.bv-album-download[href="#download"]');
            listSize = $list.length;

            return listSize > 0;
        },
        enableAlbum;
    if (checkPath('album') || checkPath('playlist')) album();

    $(document).on('mouseenter', 'li[data-code]', function (e) {
        e.preventDefault();
        var $this = $(this),
            $btn = $this.find('.fn-dlsong');

        if ($this.closest('#playlistItems').length) return;
        if ($this.data('code') === '') return;
        if (!$btn.length) return;

        $btn.replaceWith(function () {
            return '<a title="Tải nhạc 320kbps" class="bv-download bv-multi-download bv-icon" href="#download" data-code="' + $this.data('code') + '"></a>';
        });
    }).on('click', '.bv-multi-download', function (e) {
        e.preventDefault();
        var $this = $(this);

        getData(function (data) {
            if (data && data[0].source_list && data[0].source_list.length >= 2 && data[0].source_list[1] !== '') {
                $this.attr({
                    'data-name': data[0].link.match(/^\/bai-hat\/([^\/]+)/)[1],
                    'data-mp3': data[0].source_list[1]
                });
                multiDownloads($this);
            } else {
                $this.removeClass('bv-waiting bv-text').addClass('bv-error').text('');
            }
        }, $this.data('code'));
    });

})(jQuery, window, document);
