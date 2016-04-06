// ==UserScript==
// @name        Sửa tiền tố cho bài viết
// @namespace   zzbaivong
// @description Nhấn [Sửa tiền tố] ở những bài chưa đổi tiền tố trong Thùng rác
// @include     http://devs.forumvi.com/f24-*
// @include     http://devs.forumvi.com/f24p*
// @version     1.0.1
// @grant       none
// ==/UserScript==
$(function () {
    $('.prefix').show();
    $('.stat4r a[href^=\'/t\']a[href*=\'#\']').attr('href', function () {
        return '/post?p=' + this.href.split('#') [1] + '&mode=editpost'
    }).text('[ Sửa tiền tố ]').css('float', 'right').click(function (d) {
        d.preventDefault();
        var b = this;
        $.post(b.href, function (a) {
            a = $(a);
            var c = '[' + $('.nav[href^=\'/f\']:last').text() + '] ' + $.trim(a.find('#modif_topic_title').val().replace(/\[([^\[\]])+\]/g, ''));
            $.post(b.href, {
                subject: c,
                modif_topic_title: c,
                message: a.find('#text_editor_textarea').val(),
                post: 'Send'
            }, function (a) {
                $(b).closest('tr').fadeOut(300)
            });
        })
    })
});
