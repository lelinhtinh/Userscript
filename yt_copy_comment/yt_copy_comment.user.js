// ==UserScript==
// @name            Youtube Copy Comment
// @name:vi         Sao Chép Bình Luận Youtube
// @namespace       https://lelinhtinh.github.io
// @description     Copy comment from Youtube to clipboard. If there is a "See more" button here, click it.
// @description:vi  Sao chép bình luận từ Youtube vào bộ nhớ đệm. Nếu có nút "Xem thêm" ở đây, nhấn vào nó.
// @version         1.0.1
// @icon            https://raw.githubusercontent.com/lelinhtinh/Userscript/master/yt_copy_comment/icon.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://www.youtube.com/live_chat
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           none
// ==/UserScript==

document.addEventListener("click", (e) => {
  const mess = e.target.closest('span[dir="auto"]');
  if (!mess?.classList?.contains("yt-live-chat-text-message-renderer")) return;

  const commendText = mess.innerText;
  // console.log(commendText);
  if (!commendText) return;

  navigator.clipboard.writeText(commendText).then(
    () => {
      document.title = commendText;
      document.body.style.cursor = 'wait'
      setTimeout(() => {
        document.body.style.cursor = 'initial'
      }, 200);
    },
    () => {
      document.body.style.cursor = 'not-allowed'
      setTimeout(() => {
        document.body.style.cursor = 'initial'
      }, 200);
    },
  );
});
