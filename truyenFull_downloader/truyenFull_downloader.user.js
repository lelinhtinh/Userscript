// ==UserScript==
// @name         TruyenFull downloader
// @namespace    https://baivong.github.io/
// @description  Tải truyện từ truyenfull.vn định dạng txt hoặc html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc
// @version      1.1.0
// @icon         https://i.imgur.com/FQY8btq.png
// @author       Zzbaivong
// @license      MIT
// @include      /^https?:\/\/truyenfull\.vn\/[^\/]+\/$/
// @require      https://code.jquery.com/jquery-3.2.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.2/handlebars.min.js
// @require      https://greasyfork.org/scripts/20307-jszip-v2/code/jszip-v2.js?version=196156
// @require      https://greasyfork.org/scripts/29904-jszip-utils/code/jszip-utils.js?version=196137
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=164030
// @require      https://greasyfork.org/scripts/29905-js-epub-maker/code/js-epub-maker.js?version=196139
// @noframes
// @connect      self
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* global EpubMaker */
(function ($, window, document) {
    'use strict';

    /**
     * Export to epub, html, txt
     * @type {String}
     */
    var output = 'epub';

    /**
     * Enable logging in Console
     * @type {Number} 0 : Disable
     *                1 : Error
     *                2 : Info + Error
     */
    var debugLevel = 0;


    function cleanHtml(str) {
        str = str.replace(/&nbsp\;/gm, ' ');
        str = str.replace(/<(br|hr|img)([^>]+)?>/gm, '<$1$2 />');
        return '<p>' + str + '</p>';
    }

    function downloadFail(err) {
        if (!oneChap) {
            $downloadStatus('danger');
            titleError.push(chapTitle);
        }

        if (output === 'txt') {
            txt += LINE2 + url.toUpperCase() + LINE2;
        } else {
            txt += '<h2 class="title">' + url + '</h2>';
        }

        if (debugLevel == 2) console.log('%cError: ' + url, 'color:red;');
        if (debugLevel > 0) console.error(err);
    }

    function successBtn(zipcontent, filename) {
        $download.attr({
            href: window.URL.createObjectURL(zipcontent),
            download: filename
        }).text('Tải xong').off('click');
        $downloadStatus('success');
    }

    function saveEbook() {
        var fileName,
            fileType,
            blob;

        if (oneChap) ebookTitle = chapTitle;
        fileName = ebookTitle;

        if (endDownload) return;
        endDownload = true;

        if (!oneChap) {
            if (titleError.length) {
                if (output === 'txt') {
                    titleError = LINE + 'Các chương lỗi: ' + titleError.join(', ') + LINE;
                } else {
                    titleError = '<p><strong>Các chương lỗi: </strong>' + titleError.join(', ') + '</p>';
                }

                if (debugLevel > 0) console.warn('Các chương lỗi:', titleError);
            } else {
                titleError = '';
            }

            if (output === 'txt') {
                if (begin !== end) beginEnd = LINE + 'Từ [' + begin + '] đến [' + end + ']';
                txt = ebookTitle.toUpperCase() + LINE2 + 'Tác giả: ' + ebookAuthor + ebookType + beginEnd + titleError + creditsTxt + txt;
            } else {
                if (begin !== end) beginEnd = '<p>Nội dung từ <strong>' + begin + '</strong> đến <strong>' + end + '</strong></p>';
                if (output === 'epub') {
                    epubMaker.withSection(new EpubMaker.Section('note', 'note', {
                        content: beginEnd + titleError + '<br /><br />' + credits,
                        title: 'Ghi chú'
                    }, false, true));
                } else {
                    txt = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><h1>' + ebookTitle + '</h1><p><strong>Tác giả:</strong> ' + ebookAuthor + '</p>' + ebookType + beginEnd + titleError + '<br><br>' + credits + '<br><br><br>' + txt + '</body></html>';
                }
            }
        }

        if (output === 'txt') {
            fileName += '.txt';
            fileType = 'text/plain';
        } else {
            fileName += '.html';
            fileType = 'text/html';
        }

        if (oneChap) txt = txt.trim();

        if (output === 'epub') {
            epubMaker.downloadEpub(function (epubZipContent, filename) {
                successBtn(epubZipContent, filename);
            });
        } else {
            blob = new Blob([txt], {
                encoding: 'UTF-8',
                type: fileType + ';charset=UTF-8'
            });
        }

        if (!oneChap && output !== 'epub') successBtn(blob, fileName);

        document.title = '[⇓] ' + ebookTitle;
        $win.off('beforeunload');
        if (debugLevel === 2) console.log('%cDownload Finished!', 'color:blue;');
        if (debugLevel > 0) console.timeEnd('TruyenFull Downloader');

        if (output !== 'epub') saveAs(blob, fileName);
    }

    function getContent() {
        if (endDownload) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function (response) {
                var $data = $(response.responseText),
                    $chapter = $data.find('.chapter-c'),
                    $next = $data.find('#next_chap'),
                    nextUrl;

                if (endDownload) return;

                chapTitle = $data.find('.chapter-title').text().trim();

                if (!$chapter.length) {
                    downloadFail('Missing content.');
                } else {
                    if (!oneChap) $downloadStatus('warning');

                    if (output === 'txt') {
                        txt += LINE2 + chapTitle.toUpperCase() + LINE;
                    } else {
                        txt += '<h2 class="title">' + chapTitle + '</h2>';
                    }

                    var $img = $chapter.find('img');

                    if ($img.length) $img.replaceWith(function () {
                        if (output === 'txt') {
                            return LINE + this.src + LINE;
                        } else {
                            return '<a href="' + this.src + '">Click để xem ảnh</a>';
                        }
                    });

                    if (output === 'txt') {
                        $chapter = $chapter.html().replace(/\r?\n+/g, ' ');
                        $chapter = $chapter.replace(/<br\s*[\/]?>/gi, '\n');
                        $chapter = $chapter.replace(/<(p|div)[^>]*>/gi, '').replace(/<\/(p|div)>/gi, '\n');
                        $chapter = $($.parseHTML($chapter));

                        txt += $chapter.text().trim().replace(/\n/g, '\r\n');
                    } else if (output === 'epub') {
                        epubMaker.withSection(new EpubMaker.Section('chapter', url.match(/\/([^\/]+)\/$/)[1], {
                            content: cleanHtml($chapter.html()),
                            title: chapTitle
                        }, true, false));
                    } else {
                        txt += $chapter.html();
                    }

                    if (!oneChap) count++;

                    if (debugLevel === 2) console.log('%cComplete: ' + url, 'color:green;');
                }

                if (!oneChap) {
                    if (count === 1) begin = chapTitle;
                    end = chapTitle;

                    $download.text('Đang tải chương: ' + url.match(/(?!chuong\-)\d+/i)[0]);
                    document.title = '[' + count + '] ' + pageName;
                }

                if ($next.hasClass('disabled') || oneChap) {
                    saveEbook();
                    return;
                }

                if ($next.length) {
                    nextUrl = $next.attr('href');

                    if (nextUrl === url || nextUrl === '') {
                        downloadFail('Next url error.');
                        saveEbook();
                        return;
                    }
                } else {
                    saveEbook();
                    return;
                }

                url = nextUrl;
                getContent();
            },
            onerror: function (err) {
                downloadFail(err);
                saveEbook();
            }
        });
    }


    var oneChap = false,

        txt = '',
        url = '',

        chapTitle = '',

        LINE = '\r\n\r\n',
        LINE2 = '\r\n\r\n\r\n\r\n',

        endDownload = false,


        pageName = document.title,
        $win = $(window),

        $listChapter = $('#list-chapter'),

        $download = $('<a>', {
            class: 'btn btn-primary btn-lg',
            href: '#download',
            text: 'Tải xuống'
        }),
        $downloadStatus = function (status) {
            $download.removeClass('btn-primary btn-success btn-info btn-warning btn-danger').addClass('btn-' + status);
        },

        count = 0,
        begin = '',
        end = '',

        titleError = [],

        ebookTitle = '',
        ebookAuthor = '',
        ebookCover = '',
        ebookType = [],
        beginEnd = '',

        credits = '<p>Truyện được tải từ <a href="' + location.href + '">TruyenFull</a></p><p>Userscript được viết bởi: <a href="https://baivong.github.io/">Zzbaivong</a></p>',
        creditsTxt = LINE2 + 'Truyện được tải từ ' + location.href + LINE + 'Userscript được viết bởi: Zzbaivong' + LINE2,

        epubMaker;


    if (!$listChapter.length) return;

    url = $listChapter.find('a:first').attr('href');
    $download.insertAfter('.info');

    $download.one('click contextmenu', function (e) {
        e.preventDefault();
        oneChap = false;
        var $ebookType = $('.info a[itemprop="genre"]');

        ebookTitle = $('h1').text().trim();
        ebookAuthor = $('.info a[itemprop="author"]').text().trim();
        ebookCover = $('.books img').attr('src');

        if ($ebookType.length) {
            $ebookType.each(function () {
                ebookType.push($(this).text().trim());
            });
            ebookType = ebookType.join(', ');

            if (output === 'txt') {
                ebookType = LINE + 'Thể loại: ' + ebookType;
            } else {
                ebookType = '<p><strong>Thể loại:</strong> ' + ebookType + '</p>';
            }
        } else {
            ebookType = '';
        }

        if (output === 'epub') {
            epubMaker = new EpubMaker()
                .withUuid('github.com/baivong/Userscript::truyenfull::' + location.pathname.slice(1, -1))
                .withTemplate('idpf-wasteland')
                .withAuthor(ebookAuthor)
                .withLanguage('vi')
                .withModificationDate(new Date)
                .withCover(ebookCover)
                .withTitle(ebookTitle);

            epubMaker.withSection(new EpubMaker.Section('introduction', 'info', {
                content: '<h1>' + ebookTitle + '</h1><p><strong>Tác giả:</strong> ' + ebookAuthor + '</p>' + ebookType,
                title: 'Giới thiệu'
            }, false, true));

            epubMaker.withSection(new EpubMaker.Section('preamble', 'content', {
                content: cleanHtml($('.desc-text-full').html()),
                title: 'Nội dung'
            }, false, true));
        }

        if (e.type === 'contextmenu') {
            var beginUrl = prompt('Nhập URL chương truyện bắt đầu tải:', url);
            if (beginUrl !== null && /^https?:\/\/truyenfull\.vn\/[^\/]+\/chuong\-\d+\/$/i.test(beginUrl.trim())) url = beginUrl;

            $download.off('click');
        } else {
            $download.off('contextmenu');
        }

        if (debugLevel > 0) console.time('TruyenFull Downloader');
        if (debugLevel === 2) console.log('%cDownload Start!', 'color:blue;');
        document.title = '[...] Vui lòng chờ trong giây lát';

        getContent();

        $win.on('beforeunload', function () {
            return 'Truyện đang được tải xuống...';
        });

        $download.one('click', function (e) {
            e.preventDefault();

            saveEbook();
        });
    });

    $listChapter.on('contextmenu', 'a', function (e) {
        e.preventDefault();
        oneChap = true;
        endDownload = false;

        if (debugLevel > 0) console.time('TruyenFull Downloader');
        if (debugLevel === 2) console.log('%cDownload Start!', 'color:blue;');
        document.title = '[...] Vui lòng chờ trong giây lát';

        url = this.href;
        txt = '';

        getContent();
    });

})(jQuery, window, document);
