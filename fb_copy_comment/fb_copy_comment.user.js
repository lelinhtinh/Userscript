// ==UserScript==
// @name            Facebook Copy Comment
// @name:vi         Sao Chép Bình Luận Facebook
// @namespace       https://lelinhtinh.github.io
// @description     Copy comment from Facebook to clipboard. If there is a "See more" button here, click it.
// @description:vi  Sao chép bình luận từ Facebook vào bộ nhớ đệm. Nếu có nút "Xem thêm" ở đây, nhấn vào nó.
// @version         1.0.0
// @icon            https://i.imgur.com/F8ai0jB.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://facebook.com/*
// @match           https://*.facebook.com/*
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           none
// ==/UserScript==

let commentContent;
function writeComment2Clipboard() {
  const commendText = commentContent.innerText;
  console.log(commendText);
  if (!commendText) return;

  navigator.clipboard.writeText(commendText).then(
    () => {
      console.log('clipboard successfully set');
    },
    () => {
      console.log('clipboard write failed');
    },
  );
}

document.addEventListener('click', (e) => {
  const comment = e.target.closest('[role="article"][tabindex="-1"]');
  if (comment === null) return;

  commentContent = comment.querySelector('[lang]');
  if (commentContent === null) return;

  if (e.target.getAttribute('role') === 'button') {
    setTimeout(writeComment2Clipboard, 0);
  } else {
    writeComment2Clipboard();
  }
});
