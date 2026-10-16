// 데모 링크(data-demo-popup)를 모바일 브라우저 크기 팝업으로 연다
// 팝업이 차단되거나 모바일 기기면 링크 기본 동작(새 탭)으로 연다
(function () {
	// 갤럭시 S26 브라우저에서 실제 웹 페이지가 보이는 영역 (CSS 픽셀)
	// 화면 360x780 에서 상태바·주소창·하단 내비게이션 바를 뺀 높이
	var WIDTH = 360, HEIGHT = 650;

	document.addEventListener("click", function (e) {
		var link = e.target.closest("a[data-demo-popup]");
		if (!link) return;

		var height = Math.min(HEIGHT, screen.availHeight - 80);
		var left = Math.max(0, (screen.availWidth - WIDTH) / 2);
		var top = Math.max(0, (screen.availHeight - height) / 2);
		var features = "width=" + WIDTH + ",height=" + height + ",left=" + left + ",top=" + top
			+ ",menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes";

		var popup = window.open(link.href, "allwinDemo", features);
		if (popup) {
			popup.focus();
			e.preventDefault();
		}
	});
})();
