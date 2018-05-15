// ==UserScript==
// @name         TruyenYY downloader
// @namespace    http://devs.forumvi.com/
// @description  Tải truyện từ truyenyy.com định dạng epub
// @version      4.2.1
// @icon         https://i.imgur.com/obHcq8v.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        https://truyenyy.com/truyen/*/
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://unpkg.com/jepub@1.2.0/dist/jepub.min.js
// @require      https://unpkg.com/file-saver@1.3.8/FileSaver.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect      self
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function ($, window, document) {
    'use strict';

    function cleanText(str) {
        return str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
    }

    function downloadError(err, noOutput) {
        downloadStatus('danger');
        titleError.push(chapTitle);
        if (!noOutput) {
            return '<p class="no-indent"><a href="' + referrer + chapId + '">' + err + '</a></p>';
        } else {
            console.error(err);
        }
    }

    function saveEbook() {
        if (endDownload) return;
        endDownload = true;

        if (titleError.length) {
            titleError = '<p class="no-indent"><strong>Các chương lỗi: </strong>' + titleError.join(', ') + '</p>';
        } else {
            titleError = '';
        }
        beginEnd = '<p class="no-indent">Nội dung từ <strong>' + begin + '</strong> đến <strong>' + end + '</strong></p>';

        jepub.notes(beginEnd + titleError + '<br /><br />' + credits);

        jepub.generate().then(function (epubZipContent) {
            document.title = '[⇓] ' + ebookTitle;
            $win.off('beforeunload');

            $download.attr({
                href: window.URL.createObjectURL(epubZipContent),
                download: ebookFilename
            }).html('<i class="iconfont icon-save"></i> Tải xong').off('click');
            if (!$download.hasClass('btn-danger')) downloadStatus('success');

            saveAs(epubZipContent, ebookFilename);
        }).catch(function (err) {
            downloadStatus('danger');
            console.error(err);
        });
    }

    function getContent(pageId) {
        if (endDownload) return;
        chapId = pageId;

        GM.xmlHttpRequest({
            method: 'GET',
            url: pathname + chapId,
            onload: function (response) {
                var $data = $(response.responseText),
                    $chapter = $data.find('#id_chap_content .inner p'),
                    chapContent = [],
                    $next = $data.find('.buttons .btn-primary'),
                    $vip = $data.find('#btn_buy');

                if (endDownload) return;

                chapTitle = $data.find('h1.chapter-title').text().trim();
                if (chapTitle === '') chapTitle = 'Chương ' + chapId.match(/\d+/)[0];

                if ($vip.length) {
                    chapContent = downloadError('Chương VIP');
                } else if (!$chapter.length) {
                    chapContent = downloadError('Không có nội dung');
                } else {
                    downloadStatus('warning');

                    $chapter.each(function () {
                        chapContent.push(cleanText(this.textContent.trim()));
                    });
                }

                jepub.add(chapTitle, chapContent);

                if (count === 0) begin = chapTitle;
                end = chapTitle;
                ++count;

                downloadProgress(count);

                if ($next.hasClass('disabled')) {
                    saveEbook();
                } else {
                    getContent(downloadId($next.attr('href')));
                }
            },
            onerror: function (err) {
                downloadError(err, true);
                saveEbook();
            }
        });
    }


    var pageName = document.title,
        $win = $(window),

        $download = $('.more-buttons').find('a[href$="/epub/"]'),
        downloadStatus = function (status) {
            $download.removeClass('btn-primary btn-success btn-info btn-warning btn-danger').addClass('btn-' + status);
        },
        downloadProgress = function (progress) {
            document.title = '[' + count + '] ' + pageName;
            $download.html('<i class="iconfont icon-more"></i> Đã tải:<span class="pl-2">' + progress + '</span>');
        },
        downloadId = function (url) {
            return url.trim().replace(/^.*\//, '');
        },

        $novelInfo = $('.novel-info'),
        chapId = '',
        chapTitle = '',
        count = 0,
        begin = '',
        end = '',
        endDownload = false,

        ebookTitle = $('h1.name').text().trim(),
        ebookAuthor = $('h2.author').text().trim(),
        // ebookCover = $('.novel-info .zoom-me').attr('src'),
        ebookDesc = $('#id_novel_summary').html(),
        ebookType = [],
        beginEnd = '',
        titleError = [],

        host = location.host,
        pathname = location.pathname,
        referrer = location.protocol + '//' + host + pathname,

        ebookFilename = pathname.slice(8, -1) + '.epub',

        credits = '<p>Truyện được tải từ <a href="' + referrer + '">TruyenYY</a></p><p>Userscript được viết bởi: <a href="https://lelinhtinh.github.io/jEpub/">Zzbaivong</a></p>',

        jepub;


    if (!$novelInfo.length) return;

    var $ebookType = $('a', '.tag-list.list-unstyled.mt-2');
    if ($ebookType.length) $ebookType.each(function () {
        ebookType.push($(this).text().trim());
    });

    jepub = new jEpub({
        title: ebookTitle,
        author: ebookAuthor,
        publisher: host,
        description: ebookDesc,
        tags: ebookType
    }).uuid(referrer);

    $download.addClass('btn btn-primary text-light');
    $download.one('click contextmenu', function (e) {
        e.preventDefault();
        document.title = '[...] Vui lòng chờ trong giây lát';

        var firstChap = $('.info .btn:contains("Đọc Từ Đầu")');
        firstChap = downloadId(firstChap.attr('href'));
        var startFrom = firstChap;

        if (e.type === 'contextmenu') {
            $download.off('click');
            startFrom = prompt('Nhập ID chương truyện bắt đầu tải:', firstChap) || firstChap;
        } else {
            $download.off('contextmenu');
        }

        $win.on('beforeunload', function () {
            return 'Truyện đang được tải xuống...';
        });

        $download.one('click', function (e) {
            e.preventDefault();
            saveEbook();
        });

        getContent(startFrom);
    });

})(jQuery, window, document);
