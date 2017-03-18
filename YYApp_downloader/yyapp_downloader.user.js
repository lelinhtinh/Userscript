// ==UserScript==
// @name         YYApp downloader
// @namespace    https://baivong.github.io/
// @description  Tải truyện từ app.truyenyy.com định dạng txt hoặc html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc
// @version      1.0.0
// @icon         http://i.imgur.com/3lomxTC.png
// @author       Zzbaivong
// @license      MIT
// @include      /^https?:\/\/app\.truyenyy\.com\/truyen\/[^\/]+\/$/
// @require      https://code.jquery.com/jquery-3.2.0.min.js
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=164030
// @noframes
// @connect      self
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function ($, window, document, undefined) {
    'use strict';

    /**
     * Export data to a text file (.txt)
     * @type {Boolean}
     */
    var textOnly = true;
    /**
     * true  : txt
     * false : html
     */


    function downloadFail() {
        $download.css('background', '#f26a65');
        titleError.push(title);

        if (debug) console.log('%cError: ' + url, 'color:red;');
    }

    function getContent() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function (response) {
                var $data = $(response.responseText),
                    $chapter = $data.find('.chap-content'),
                    $next = $data.find('.weui_btn:contains("Tiếp"):last');

                title = $data.find('.chap-title').text().trim().replace(/^(Chương\s\d+)(\s+?Chương\s?[^\:]+\:)?/, '$1 :');

                if (count === 0) begin = title;
                end = title;

                $download.text(title);

                if (!$chapter.length) {
                    downloadFail();
                } else {
                    $download.css('background', 'orange');

                    if (textOnly) {
                        txt += LINE2 + title.toUpperCase() + LINE2;
                    } else {
                        txt += '<h2 class="title">' + title + '</h2>';
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

                    count++;

                    if (debug) console.log('%cComplete: ' + url, 'color:green;');
                }

                document.title = '[' + count + '] ' + pageName;

                if ($next.hasClass('weui_btn_disabled')) {
                    var ebookTitle = $('h1').text().trim(),
                        ebookAuthor = $('td:contains("Tác giả")').next().find('a').text().trim(),
                        ebookType = $('td:contains("Thể loại")').next().text().trim(),

                        credits = '<p>Truyện được tải từ <a href="' + location.href + '">TruyenYY</a></p><p>Userscript được viết bởi: <a href="https://baivong.github.io/">Zzbaivong</a></p>',
                        creditsTxt = LINE2 + 'Truyện được tải từ ' + location.href + LINE + 'Userscript được viết bởi: Zzbaivong' + LINE2,

                        fileName = ebookTitle,
                        fileType,
                        blob;

                    if (textOnly) {
                        fileName += '.txt';
                        fileType = 'text/plain';
                    } else {
                        fileName += '.html';
                        fileType = 'text/html';
                    }

                    if (titleError.length) {
                        if (textOnly) {
                            titleError = LINE + 'Các chương lỗi: ' + titleError.join(', ') + LINE;
                        } else {
                            titleError = '<h4>Các chương lỗi: <font color="gray">' + titleError.join(', ') + '</font></h4>';
                        }

                        if (debug) console.log('Các chương lỗi:', titleError);
                    } else {
                        titleError = '';
                    }

                    if (textOnly) {
                        txt = ebookTitle.toUpperCase() + LINE2 + 'Tác giả: ' + ebookAuthor + LINE + 'Thể loại: ' + ebookType + LINE + 'Từ [' + begin + '] đến [' + end + ']' + titleError + creditsTxt + txt;
                    } else {
                        txt = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><h1><font color="red">' + ebookTitle + '</font></h1><h3>Tác giả: <font color="blue">' + ebookAuthor + '</font></h3><h3>Thể loại: <font color="green">' + ebookType + '</font></h3><br><h4>Từ <font color="gray">' + begin + '</font> đến <font color="gray">' + end + '</font></h4>' + titleError + '<br><br>' + credits + '<br><br><br>' + txt + '</body></html>';
                    }

                    blob = new Blob([txt], {
                        encoding: 'UTF-8',
                        type: fileType + ';charset=UTF-8'
                    });

                    $download.attr({
                        href: window.URL.createObjectURL(blob),
                        download: fileName
                    }).html('<i class="material-icons">check</i> Tải xong').css('background', '#66bb6a').off('click');

                    saveAs(blob, fileName);

                    $(window).off('beforeunload');
                    if (debug) console.log('%cDownload Finished!', 'color:blue;');
                    document.title = '[⇓] ' + pageName;

                    return;
                }

                url = $next.attr('href');
                getContent();
            },
            onerror: function (err) {
                downloadFail();

                setTimeout(function () {
                    getContent();
                }, 3000);
            }
        });
    }


    var pageName = document.title,
        $download = $('<a>', {
            class: 'weui_btn weui_btn_default',
            href: '#download',
            css: {
                background: '#29b6f6',
                color: '#ffffff'
            },
            text: 'Tải xuống'
        }),
        disableClick = false,

        count = 0,
        begin = '',
        end = '',

        txt = '',
        url = $('.weui_btn:contains("Đọc Từ Đầu")').attr('href'),

        title = '',
        titleError = [],

        LINE = '\r\n\r\n',
        LINE2 = '\r\n\r\n\r\n\r\n',

        debug = false;


    $('.btns').append($('<div>', {
        class: 'flexbox flex-row"'
    }).append($('<div>', {
        class: 'flexbox-item'
    }).append($download)));

    $download.on('click', function (e) {
        e.preventDefault();
        if (disableClick) return;
        disableClick = true;

        getContent();

        $(window).on('beforeunload', function () {
            return 'Truyện đang được tải xuống...';
        });
    });

})(jQuery, window, document);
