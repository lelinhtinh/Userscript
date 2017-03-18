# YYApp downloader

Tải truyện từ **app.truyenyy.com** định dạng txt hoặc html. Sau đó, bạn có thể dùng Mobipocket Creator để tạo ebook prc.

## Demo

![YYApp downloader](https://raw.githubusercontent.com/baivong/Userscript/master/YYApp_downloader/screenshot/yyapp.png)

## Hướng dẫn

### Tải truyện

Script hoạt động sẽ tạo ra nút **Tải xuống** tại trang giới thiệu truyện, click vào sẽ tải bộ truyện đó.
Bạn có thể theo dõi quá trình trong **Console** *(F12 > console)*, nếu chương truyện lỗi sẽ hiện link màu đỏ.

Khi quá trình tải hoàn tất, định dạng file tải xuống là **txt**. Nếu bạn muốn sử dụng định dạng **html**, hãy chỉnh tham số `textOnly` trong mã nguồn thành `false`.

### Đọc truyện

Với định dạng **txt**, bạn có thể đọc trực tiếp bằng các **Ebook Reader** phổ biến trên thiết bị của bạn. Ví dụ:

* Windows: [MobiPocket Reader](http://w7.getpedia.net/data/soft/2015/09/17/mobireadersetup.msi).
* Linux: [FBReader](https://fbreader.org/content/fbreader-beta-linux-desktop).
* Windows Phone: [MoHoo Reader](https://www.microsoft.com/vi-vn/store/p/mohoo-reader/9wzdncrfj14v). *Có thể cần sửa định dạng thành `.txtbook` và nên thiết lập **Setting >> Reading > Scroll free : On** để tránh lỗi ngắt chữ*.
* Android: [AlReader](https://play.google.com/store/apps/details?id=com.neverland.alreader).

Định dạng **html** thường không được hỗ trợ đọc trực tiếp hoặc có nhiều hạn chế, bạn nên chuyển sang dạng **prc** theo hướng dẫn dưới đây.

### Tạo ebook prc

Tải phần mềm [Mobipocket Creator](http://download.cnet.com/Mobipocket-Creator/3000-13455_4-75451639.html). Khi cài đặt, nên chọn phiên bản **Creator Home Edition**.

Sau khi cài đặt hoàn tất, chạy Mobipocket Creator, trong mục **Import From Exiting File**, nhấp vào **HTML document**.

Tại trang **Import from HTML document**:

1. Choose a file: Nhấn **Browse...**, chọn file truyện bạn vừa tải trước đó.
2. Create publication in folder: Đây là vị trí chứa ebook sau khi tạo, nên **để mặc định**.
3. Language: Chọn **Vietnamese**.
4. Encoding: Chọn **UTF-8**.

Nhấn nút **Import**.

Sau khi import thành công, bạn sẽ được chuyển đến trang cấu hình cho Ebook.

Mục **Conver Image** là nơi bạn chèn ảnh bìa cho Ebook. Nhấn nút **Add a Conver image** và chọn ảnh bạn muốn làm bìa rồi nhấn nút **Update**.

Để tạo mục lục cho các chương truyện, chọn mục **Table of contents**, nhấn nút **Add a Table of contents**.

Ở phần **Table of Contents Title**, bạn điền: **Mục lục** vào ô nhập liệu.

Phần **Table of Contents Generation rules**, bạn điền vào 3 ô trên dòng **First level** lần lượt là:

1. Tagname: **h2**
2. Attribute: **class**
3. Value: **title**

Nhấn nút **Update**.

Đến đây bạn đã hoàn thành những việc cần thiết để tạo Ebook, Nhấn menu **Build** ở phía trên, sau đó chọn nút **Build** ở trang hiện ra để tạo Ebook định dạng **prc**. File này sẽ được lưu ở thư mục bạn chọn ở **Create publication in folder**. Trong thư mục này còn chứa một số file cấu hình khác, bạn có thể xóa chúng đi.
