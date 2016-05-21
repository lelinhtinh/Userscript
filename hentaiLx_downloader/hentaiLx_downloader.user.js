// ==UserScript==
// @id           hentailx-downloader@devs.forumvi.com
// @name         hentaiLx downloader
// @namespace    http://devs.forumvi.com
// @description  Download manga on hentaiLx.com
// @version      1.0.7
// @icon         http://i.imgur.com/ICearPQ.png
// @author       Zzbaivong
// @license      MIT
// @include      http://hentailx.com/*
// @include      http://hentailx.com/doc-truyen/*
// @exclude      http://hentailx.com/
// @exclude      http://hentailx.com/index.aspx
// @exclude      http://hentailx.com/danhsach/*
// @exclude      http://hentailx.com/Theloai/*
// @exclude      http://hentailx.com/trangthai/*
// @exclude      http://hentailx.com/Users/*
// @exclude      http://hentailx.com/dang-ky-thanh-vien.html
// @exclude      http://hentailx.com/nhom-dich/*
// @exclude      http://hentailx.com/Tacgia/*
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @require      https://greasyfork.org/scripts/19855-jszip/code/jszip.js?version=126859
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=126857
// @noframes
// @connect      hentailx.com
// @connect      blogspot.com
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
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

        obj.contentChap.children('img').each(function(i, v) {
            images[i] = v.src;
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

    if (!location.pathname.indexOf('/doc-truyen/')) {

        $('.chapter-info').find('ul').append('<span class="glyphicon glyphicon-save"></span> ').append($download);

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
                contentChap: $('#content_chap'),
                nameChap: $('.link_truyen').eq(0).text() + ' ' + $('.link_truyen').eq(1).text(),
                current: current
            });
        });

    } else {

        $('.chapter-name-label').attr('class', 'chapter-name-label col-xs-6 col-sm-6 col-md-6');
        $('.chap-link').attr('class', 'chap-link col-xs-6 col-sm-6 col-md-6');
        $('.list-group-item').eq(2).append('<div class="col-xs-3 col-sm-3 col-md-3 text-right chapter-view-download">Download</div>');
        $('.item_chap:not(:last)').append($('<span>', {
            'class': 'col-xs-3 col-sm-3 col-md-3 text-right chapter-view-download'
        }).append($download));

        $('.chapter-download').each(function() {

            $(this).one('click', function(e) {
                e.preventDefault();

                ++progress;

                var _this = this,
                    $chapLink = $(_this).closest('.item_chap').find('.chap-link');

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
                            contentChap: $data.filter('#content_chap'),
                            nameChap: $('.breadcrumb').find('.active').text() + ' ' + $chapLink.text(),
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
