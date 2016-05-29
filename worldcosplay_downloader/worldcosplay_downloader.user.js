// ==UserScript==
// @id           worldcosplay-download@devs.forumvi.com
// @name         Worldcosplay download
// @namespace    http://devs.forumvi.com/
// @description  Download photo(s) on worldcosplay.net
// @version      1.1.8
// @icon         http://i.imgur.com/gJLjIzb.png
// @author       Zzbaivong
// @license      MIT
// @match        http://worldcosplay.net/*/photos*
// @match        http://worldcosplay.net/*/favorites*
// @match        http://worldcosplay.net/photo/*
// @match        http://worldcosplay.net/tag/*
// @match        http://worldcosplay.net/search/photos?*
// @match        http://worldcosplay.net/character/*
// @match        http://worldcosplay.net/title/*
// @match        http://worldcosplay.net/photos
// @match        http://worldcosplay.net/popular
// @match        http://worldcosplay.net/ranking/good*
// @match        http://worldcosplay.net/*/photo/*
// @match        http://worldcosplay.net/*/tag/*
// @match        http://worldcosplay.net/*/search/photos?*
// @match        http://worldcosplay.net/*/character/*
// @match        http://worldcosplay.net/*/title/*
// @match        http://worldcosplay.net/*/photos
// @match        http://worldcosplay.net/*/popular
// @match        http://worldcosplay.net/*/ranking/good*
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=128198
// @require      https://greasyfork.org/scripts/5392-waitforkeyelements/code/WaitForKeyElements.js?version=115012
// @noframes
// @connect      worldcosplay.net
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function($, window, document, undefined) {
    'use strict';

    window.URL = window.URL || window.webkitURL;

    function downloadPhoto(el, url) {
        var photoName = url.replace(/.*\//g, '');
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'blob',
            onload: function(response) {
                var blob = response.response;
                $(el).attr({
                    href: window.URL.createObjectURL(blob),
                    download: photoName
                }).removeAttr('onclick');
                saveAs(blob, photoName);
            },
            onerror: function(err) {
                console.error(err);
            }
        });
    }

    if (/^(\/[a-z\-]+)?\/photo\/\d+$/.test(location.pathname)) {

        var $btn = $('<a>', {
            href: '#download',
            'class': 'download-this-photo',
            html: '<div class="side_buttons" style="right: 220px;"><div class="like-this-photo button fave fa fa-download"><div class="effect-ripple"></div></div></div>'
        });
        $btn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            downloadPhoto(this, $('#photoContainer').find('.img').attr('src'));
        });
        $btn.insertAfter('.side_buttons');

    } else {

        var addBtn = function() {
            $('.preview').not('.added-download-btn').each(function() {
                var $this = $(this),
                    $btn = $('<a>', {
                        href: '#download',
                        'class': 'download-this-photo',
                        html: '<div class="item likes" style="top: 50px;"><span class="like-this-photo"><i class="fa fa-download"></i><span class="effect-ripple"></span></span></div>'
                    });
                $btn.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    downloadPhoto(this, $this.find('.photo_img').css('backgroundImage').slice(5, -2).replace('sq300/', ''));
                });
                $this.find('.options').append($btn);
                $this.addClass('added-download-btn');
            });
        };
        addBtn();

        waitForKeyElements('.preview', addBtn);

    }

})(jQuery, window, document);
