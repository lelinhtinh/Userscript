// ==UserScript==
// @name         Remove SCEditor and CodeMirror
// @namespace    http://devs.forumvi.com/
// @version      1.0.0
// @description  Vô hiệu hóa SCEditor và CodeMirror khi tạo hoặc chỉnh sửa code trong Forumotion
// @include      http://*/admin/index.forum*
// @match        http://*/admin/index.forum*
// @copyright    2013+, Zzbaivong
// @run-at       document-end
// @grant        none
// ==/UserScript==
$(function() {
    if (window.$.sceditor) {
        $("#text_editor_textarea").height(450).sceditor("instance").destroy();
    }
    if (window.editor) {
        editor.toTextArea();
        $("#text_editor_textarea").height(450);
    }
});
