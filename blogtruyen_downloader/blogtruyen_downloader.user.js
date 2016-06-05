// ==UserScript==
// @id           blogtruyen-downloader@devs.forumvi.com
// @name         blogtruyen downloader
// @namespace    http://devs.forumvi.com
// @description  Download manga on blogtruyen.com
// @version      1.3.0
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
// @connect      tinypic.com
// @connect      *
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

jQuery(function ($) {
    'use strict';

    var changeHost = false,
        configs = {
            lang: {
                DOWNLOADALL: 'Tải xuống tất cả',
                DOWNLOAD: 'Tải xuống',
                WAITING: 'Đang tải',
                COMPLETE: 'Tải xong',
                SKIP: 'Không tải',
                ERROR: 'Bị lỗi',
                WARNING: 'Quá trình tải chưa hoàn thành.'
            },
            color: {
                DOWNLOAD: 'green',
                WAITING: 'gray',
                COMPLETE: 'orange',
                SKIP: 'blueviolet',
                ERROR: 'red'
            },
            notify: {
                content: 'Tải xuống hoàn tất',
                icon: 'http://i.imgur.com/qx0kpfr.png'
            }
        };

    function deferredAddZip(url, filename, current, total, zip, $download) {
        var deferred = $.Deferred();

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            onload: function (response) {
                zip.file(filename, response.response);
                ++counter[current];
                deferred.resolve(response);
            },
            onerror: function (err) {
                console.error(err);
                deferred.reject(err);
            },
            onreadystatechange: function () {
                $download.text((counter[current] - 1) + '/' + total);
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
        if ($next.text() !== configs.lang.DOWNLOAD) {
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

    function updateTitle() {
        doc.title = '[' + complete + '/' + progress + '] ' + tit;
    }

    function notiDisplay() {
        if (!allowNotification) return;

        new Notification(comicName, {
            body: configs.notify.content,
            icon: configs.notify.icon
        }).onclick = function () {
            this.close();
        };
    }

    function getChaper(obj) {
        var $this = $(obj.download),
            $contents = obj.contentChap.find('img'),
            zip = new JSZip(),
            deferreds = [],
            images = [];

        if (!$contents.length) {
            $this.text(configs.lang.ERROR).css({
                color: configs.color.ERROR,
                'pointer-events': 'none'
            }).attr('href', '#error');

            deferreds[0] = function () {
                return $.Deferred().reject($contents);
            }();
        } else {
            $this.text(configs.lang.WAITING).css('color', configs.color.WAITING);

            $contents.each(function (i, v) {
                images[i] = v.src.replace(/^.+&url=/, '');
                images[i] = images[i].replace(/(https?:\/\/)lh(\d)(\.bp\.blogspot\.com)/, '$1$2$3'); // $2 = (Math.floor((Math.random() * 4) + 1))
                images[i] = images[i].replace(/\?.+$/, '');
                if (images[i].indexOf('blogspot.com') !== -1) images[i] += '?imgmax=0';
                if (changeHost) images[i] = images[i].replace(/(lh)?\d+\.bp\.blogspot\.com/, 'lh' + (Math.floor((Math.random() * 4) + 3)) + '.googleusercontent.com');
            });

            $.each(images, function (i, v) {
                var filename = v.replace(/\?.+$/, '').replace(/.*\//g, ''),
                    filetype = filename.replace(/.*\./g, '');

                if (filetype === filename) filetype = 'jpg';
                filename = pad(i, 3) + '.' + filetype;

                deferreds.push(deferredAddZip(images[i], filename, obj.current, images.length, zip, $this));
            });
        }

        $.when.apply($, deferreds).done(function () {
            $this.text(configs.lang.COMPLETE).css({
                color: configs.color.COMPLETE,
                'pointer-events': 'auto'
            });
        }).fail(function (err) {
            obj.nameChap = '0__Error__' + obj.nameChap;
            $this.css('color', configs.color.ERROR);
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

                ++complete;
                updateTitle();

                if (complete === progress) notiDisplay();
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
        if ($btn.text() === configs.lang.SKIP) {
            $btn.text(configs.lang.DOWNLOAD).css({
                color: configs.color.DOWNLOAD,
                'pointer-events': 'auto'
            }).attr('href', '#download');
        } else if ($btn.text() === configs.lang.DOWNLOAD) {
            $btn.text(configs.lang.SKIP).css({
                color: configs.color.SKIP,
                'pointer-events': 'none'
            }).attr('href', '#skip');
        }
    }

    function warningClose() {
        $(window).on('beforeunload', function () {
            return configs.lang.WARNING;
        });
    }

    var $download = $('<a>', {
            'class': 'chapter-download',
            href: '#download',
            text: configs.lang.DOWNLOAD,
            css: {
                color: configs.color.DOWNLOAD
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
        totalChapter = 0,
        allowNotification = true,
        comicName;

    Notification.requestPermission(function (result) {
        if (result === 'denied') {
            allowNotification = false;
            return;
        } else if (result === 'default') {
            allowNotification = false;
            return;
        }
        allowNotification = true;
    });
    if (Notification.permission !== 'denied') Notification.requestPermission();

    window.URL = window.URL || window.webkitURL;

    if (/^\/truyen\/[^\/\n]+\/[^\/\n]+$/.test(location.pathname)) {
        comicName = $('h1').text();

        $('.linkchapter select').first().replaceWith($download);

        $download.one('click', function (e) {
            e.preventDefault();

            ++progress;

            warningClose();
            ++alertUnload;

            counter[current] = 1;
            getChaper({
                download: this,
                contentChap: $('#content'),
                nameChap: comicName,
                current: current
            });
        });

    } else {
        comicName = $('#breadcrumbs').text().trim().split(' > ')[1];

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
            text: configs.lang.DOWNLOADALL
        });
        $downloadList = $('.chapter-download');
        totalChapter = $downloadList.length;

        $downloadList.one('click', function (e) {
            e.preventDefault();

            ++progress;
            updateTitle();

            var _this = this,
                $this = $(_this),
                $chapLink = $this.closest('p').find('.title a');

            $this.css('pointer-events', 'none');

            if (alertUnload <= 0) warningClose();
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
