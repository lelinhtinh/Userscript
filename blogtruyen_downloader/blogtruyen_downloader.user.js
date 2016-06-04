// ==UserScript==
// @id           blogtruyen-downloader@devs.forumvi.com
// @name         blogtruyen downloader
// @namespace    http://devs.forumvi.com
// @description  Download manga on blogtruyen.com
// @version      1.2.2
// @icon         http://i.imgur.com/qx0kpfr.png
// @author       Zzbaivong
// @license      MIT
// @include      http://blogtruyen.com/truyen/*
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @require      https://greasyfork.org/scripts/19855-jszip/code/jszip.js?version=126859
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=128198
// @noframes
// @connect      blogtruyen.com
// @connect      blogspot.com
// @connect      imgur.com
// @connect      zdn.vn
// @connect      postimg.org
// @connect      photobucket.com
// @connect      zing.vn
// @connect      *
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

jQuery(function ($) {
    'use strict';

    function deferredAddZip(url, filename, current, total, zip, $download) {
        var deferred = $.Deferred();

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            onload: function (response) {
                zip.file(filename, response.response);
                $download.text(counter[current] + '/' + total);
                ++counter[current];
                deferred.resolve(response);
            },
            onerror: function (err) {
                console.error(err);
                deferred.reject(err);
            }
        });

        return deferred;
    }

    function nextDownload() {
        ++nextChapter;
        autoDownload();
    }

    function autoDownload() {
        if (disableDownloadAll) return;
        if (nextChapter >= totalChapter) return;

        $downloadAllText.text((nextChapter + 1) + '/' + totalChapter);

        var $next = $downloadList.eq(nextChapter);
        if ($next.text() !== 'Download') {
            nextDownload();
            return;
        }

        if (nextChapter >= totalChapter) return;

        $next.click();
    }

    function pad(str, max) {
        str = str.toString();
        return str.length < max ? pad('0' + str, max) : str;
    }

    function getChaper(obj) {
        var $this = $(obj.download),
            zip = new JSZip(),
            deferreds = [],
            images = [];

        $this.text('Waiting...');

        obj.contentChap.children('img').each(function (i, v) {
            images[i] = v.src.replace(/^.+&url=/, '');
            images[i] = images[i].replace(/(https?:\/\/)lh(\d)(\.bp\.blogspot\.com)/, '$1$2$3'); // $2 = (Math.floor((Math.random() * 4) + 1))
            // images[i] = images[i].replace(/\d+\.bp\.blogspot\.com/, 'lh' + (Math.floor((Math.random() * 4) + 3)) + '.googleusercontent.com');
            if (images[i].indexOf('blogspot.com') !== -1 && images[i].indexOf('?imgmax=0') === -1) images[i] += '?imgmax=0';
        });

        $.each(images, function (i, v) {
            var filename = v.replace(/\?.+$/, '').replace(/.*\//g, ''),
                filetype = filename.replace(/.*\./g, '');

            if (filetype === filename) filetype = 'jpg';
            filename = pad(i, 3) + '.' + filetype;

            deferreds.push(deferredAddZip(images[i], filename, obj.current, images.length, zip, $this));
        });

        $.when.apply($, deferreds).done(function () {
            $this.text('Complete').css('color', 'orange');
        }).fail(function (err) {
            obj.nameChap = '0__Error__' + obj.nameChap;
            $this.css('color', 'red');
            console.error(err);
        }).always(function () {
            zip.generateAsync({
                type: 'blob'
            }).then(function (blob) {
                var zipName = $.trim(obj.nameChap) + '.zip';

                $this.attr({
                    href: window.URL.createObjectURL(blob),
                    download: zipName
                }).off('click');

                saveAs(blob, zipName);

                doc.title = '[⇓ ' + (++complete) + '/' + progress + '] ' + tit;
            }, function (reason) {
                console.error(reason);
            });
            nextDownload();
            if (--alertUnload <= 0) {
                $(window).off('beforeunload');
            }
        });
    }

    function toggleSkip($btn) {
        if ($btn.text() === 'Skip') {
            $btn.text('Download').css({
                color: 'green',
                'pointer-events': 'auto'
            }).attr('href', '#download');
        } else if ($btn.text() === 'Download') {
            $btn.text('Skip').css({
                color: 'blueviolet',
                'pointer-events': 'none'
            }).attr('href', '#skip');
        }
    }

    var $download = $('<a>', {
            'class': 'chapter-download',
            href: '#download',
            text: 'Download',
            css: {
                color: 'green'
            }
        }),
        counter = [],
        current = 0,
        alertUnload = 0,
        complete = 0,
        progress = 0,
        doc = document,
        tit = doc.title,
        disableDownloadAll = true,
        $downloadAll,
        $downloadAllText,
        $downloadList,
        nextChapter = 0,
        totalChapter = 0;

    window.URL = window.URL || window.webkitURL;

    if (/^\/truyen\/[^\/\n]+\/[^\/\n]+$/.test(location.pathname)) {

        $('.linkchapter select').first().replaceWith($download);

        $download.one('click', function (e) {
            e.preventDefault();

            ++progress;

            $(window).on('beforeunload', function () {
                return 'Progress is running...';
            });
            ++alertUnload;

            counter[current] = 1;
            getChaper({
                download: this,
                contentChap: $('#content'),
                nameChap: $('h1').text(),
                current: current
            });
        });

    } else {

        $('#list-chapters .download').html($download);

        $downloadAll = $('<span>', {
            id: 'DownloadAllButton',
            css: {
                display: 'inline-block',
                borderColor: 'orangered',
                backgroundColor: 'orange'
            },
            html: '<span class="icon-circle-arrows-bottom"></span>'
        });
        $downloadAllText = $('<span>', {
            text: 'Download all'
        });
        $downloadList = $('.chapter-download');
        totalChapter = $downloadList.length;

        $downloadList.one('click', function (e) {
            e.preventDefault();

            ++progress;

            var _this = this,
                $this = $(_this),
                $chapLink = $this.closest('p').find('.title a');

            $this.css('pointer-events', 'none');

            if (alertUnload <= 0) {
                $(window).on('beforeunload', function () {
                    return 'Progress is running...';
                });
            }
            ++alertUnload;

            GM_xmlhttpRequest({
                method: 'GET',
                url: $chapLink.attr('href'),
                responseType: 'text',
                onload: function (response) {
                    var $data = $(response.responseText);

                    counter[current] = 1;
                    getChaper({
                        download: _this,
                        contentChap: $data.find('#content'),
                        nameChap: $chapLink.text(),
                        current: current
                    });
                    ++current;
                },
                onerror: function (err) {
                    console.error(err);
                }
            });
        }).parent().on('contextmenu', function (e) {
            e.preventDefault();

            var $this = $(this),
                $btn = $this.children(),
                indexChapter = $this.closest('p').index();

            if (e.ctrlKey || e.altKey) {
                $downloadList.each(function (i, el) {
                    var $el = $(el);
                    if ((e.ctrlKey && indexChapter >= i) || (e.altKey && indexChapter <= i)) {
                        toggleSkip($el);
                    } else {
                        return true;
                    }
                });
            } else {
                toggleSkip($btn);
            }
        });

        $('.fl-r.like-buttons').append($downloadAll.append($downloadAllText));
        $downloadAll.one('click', function () {
            disableDownloadAll = false;
            autoDownload();
        });

    }

});
