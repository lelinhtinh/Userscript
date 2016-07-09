// ==UserScript==
// @name         Worldcosplay download
// @namespace    http://devs.forumvi.com/
// @description  Download photo(s) on worldcosplay.net
// @version      2.0.1
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
// @match        https://worldcosplay.net/*/photos*
// @match        https://worldcosplay.net/*/favorites*
// @match        https://worldcosplay.net/photo/*
// @match        https://worldcosplay.net/tag/*
// @match        https://worldcosplay.net/search/photos?*
// @match        https://worldcosplay.net/character/*
// @match        https://worldcosplay.net/title/*
// @match        https://worldcosplay.net/photos
// @match        https://worldcosplay.net/popular
// @match        https://worldcosplay.net/ranking/good*
// @match        https://worldcosplay.net/*/photo/*
// @match        https://worldcosplay.net/*/tag/*
// @match        https://worldcosplay.net/*/search/photos?*
// @match        https://worldcosplay.net/*/character/*
// @match        https://worldcosplay.net/*/title/*
// @match        https://worldcosplay.net/*/photos
// @match        https://worldcosplay.net/*/popular
// @match        https://worldcosplay.net/*/ranking/good*
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=135609
// @require      https://greasyfork.org/scripts/5392-waitforkeyelements/code/WaitForKeyElements.js?version=115012
// @noframes
// @connect      self
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// ==/UserScript==

(function ($, window, document, undefined) {
    'use strict';

    window.URL = window.URL || window.webkitURL;

    function downloadPhoto(el, url) {
        var photoName = url.replace(/.*\//g, '');
        if (typeof GM_download !== 'undefined') {
            GM_download({
                url: url,
                name: photoName,
                saveAs: false,
                onerror: function (err) {
                    console.error(err);
                }
            });
        } else {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'blob',
                onload: function (response) {
                    var blob = response.response;
                    $(el).attr({
                        href: window.URL.createObjectURL(blob),
                        download: photoName
                    }).off('click');
                    saveAs(blob, photoName);
                },
                onerror: function (err) {
                    console.error(err);
                }
            });
        }
    }

    if (/^(\/[a-z\-]+)?\/photo\/\d+$/.test(location.pathname)) {

        var $btn = $('<a>', {
            href: '#download',
            'class': 'download-this-photo',
            html: '<div class="side_buttons" style="right: 250px;"><div class="like-this-photo button fave fa fa-download"><div class="effect-ripple"></div></div></div>'
        });
        $btn.on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            downloadPhoto(this, $('#photoContainer').find('.img').attr('src'));
        });
        $btn.insertAfter('.side_buttons');

    } else {

        var addBtn = function () {
            $('.preview').not('.added-download-btn').each(function () {
                var $this = $(this),
                    $btn = $('<a>', {
                        href: '#download',
                        'class': 'download-this-photo',
                        html: '<div class="item likes" style="top: 50px;"><span class="like-this-photo"><i class="fa fa-download"></i><span class="effect-ripple"></span></span></div>'
                    });
                $btn.on('click', function (e) {
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
