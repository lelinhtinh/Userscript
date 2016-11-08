// ==UserScript==
// @name         YYApp downloader
// @namespace    https://baivong.github.io/
// @description  Tải truyện từ app.truyenyy.com định dạng html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc
// @version      0.2.0
// @icon         http://i.imgur.com/3lomxTC.png
// @author       Zzbaivong
// @license      MIT
// @include      /^https?:\/\/app\.truyenyy\.com\/truyen\/[^\/]+\/$/
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=135609
// @noframes
// @connect      self
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function ($, window, document, undefined) {
    'use strict';

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
                    $chapter = $data.find('#inner_chap_content'),
                    $next = $data.find('.weui_btn:contains("Tiếp"):last');

                title = $data.find('.chap-title').text().trim();
                if (count === 0) begin = title;
                end = title;

                $download.html(title);

                if (!$chapter.length) {
                    downloadFail();
                } else {
                    $download.css('background', 'orange');

                    txt += '<h2 class="title">' + title + '</h2>' + $chapter.html();
                    count++;

                    if (debug) console.log('%cComplete: ' + url, 'color:green;');
                }

                document.title = '[' + count + '] ' + pageName;

                if ($next.hasClass('weui_btn_disabled')) {
                    var fileName = location.pathname.slice(8, -1) + '.html',
                        blob;

                    if (titleError.length) {
                        titleError = '<h4>Các chương lỗi: <font color="gray">' + titleError.join(', ') + '</font></h4>';
                        if (debug) console.log('Các chương lỗi:', titleError);
                    } else {
                        titleError = '';
                    }

                    txt = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><h1><font color="red">' + $('h1').text().trim() + '</font></h1><h3>Tác giả: <font color="blue">' + $('td:contains("Tác giả")').next().find('a').text().trim() + '</font></h3><h3>Thể loại: <font color="green">' + $('td:contains("Thể loại")').next().text().trim() + '</font></h3><br><h4>Từ <font color="gray">' + begin + '</font> đến <font color="gray">' + end + '</font></h4>' + titleError + '<br><br>' + credits + '<br><br><br>' + txt + '</body></html>';

                    blob = new Blob([txt], {
                        type: 'text/html'
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
        $wrap = $('<div>', {
            class: 'flexbox-item'
        }),
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

        credits = '<p>Truyện được tải từ <a href="' + location.href + '">TruyenYY</a></p><p>Userscript được viết bởi: <a href="https://baivong.github.io/">Zzbaivong</a></p>',

        debug = false;


    $('.btns .flexbox:last').append($wrap.append($download));

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
