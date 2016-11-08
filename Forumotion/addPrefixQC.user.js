// ==UserScript==
// @name         Add QC prefix
// @namespace    zzbaivong
// @description  Add [QC] before topic title
// @match        http://www.forumgiaitri.net/forum
// @version      0.1.0
// @grant        none
// ==/UserScript==

jQuery(function ($) {
    $('li a:first-child', '#recentTopics_div').click(function (e) {
        if (!e.altKey) return;
        e.preventDefault();

        var url = '/post?p=' + this.href.split('#')[1] + '&mode=editpost',
            $this = $(this);
        $.post(url, function (data) {
            $data = $(data);
            var title = '[QC] ' + $.trim($data.find('#modif_topic_title').val().replace(/\[([^\[\]])+\]/g, ''));
            $.post(url, {
                subject: title,
                modif_topic_title: title,
                message: $data.find('#text_editor_textarea').val(),
                post: 'Send'
            }, function (a) {
                $this.closest('li').remove();
            });
        });
    });
});
