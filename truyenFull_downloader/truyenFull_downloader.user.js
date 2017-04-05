// ==UserScript==
// @name         TruyenFull downloader
// @namespace    https://baivong.github.io/
// @description  Tải truyện từ truyenfull.vn định dạng txt hoặc html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc
// @version      1.0.0
// @icon         https://i.imgur.com/FQY8btq.png
// @author       Zzbaivong
// @license      MIT
// @include      /^https?:\/\/truyenfull\.vn\/[^\/]+\/$/
// @require      https://code.jquery.com/jquery-3.2.0.min.js
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=164030
// @noframes
// @connect      self
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function($, window, document, undefined) {
    'use strict';

    /**
     * Export data to a text file (.txt)
     * @type {Boolean} true  : txt
     *                 false : html
     */
    var textOnly = true;

    /**
     * Enable logging in Console
     * @type {Number} 0 : Disable
     *                1 : Error
     *                2 : Info + Error
     */
    var debugLevel = 0;


    function downloadFail(err) {
        if (!oneChap) {
            $downloadStatus('danger');
            titleError.push(chapTitle);
        }

        if (textOnly) {
            txt += LINE2 + url.toUpperCase() + LINE2;
        } else {
            txt += '<h2 class="title">' + url + '</h2>';
        }

        if (debugLevel == 2) console.log('%cError: ' + url, 'color:red;');
        if (debugLevel > 0) console.error(err);
    }

    function saveEbook() {
        var ebookTitle = oneChap ? chapTitle : $('h1').text().trim(),
            fileName = ebookTitle,
            fileType,
            blob;

        if (endDownload) return;
        endDownload = true;

        if (!oneChap) {
            var ebookAuthor = $('.info a[itemprop="author"]').text().trim(),
                $ebookType = $('.info a[itemprop="genre"]'),
                ebookType = [],

                credits = '<p>Truyện được tải từ <a href="' + location.href + '">TruyenFull</a></p><p>Userscript được viết bởi: <a href="https://baivong.github.io/">Zzbaivong</a></p>',
                creditsTxt = LINE2 + 'Truyện được tải từ ' + location.href + LINE + 'Userscript được viết bởi: Zzbaivong' + LINE2,

                beginEnd = '';

            if ($ebookType.length) {
                $ebookType.each(function() {
                    ebookType.push($(this).text().trim());
                });
                ebookType = ebookType.join(', ');

                if (textOnly) {
                    ebookType = LINE + 'Thể loại: ' + ebookType;
                } else {
                    ebookType = '<h3>Thể loại: <font color="green">' + ebookType + '</font></h3>';
                }
            } else {
                ebookType = '';
            }

            if (titleError.length) {
                if (textOnly) {
                    titleError = LINE + 'Các chương lỗi: ' + titleError.join(', ') + LINE;
                } else {
                    titleError = '<h4>Các chương lỗi: <font color="gray">' + titleError.join(', ') + '</font></h4>';
                }

                if (debugLevel > 0) console.warn('Các chương lỗi:', titleError);
            } else {
                titleError = '';
            }

            if (textOnly) {
                if (begin !== end) beginEnd = LINE + 'Từ [' + begin + '] đến [' + end + ']';
                txt = ebookTitle.toUpperCase() + LINE2 + 'Tác giả: ' + ebookAuthor + ebookType + beginEnd + titleError + creditsTxt + txt;
            } else {
                if (begin !== end) beginEnd = '<br><h4>Từ <font color="gray">' + begin + '</font> đến <font color="gray">' + end + '</font></h4>';
                txt = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><h1><font color="red">' + ebookTitle + '</font></h1><h3>Tác giả: <font color="blue">' + ebookAuthor + '</font></h3>' + ebookType + beginEnd + titleError + '<br><br>' + credits + '<br><br><br>' + txt + '</body></html>';
            }
        }

        if (textOnly) {
            fileName += '.txt';
            fileType = 'text/plain';
        } else {
            fileName += '.html';
            fileType = 'text/html';
        }

        if (oneChap) txt = txt.trim();

        blob = new Blob([txt], {
            encoding: 'UTF-8',
            type: fileType + ';charset=UTF-8'
        });

        if (!oneChap) {
            $download.attr({
                href: window.URL.createObjectURL(blob),
                download: fileName
            }).text('Tải xong').off('click');
            $downloadStatus('success');

            $win.off('beforeunload');
        }

        document.title = '[⇓] ' + ebookTitle;
        if (debugLevel === 2) console.log('%cDownload Finished!', 'color:blue;');
        if (debugLevel > 0) console.timeEnd('TruyenFull Downloader');

        saveAs(blob, fileName);
    }

    function getContent() {
        if (endDownload) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
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

                    if (textOnly) {
                        txt += LINE2 + chapTitle.toUpperCase() + LINE;
                    } else {
                        txt += '<h2 class="title">' + chapTitle + '</h2>';
                    }

                    var $img = $chapter.find('img');

                    if ($img.length) $img.replaceWith(function() {
                        if (textOnly) {
                            return LINE + this.src + LINE;
                        } else {
                            return '<a href="' + this.src + '">Click để xem ảnh</a>';
                        }
                    });

                    if (textOnly) {
                        $chapter = $chapter.html().replace(/\r?\n+/g, ' ');
                        $chapter = $chapter.replace(/<br\s*[\/]?>/gi, '\n');
                        $chapter = $chapter.replace(/<(p|div)[^>]*>/gi, '').replace(/<\/(p|div)>/gi, '\n');
                        $chapter = $($.parseHTML($chapter));

                        txt += $chapter.text().trim().replace(/\n/g, '\r\n');
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
            onerror: function(err) {
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
        $downloadStatus = function(status) {
        	$download.removeClass('btn-primary btn-success btn-info btn-warning btn-danger').addClass('btn-' + status);
        },

        count = 0,
        begin = '',
        end = '',

        titleError = [];


    if (!$listChapter.length) return;

    url = $listChapter.find('a:first').attr('href');
    $download.insertAfter('.info');

    $download.one('click contextmenu', function(e) {
        e.preventDefault();
        oneChap = false;

        if (e.type === 'contextmenu') {
            var beginUrl = prompt("Nhập URL chương truyện bắt đầu tải:", url);
            if (beginUrl !== null && /^https?:\/\/truyenfull\.vn\/[^\/]+\/chuong\-\d+\/$/i.test(beginUrl.trim())) url = beginUrl;

            $download.off('click');
        } else {
            $download.off('contextmenu');
        }

        if (debugLevel > 0) console.time('TruyenFull Downloader');
        if (debugLevel === 2) console.log('%cDownload Start!', 'color:blue;');
        document.title = '[...] Vui lòng chờ trong giây lát';

        getContent();

        $win.on('beforeunload', function() {
            return 'Truyện đang được tải xuống...';
        });

        $download.one('click', function(e) {
            e.preventDefault();

            saveEbook();
        });
    });

    $listChapter.on('contextmenu', 'a', function(e) {
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
