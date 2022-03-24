// 레이어팝업
function layerPop(id) {
	var $el = $('#' + id);

	if ($el.hasClass('alert') || $el.hasClass('sns') || $el.hasClass('keypad') || $el.hasClass('tooltip') || $el.hasClass('menuAll')) {
		// dimmed 개수 확인 후 추가
		if ($el.find('> .dimmed').length == 0) {
			// alert, bottom 팝업일 경우 dimmed 추가
			$el.prepend('<div class="dimmed" />');
		}
	}

	// PIST2.0 추가 - 21.04.23
	if ($el.hasClass('pist20')) {
		layerPop20(id);
		return false;
	}

	// wrapper 스크롤 hidden 처리
	$('#wrapper').css('overflow-y', 'hidden');

	// 팝업 표시
	$el.fadeIn();

	if ($el.hasClass('menuAll')) {
		$('.menuAll').find('.wrapper_popup').stop(true, true).animate({
			right: '0'
		}, 400);
	}

	// 닫기버튼 클릭시 레이어 닫힘
	$el.find('.btn_close_popup, .wrapper_popup .pop_close, .btn_close_tooltip').off('click').on('click', function () {
		closeLayerPop();
	});

	if ($el.hasClass('sns') || $el.hasClass('tooltip') || $el.hasClass('clickable_dim') || $el.hasClass('menuAll')) {
		// 딤드 배경 클릭시 레이어 닫힘
		$el.find('.dimmed').click(function () {
			closeLayerPop();
		});
	}

	function closeLayerPop() {
		if ($el.hasClass('menuAll')) {
			$el.find('.wrapper_popup').animate({
				right: -$('.menuAll').width()
			}, 400, function () {
				$el.find('.dimmed').remove();
				$el.fadeOut();
			});
		} else {
			$el.fadeOut(300, function () {
				// dimmed 삭제
				if ($el.hasClass('sns') || $el.hasClass('keypad') || $el.hasClass('tooltip') || $el.hasClass('clickable_dim')) {
					$el.find('.dimmed').remove();
				}

			});
		}
		// wrapper 스크롤 hidden 처리 해제
		$('#wrapper').css('overflow-y', 'auto');
		return false;
	}

	// 탭이 있을 경우 탭 상단좌표 가져오기
	$el.find('.grp_tab.st_01').each(function () {
		var tabTopPopup = $(this).position().top - 52;
		initTab(tabTopPopup);
	});
}

var seatCtl	= {
	setScrollEvent	: function() {

		var itryNo	= 0;

		if($("#ags-wrap").css("display") == "block") {
			itryNo	= 1;
		} else {
			itryNo	= 2;
		}		
		if($('.scale_type_'+itryNo).eq(0).hasClass("scale") == true) {
			$('.contents').removeClass("ovrFlw");
		} else {
			$('.contents').addClass("ovrFlw");
		}
	}
};

/*상단 셀렉트 그룹*/
$(document).ready(function () {

	/*가는편 오는편*/
	$(document).on("click", "#ags-wrap", function () {
		$("#con_slider").addClass("active");
		$("#ags-wrap").css("display", "none");
		$("#ags-wrap-back").css("display", "block");
/*
		if ($('.seat_sheet_bg.ac1').css("height") == "100%") {
			
		} else {
			$('.seat_sheet_bg.ac2').css('height', '100vh');
			$('.contents').css('overflow', 'hidden');
		}
*/
		seatCtl.setScrollEvent();
	});

	$(document).on("click", "#ags-wrap-back", function () {
		$("#con_slider").removeClass("active");
		$("#ags-wrap-back").css("display", "none");
		$("#ags-wrap").css("display", "block");
		seatCtl.setScrollEvent();
	});

	/*좌석선택 오렌지*/
	$(document).on("click", ".seat_btn", function () {
		$(this).addClass("seat_active");
	});

	$(document).on("click", ".seat_active", function () {
		$(this).removeClass("seat_active");
	});

	/*좌석선택 블루*/
	$(document).on("click", ".seat_btn_blue", function () {
		$(this).addClass("seat_active_blue");
	});

	$(document).on("click", ".seat_active_blue", function () {
		$(this).removeClass("seat_active_blue");
	});

	/*gnb 팝업 정의*/
	$(document).on("click", "#btn_gnb", function () {
		$("#gnb-2dp").addClass("active");
		$("html, body").css("overflow", "hidden");
	});

	$(document).on("click", "#btn_gnb-close", function () {
		$("#gnb-2dp").removeClass("active");
		$("html, body").css("overflow", "");
	});

	/*푸터 슬라이드 팝업*/
	$(document).on("click", ".btn_footer_open", function () {
		$(".ags-summary").addClass("active");
	});

	$(document).on("click", ".btn_footer_close", function () {
		$(".ags-summary").removeClass("active");
	});
	
	/*상단 내려오는 슬라이드*/
	$('.select_group_btn').click(function () {
		if ($('.passenger').css("height") == "55px") {
			$('.passenger').animate({
				height: '0px'
			});
		} else {
			$('.passenger').animate({
				height: '55px'
			});
		}
	});

	/*스케일*/
	$('.trigger_1').on('click', function () {
		$('.scale_type_1').toggleClass('scale');
		$('.scale_type_1').css('top', '0px');
		$('.contents').css('overflow-y', 'scroll');
		$('.seat_sheet_bg.ac1').css('height', '100%');
		

		$('.slider1 .seat_sheet_number').remove();
		$('.slider1 .seat_sheet_abcdef').remove();
		$('.slider1 .airplane_bg').remove();
		$('.slider1 .seat_sheet_price_box').remove();
		$('.slider1 .seat_sheet_recom_box').remove();
		$('.slider1 .seat_sheet_loading').remove();

		$('.slider1 .seat_sheet_touch').remove();
		$('.slider1 .digital_loading').remove();

		$(this).remove();

		seatCtl.setScrollEvent();
		return false;
	});
	$('.trigger_2').on('click', function () {
		$('.scale_type_2').toggleClass('scale');
		$('.scale_type_2').css('top', '0px');
		$('.contents').css('overflow-y', 'scroll');
		$('.seat_sheet_bg.ac2').css('height', '100%');
		
		$('.slider2 .seat_sheet_number').remove();
		$('.slider2 .seat_sheet_abcdef').remove();
		$('.slider2 .airplane_bg').remove();
		$('.slider2 .seat_sheet_price_box').remove();
		$('.slider2 .seat_sheet_recom_box').remove();
		$('.slider2 .seat_sheet_loading').remove();

		$('.slider2 .seat_sheet_touch').remove();
		$('.slider2 .digital_loading').remove();

		$(this).remove();

		seatCtl.setScrollEvent();
		return false;
	});


	
	$('#down_btn').click(function () {
		var offset = $('#section4').offset(); //선택한 태그의 위치를 반환

		//animate()메서드를 이용해서 선택한 태그의 스크롤 위치를 지정해서 0.4초 동안 부드럽게 해당 위치로 이동함

		$('html').animate({
			scrollTop: offset.top
		}, 400);
	});
	$('#up_btn').click(function () {
		var offset = $('#section1').offset(); //선택한 태그의 위치를 반환

		//animate()메서드를 이용해서 선택한 태그의 스크롤 위치를 지정해서 0.4초 동안 부드럽게 해당 위치로 이동함

		$('html').animate({
			scrollTop: offset.top
		}, 400);
	});
	
	/*카드결제 슬라이드*/

	$(".card_slider").click(function () {
		/*
		$(this).next("#card_slider_box").stop().slideToggle(300);
		$(this).toggleClass('on').siblings().removeClass('on');
		$(this).next("#card_slider_box").siblings("#card_slider_box").slideUp(300); // 1개씩 펼치기
	 */
		$('#card_slider_box').stop().slideToggle(300);
		$(this).toggleClass('on').siblings().removeClass('on');
		$('#card_slider_box').siblings("#card_slider_box").slideUp(300); // 1개씩 펼치기
	 
	
	
	});

	/*$('.contents').addClass("ovrFlw");*/

});



