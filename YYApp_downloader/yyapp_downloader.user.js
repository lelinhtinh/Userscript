// ==UserScript==
// @name         YYApp downloader
// @namespace    https://baivong.github.io/
// @description  Tải truyện từ app.truyenyy.com định dạng txt hoặc html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc
// @version      1.1.1
// @icon         http://i.imgur.com/3lomxTC.png
// @author       Zzbaivong
// @license      MIT
// @include      /^https?:\/\/app\.truyenyy\.com\/truyen\/[^\/]+\/(danh\-sach\-chuong\/(\?p=\d+)?)?$/
// @require      https://code.jquery.com/jquery-3.2.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @noframes
// @connect      self
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function ($, window, document) {
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
            $download.css('background', '#f26a65');
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
            var ebookAuthor = $('td:contains("Tác giả")').next().find('a').text().trim(),
                $ebookType = $('td:contains("Thể loại")'),
                ebookType = [],

                credits = '<p>Truyện được tải từ <a href="' + location.href + '">TruyenYY</a></p><p>Userscript được viết bởi: <a href="https://baivong.github.io/">Zzbaivong</a></p>',
                creditsTxt = LINE2 + 'Truyện được tải từ ' + location.href + LINE + 'Userscript được viết bởi: Zzbaivong' + LINE2,

                beginEnd = '';

            if ($ebookType.length) {
                $ebookType = $ebookType.next().find('a');
                $ebookType.each(function () {
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
            }).html('<i class="material-icons">check</i> Tải xong').css('background', '#66bb6a').off('click');

            $win.off('beforeunload');
        }

        document.title = '[⇓] ' + ebookTitle;
        if (debugLevel === 2) console.log('%cDownload Finished!', 'color:blue;');
        if (debugLevel > 0) console.timeEnd('YYApp Downloader');

        saveAs(blob, fileName);
    }

    function getContent() {
        if (endDownload) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function (response) {
                var $data = $(response.responseText),
                    $chapter = $data.find('.chap-content'),
                    $next = $data.find('.weui_btn:contains("Tiếp"):last'),
                    nextUrl;

                if (endDownload) return;

                chapTitle = $data.find('.chap-title').text().trim().replace(/^(Chương\s\d+)(\s+?Chương\s?[^\:]+\:)?/, '$1 :');

                if (!$chapter.length) {
                    downloadFail('Missing content.');
                } else {
                    if (!oneChap) $download.css('background', 'orange');

                    if (textOnly) {
                        txt += LINE2 + chapTitle.toUpperCase() + LINE2;
                    } else {
                        txt += '<h2 class="title">' + chapTitle + '</h2>';
                    }

                    $chapter.each(function () {
                        var $this = $(this),
                            $img = $this.find('img');

                        if ($img.length) $img.replaceWith(function () {
                            if (textOnly) {
                                return LINE + this.src + LINE;
                            } else {
                                return '<a href="' + this.src + '">Click để xem ảnh</a>';
                            }
                        });

                        if (textOnly) {
                            $this = $($this.html().replace(/\r?\n+/g, ' '));
                            $this.find('br').replaceWith('\r\n');
                            $this.find('p, div').after('\r\n');
                            txt += $this.text().trim();
                        } else {
                            txt += $this.html();
                        }
                    });

                    if (!oneChap) count++;

                    if (debugLevel === 2) console.log('%cComplete: ' + url, 'color:green;');
                }

                if (!oneChap) {
                    if (count === 1) begin = chapTitle;
                    end = chapTitle;

                    $download.text(chapTitle);
                    document.title = '[' + count + '] ' + pageName;
                }

                if ($next.hasClass('weui_btn_disabled') || oneChap) {
                    saveEbook();
                    return;
                }

                if ($next.length) {
                    nextUrl = $next.attr('href');

                    if (nextUrl === url || nextUrl === '') {
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

        endDownload = false;


    if (/^\/truyen\/[^\/]+\/danh\-sach\-chuong\/$/.test(location.pathname)) {
        oneChap = true;

        $('a.weui_cell').on('contextmenu', function (e) {
            e.preventDefault();

            if (debugLevel > 0) console.time('YYApp Downloader');
            if (debugLevel === 2) console.log('%cDownload Start!', 'color:blue;');
            document.title = '[...] Vui lòng chờ trong giây lát';

            url = this.href;
            txt = '';

            getContent();
        });
    } else {
        var pageName = document.title,
            $win = $(window),

            $download = $('<a>', {
                class: 'weui_btn weui_btn_default',
                href: '#download',
                css: {
                    background: '#29b6f6',
                    color: '#ffffff'
                },
                text: 'Tải xuống'
            }),

            count = 0,
            begin = '',
            end = '',

            titleError = [];

        url = $('.weui_btn:contains("Đọc Từ Đầu")').attr('href');


        $('.btns').append($('<div>', {
            class: 'flexbox flex-row"'
        }).append($('<div>', {
            class: 'flexbox-item'
        }).append($download)));

        $download.one('click contextmenu', function (e) {
            e.preventDefault();

            if (e.type === 'contextmenu') {
                var beginUrl = prompt('Nhập URL chương truyện bắt đầu tải:', location.origin + url);
                if (beginUrl !== null && /^https?:\/\/app\.truyenyy\.com\/chuong\/[^\/]+\/$/i.test(beginUrl.trim())) url = beginUrl.replace(location.origin, '');

                $download.off('click');
            } else {
                $download.off('contextmenu');
            }

            if (debugLevel > 0) console.time('YYApp Downloader');
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
    }

})(jQuery, window, document);
