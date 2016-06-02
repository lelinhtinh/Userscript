// ==UserScript==
// @id           blogtruyen-downloader@devs.forumvi.com
// @name         blogtruyen downloader
// @namespace    http://devs.forumvi.com
// @description  Download manga on blogtruyen.com
// @version      1.0.0
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

    function getChaper(obj) {
        var $this = $(obj.download),
            zip = new JSZip(),
            deferreds = [],
            images = [];

        $this.text('Waiting...');

        obj.contentChap.children('img').each(function (i, v) {
            images[i] = v.src.replace(/\?imgmax=0/, '').replace(/.+&url=/, '');
            // .replace(/\d+\.bp\.blogspot\.com/, 'lh3.googleusercontent.com')
        });

        $.each(images, function (i, v) {
            var filename = v.replace(/.*\//g, '');

            deferreds.push(deferredAddZip(images[i], filename, obj.current, images.length, zip, $this));
        });

        $.when.apply($, deferreds).done(function () {
            zip.generateAsync({
                type: 'blob'
            }).then(function (blob) {
                var zipName = $.trim(obj.nameChap) + '.zip';

                $this.text('Complete').css('color', 'orange').attr({
                    href: window.URL.createObjectURL(blob),
                    download: zipName
                }).off('click');

                saveAs(blob, zipName);

                doc.title = '[⇓ ' + (++complete) + '/' + progress + '] ' + tit;
            }, function (reason) {
                console.error(reason);
            });
        }).fail(function (err) {
            $this.text('Fail').css('color', 'red');
            console.error(err);
        }).always(function () {
            if (--alertUnload <= 0) {
                $(window).off('beforeunload');
            }
        });
    }

    var $download = $('<a>', {
            'class': 'chapter-download',
            href: '#download',
            text: 'Download'
        }),
        counter = [],
        current = 0,
        alertUnload = 0,
        complete = 0,
        progress = 0,
        doc = document,
        tit = doc.title;

    window.URL = window.URL || window.webkitURL;

    if (/\/chap-\d+$/.test(location.pathname)) {

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

        $('.chapter-download').each(function () {

            $(this).one('click', function (e) {
                e.preventDefault();

                ++progress;

                var _this = this,
                    $chapLink = $(_this).closest('p').find('.title a');

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
            });
        });

    }

});
