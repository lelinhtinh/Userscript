// ==UserScript==
// @name        hentaiLxers downloader
// @namespace   http://devs.forumvi.com
// @description Download manga on hentaiLxers.info
// @include     http://hentailxers.info/*
// @include     http://hentailxers.info/chap/*
// @exclude     http://hentailxers.info/
// @exclude     http://hentailxers.info/?s=*
// @exclude     http://hentailxers.info/category/*
// @exclude     http://hentailxers.info/tag/*
// @exclude     http://hentailxers.info/tac-gia/*
// @exclude     http://hentailxers.info/nguoi-dich/*
// @version     1.0.2
// @author      Zzbaivong
// @require     https://code.jquery.com/jquery-2.2.0.min.js
// @require     https://openuserjs.org/src/libs/baivong/jszip.min.js
// @require     https://openuserjs.org/src/libs/baivong/FileSaver.min.js
// @grant       GM_xmlhttpRequest
// ==/UserScript==

jQuery(function($) {
    'use strict';

    function deferredAddZip(url, filename, current, total, zip, $download) {
        var deferred = $.Deferred();

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            onload: function(response) {
                zip.file(filename, response.response);
                $download.text(counter[current] + '/' + total);
                ++counter[current];
                deferred.resolve(response);
            },
            onerror: function(err) {
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

        obj.contentChap.find('img').each(function(i, v) {
            images[i] = this.src.replace(/^https:\/\//, 'http://');
        });

        $.each(images, function(i, v) {
            var filename = v.replace(/.*\//g, '');

            deferreds.push(deferredAddZip(images[i], filename, obj.current, images.length, zip, $this));
        });

        $.when.apply($, deferreds).done(function() {
            var blob = zip.generate({
                    type: 'blob'
                }),
                zipName = obj.nameChap.replace(/\s/g, '_') + '.zip';

            $this.text('Complete').css('color', 'green').attr({
                href: window.URL.createObjectURL(blob),
                download: zipName
            }).off('click');

            saveAs(blob, zipName);

            doc.title = '[⇓ ' + (++complete) + '/' + progress + '] ' + tit;

        }).fail(function(err) {
            $this.text('Fail').css('color', 'red');
            console.error(err);
        }).always(function() {
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

    if (!location.pathname.indexOf('/chap/')) {

        $('h2.title').after($('<p>', {
            'class': 'chapter-view-download'
        }).append($download));

        $download.one('click', function(e) {
            e.preventDefault();

            ++progress;

            $download.attr('href', '#download');

            $(window).on('beforeunload', function() {
                return 'Progress is running...';
            });
            ++alertUnload;

            counter[current] = 1;
            getChaper({
                download: this,
                contentChap: $('#content'),
                nameChap: $('h1.title').text() + ' ' + $('h2.title').text(),
                current: current
            });
        });

    } else {

        var $table = $('.table-striped');
        if (!$table.length) {
            return;
        }

        $table.find('tr:first-child').append('<th>Download</th>');
        $table.find('tr:not(:first-child)').append($('<td>', {
            'class': 'chapter-view-download'
        }).append($download));

        $('.chapter-download').each(function() {

            $(this).one('click', function(e) {
                e.preventDefault();

                ++progress;

                var _this = this,
                    $chapLink = $(_this).closest('tr').find('td:eq(1)').find('a');

                $(_this).attr('href', '#download');

                if (alertUnload <= 0) {
                    $(window).on('beforeunload', function() {
                        return 'Progress is running...';
                    });
                }
                ++alertUnload;

                GM_xmlhttpRequest({
                    method: 'GET',
                    url: $chapLink.attr('href'),
                    responseType: 'text',
                    onload: function(response) {
                        var $data = $(response.responseText);

                        counter[current] = 1;
                        getChaper({
                            download: _this,
                            contentChap: $data.find('#content'),
                            nameChap: $('h1.title').text() + ' ' + $chapLink.text(),
                            current: current
                        });
                        ++current;
                    },
                    onerror: function(err) {
                        console.error(err);
                    }
                });
            });
        });

    }

});
