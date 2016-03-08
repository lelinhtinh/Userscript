// ==UserScript==
// @name         TruyenCV downloader
// @namespace    http://devs.forumvi.com/
// @version      1.2.0
// @description  Tải truyện từ truyencv.com định dạng html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc
// @author       Zzbaivong
// @icon         http://truyencv.com/templates/truyencv/images/logo.png
// @match        http://truyencv.com/*/
// @require      http://code.jquery.com/jquery-2.2.1.min.js
// @require      http://openuserjs.org/src/libs/baivong/FileSaver.min.js
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function ($, window, document, undefined) {

    'use strict';

    function downloadFail(url) {

        console.log('%cError: ' + url, 'color:red;');
        $download.text('Resume...').css('background', 'red');
        disableClick = false;

    }

    function downloadComplete() {

        var skipSize = skip.length,
            blob,
            fileName = path.slice(1, -1) + '_' + begin + '-' + end + '.md';

        txt = '# ' + $('h1').text() + '\n\n ' + $('#poster p:eq(3)').text() + '\n ' + $('#poster p:eq(4)').text() + '\n Tổng số chương: ' + (end - begin - skipSize + 1) + '\n\n' + credits + '\n\n\n' + txt;

        blob = new Blob([txt], {
            type: 'text/markdown;charset=utf-8'
        });

        saveAs(blob, fileName);

        $download.attr({
            href: window.URL.createObjectURL(blob),
            download: fileName
        }).text('Download Finished!').css('background', 'green').off('click');

        if (skipSize) {
            console.log('%cLinks skipped: ' + skip.join(','), 'color:orange;');
        }

        console.log('%cDownload Finished!', 'color:blue;');

    }

    function getChapter() {

        if (count > max) {

            if (complete) {
                downloadComplete();
            } else {

                enablePrompt = true;
                disableClick = false;
                $download.text('Nothing!').css('background', 'red');
                console.log('%cNothing!', 'color:red;');

            }

            $(window).off('beforeunload');

        } else {

            url = path + 'chuong-' + count;

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function (response) {

                    var $data = $(response.responseText),
                        title = $.trim($data.find('h2.text-muted').text()),
                        $chapter = $data.find('.chapter');

                    if ($chapter.length) {

                        $download.text(count + '/' + max).css('background', 'orange');

                        if (response.finalUrl.slice(-8) === '/chuong/') {

                            $download.css('background', 'black');
                            console.log('%cSkip: ' + url, 'color:orange;');
                            skip.push(count);
                            ++count;
                            getChapter();
                            return;

                        }

                        console.log('%cComplete: ' + url, 'color:green;');
                        ++count;
                        ++complete;

                    } else {
                        downloadFail(url);
                    }

                    $chapter.find('font, p:last').remove();
                    $chapter.find('br').replaceWith('\n');
                    $chapter.find('p').replaceWith(function() {
                        return this.textContent + '\n';
                    });
                    txt += '\n\n# ' + title + '\n\n' + $.trim($chapter.text()).replace(/^[\t\s]*(.+)$/gm, '$1');

                    getChapter();

                },
                onerror: function (err) {

                    downloadFail(url);
                    console.error(err);

                }
            });

        }

    }


    var $download = $('[href="#dsc"]'),
        count = 1,
        max = parseInt($('.listchapter').eq($('.listchapter').length - 2).find('.latestchaper').eq(0).find('a').attr('href').match(/chuong-(\d+)/)[1], 10),
        begin,
        end,
        skip = [],
        txt = '',
        enablePrompt = true,
        disableClick = false,
        complete = 0,
        path = location.pathname,
        url,
        credits = 'Truyện được tải từ: TruyenCV - http://truyencv.com\nUserscript được viết bởi: Zzbaivong - http://devs.forumvi.com';

    window.URL = window.URL || window.webkitURL;

    $download.text('Download').css('background', 'orange').on('click', function (e) {

        e.preventDefault();

        if (disableClick) {
            return;
        }

        if (enablePrompt) {

            begin = prompt('Chọn Chương bắt đầu tải', count);
            end = prompt('Chọn Chương kết thúc tải', max);

            if (begin !== null && /^\d+$/.test(begin)) {
                begin = parseInt(begin, 10);
                count = begin;
            } else {
                begin = count;
            }

            if (end !== null && /^\d+$/.test(end)) {
                end = parseInt(end, 10);
                if (end > count) {
                    max = end;
                } else {
                    max = count;
                    end = count;
                }
            } else {
                end = max;
            }

            $(window).on('beforeunload', function () {
                return 'Truyện đang được tải xuống...';
            });

            enablePrompt = false;

        }

        getChapter();

        disableClick = true;

    });

})(jQuery, window, document);
