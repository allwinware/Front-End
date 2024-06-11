
/*HTML Include*/
function includeHTML(callback) {
    var z, i, elmnt, file, xhr;
    /*loop through a collection of all HTML elements:*/
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
        elmnt = z[i];
        /*search for elements with a certain atrribute:*/
        file = elmnt.getAttribute("include-html");
        if (file) {
            /*make an HTTP request using the attribute value as the file name:*/
            xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        elmnt.innerHTML = this.responseText;
                    }
                    if (this.status == 404) {
                        elmnt.innerHTML = "Page not found.";
                    }
                    /*remove the attribute, and call this function once more:*/
                    elmnt.removeAttribute("include-html");
                    includeHTML(callback);
                }
            };
            xhr.open("GET", file, true);
            xhr.send();
            /*exit the function:*/
            return;
        }
    }
    setTimeout(function () {
        callback();
    }, 0);
}

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
	$el.find('.btn_close_popup,.btn_close_popup_x, .wrapper_popup .pop_close, .btn_close_tooltip').off('click').on('click', function () {
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

	var height_ac1 = $('.seat_sheet_bg.ac1').css("height");
	var height_ac2 = $('.seat_sheet_bg.ac2').css("height");

	/*가는편 오는편*/
	$(document).on("click", "#ags-wrap", function () {
		$("#con_slider").addClass("active");
		$('.select_back').removeClass("active");
		$('.select_come').addClass("active");
		$(".travel_a").css("display", "none");
		$(".travel_b").css("display", "block");

		$('.select_backbtn').removeClass("active");
		$('.select_comebtn').addClass("active");

		//$("#ags-wrap").css("display", "none");
		//$("#ags-wrap-back").css("display", "block");
		seatCtl.setScrollEvent();

		var height_click1 = $('.seat_sheet_bg.ac1').css("height");
		var height_click2 = $('.seat_sheet_bg.ac2').css("height");

		//alert("height_click1-"+height_click1 +", height_click2-"+height_click2);
		//alert("height_ac1-"+height_ac1+", height_ac2-"+height_ac2);

		if (height_ac1 != height_click1) {
			//alert("1_1");

			if (height_ac2 != height_click2) {
				//alert("2_1");
				
				$('.seat_sheet_bg.ac2').css('height', '100%');
	
			} else {
				//alert("2_2");	
				$('.contents').css('overflow', 'hidden');
				$('.seat_sheet_bg.ac1').css('height', '100vh');
			}

		} else {
			//alert("1_2");

			if (height_ac2 != height_click2) {
				//alert("2_1");
	
			} else {
				//alert("2_2");	
				$('.seat_sheet_bg.ac2').css('height', '100%');
			}

		}
		
	});

	$(document).on("click", "#ags-wrap-back", function () {
		$("#con_slider").removeClass("active");
		$('.select_come').removeClass("active");
		$('.select_back').addClass("active");
		
		$(".travel_b").css("display", "none");
		$(".travel_a").css("display", "block");

		$('.select_backbtn').addClass("active");
		$('.select_comebtn').removeClass("active");
		

		//$("#ags-wrap-back").css("display", "none");
		//$("#ags-wrap").css("display", "block");
		seatCtl.setScrollEvent();

		var height_click1 = $('.seat_sheet_bg.ac1').css("height");
		var height_click2 = $('.seat_sheet_bg.ac2').css("height");
			
		//alert("height_click1-"+height_click1 +", height_click2-"+height_click2);
		//alert("height_ac1-"+height_ac1+", height_ac2-"+height_ac2);

		if (height_ac2 != height_click2) {
			//alert("2_1");
			
			if (height_ac1 != height_click1) {
				//alert("1_1");
				$('.contents').css('overflow', 'hidden');
				$('.seat_sheet_bg.ac2').css('height', '100vh');
			} else {
				//alert("1_2");	
				$('.seat_sheet_bg.ac1').css('height', '100%');
			}

		} else {
			//alert("2_2");

			$('.seat_sheet_bg.ac1').css('height', '100%');


		}

	});


	/*부가서비스 가는편 오는편--------------------------------*/
	$(document).on("click", "#service-come", function () {
		$("#sor_slider").removeClass("active");
		$(".service-come_btn").css("color","#222");
		$(".service-come_btn").css("border-bottom","1px solid #222");
		$(".service-back_btn").css("border-bottom","none");
		$(".service-back_btn").css("color","#aaa");		
		
		seatCtl.setScrollEvent();
		
	});

	$(document).on("click", "#service-back", function () {
		$("#sor_slider").addClass("active");				
		$(".service-come_btn").css("color","#aaa");
		$(".service-back_btn").css("color","#222");
		$(".service-come_btn").css("border-bottom","none");
		$(".service-back_btn").css("border-bottom","1px solid #222");

		seatCtl.setScrollEvent();

	});


	/*블락싯 탭탭*/
	$(document).on("click", ".block_tab_num", function () {
		$(this).addClass("block_num_active");
	});

	$(document).on("click", ".block_num_active", function () {
		$(this).removeClass("block_num_active");
	});


	/*블락싯 슬라이드 go*/
	$(document).on("click", ".block_btn_go", function () {
		$(this).addClass("block_active");
	});

	$(document).on("click", ".block_active", function () {
		$(this).removeClass("block_active");
	});


	/*좌석선택 오렌지*/

	$(document).on("click", ".seat_btn", function () {
		var isActive	= $(this).hasClass("seat_active");
		if (isActive) {
			$(this).removeClass("seat_active").find("span").show();
		} else {
			$(this).addClass("seat_active").find("span").hide();;
		}
	});

	/*좌석선택 블루*/

	$(document).on("click", ".seat_btn_blue", function () {
		var isActive	= $(this).hasClass("seat_active_blue");
		if (isActive) {
			$(this).removeClass("seat_active_blue").find("span").show();
		} else {
			$(this).addClass("seat_active_blue").find("span").hide();;
		}
	});

	/*좌석선택 핑크*/

	$(document).on("click", ".seat_btn_pink", function () {
		var isActive	= $(this).hasClass("seat_active_pink");
		if (isActive) {
			$(this).removeClass("seat_active_pink").find("span").show();
		} else {
			$(this).addClass("seat_active_pink").find("span").hide();;
		}
	});

	/*gnb 팝업 정의*/
	$(document).on("click", "#btn_gnb", function () {
		$("#gnb-2dp").addClass("active");
		$("html, body").css("overflow", "hidden");
		$(".ags-summary").css("display", "none");
		$(".ags-summary-group").css("display", "none");
		$(".ags-foods-group").css("display", "none");
	});

	$(document).on("click", "#btn_gnb-close", function () {
		$("#gnb-2dp").removeClass("active");
		$("html, body").css("overflow", "");
		$(".ags-summary").css("display", "block");
		$(".ags-summary-group").css("display", "block");
		$(".ags-foods-group").css("display", "block");
	});

	/*첫번째팝업 테스트
	$(document).on("click", ".btn_group_open", function () {
		$(".ags-summary-first").addClass("active");				
		$(".dimmed_bg").css("display", "block");
		$("body").css("overflow", "hidden");
		$("html").css("overflow", "hidden");
		
	});
	*/
	
	/*첫번째 팝업 바로띄우기*/
	$(document).ready(function(){			
		$(".dimmed_bg").css("display", "none");
	});

	$(document).on("click", ".btn_group_close,.btn_group_close_x", function () {
		$(".ags-summary-first").removeClass("active");
		$(".dimmed_bg").css("display", "none");
		$("body").css("overflow", "");
		$("html").css("overflow", "");
	});

	/*기내식예약 팝업*/
	$(document).on("click", ".btn_foods_open", function () {
		$(".ags-foods-group").addClass("active");

	});
	$(document).on("click", ".btn_foods_close", function () {
		$(".ags-foods-group").removeClass("active");
	});

	var radios = document.querySelectorAll('input[type=radio][name="foods"]');
    radios.forEach(radio => radio.addEventListener('change', () => $(".foods").css("padding-bottom", "300px")));


	/*푸터 그룹 팝업*/
	$(document).on("click", ".btn_group_open", function () {
		$(".ags-summary-group").addClass("active");				
		$(".dimmed_bg, .dimmed_bgs").css("display", "block");
		$("body").css("overflow", "hidden");
		$("html").css("overflow", "hidden");
		
	});
	$(document).on("click", ".btn_group_close", function () {
		$(".ags-summary-group").removeClass("active");
		$(".dimmed_bg, .dimmed_bgs").css("display", "none");
		$("body").css("overflow", "");
		$("html").css("overflow", "");
	});

	/*푸터 슬라이드 팝업*/
	$(document).on("click", ".btn_footer_open", function () {
		$(".ags-summary").addClass("active");				
		$(".dimmed_bg, .dimmed_bgs").css("display", "block");
		$("body").css("overflow", "hidden");
		$("html").css("overflow", "hidden");
		
	});
	$(document).on("click", ".btn_footer_close", function () {
		$(".ags-summary").removeClass("active");
		$(".dimmed_bg, .dimmed_bgs").css("display", "none");
		$("body").css("overflow", "");
		$("html").css("overflow", "");
	});
	
	/*푸터 전체 슬라이드 팝업*/
	$(document).on("click", ".blank_btn", function () {
		$(".ags-summary").addClass("active");				
		$(".dimmed_bg").css("display", "block");
		$("body").css("overflow", "hidden");
	});

	/*푸터 슬라이드 팝업 01*/
	$(document).on("click", ".slider_btn_01", function () {
		$(".ags-summary").addClass("active");				
		$(".dimmed_bg").css("display", "block");
		$("body").css("overflow", "hidden");
	});

	$(document).on("click", ".slider_btn_01_close", function () {
		$(".ags-summary").removeClass("active");
		$(".dimmed_bg").css("display", "none");
		$("body").css("overflow", "");
	});
	
	
	/*상단 내려오는 슬라이드*/
	$('.select_group_btn').click(function () {
		if ($('.passenger').css("height") == "59px") {
			$('.passenger').animate({
				height: '0px'
			});
		} else {
			$('.passenger').animate({
				height: '59px'
			});
		}
	});

	/*스케일*/
	$(document).on("click",".trigger_1_1", function () {
		console.log("trigger_1_1");
		$('.scale').removeClass('scale');
		$('.scale_type_1').css('top', '-529px');

		$('.ags-summary-group').css('display', 'block');
		$('.ags-summary').css('display', 'none');

		setTimeout(function(){
			$('.trigger_1_1').fadeOut();
			$('.ags-summary-group').fadeIn();
			$('.ags-summary').fadeOut();
		},100);

		/*추가 20240415*/
		$('.btn_group_open').hide();
		

		setTimeout(function(){
			/*추가 20240508*/
		$('.slider1 .seat_sheet_price_txt').fadeIn();		
		$('.slider1 .seat_sheet_touch_newtxt').fadeIn();
		/*추가 20240415*/
		$('.travelandtime').fadeIn();
		/*--------------------------------------------*/
		$('.slider1 .seat_sheet_number').fadeIn();
		$('.slider1 .seat_sheet_abcdef').fadeIn();
		$('.slider1 .seat_sheet_A333').fadeIn();
		$('.slider1 .airplane_bg_front_jeju').fadeIn();
		$('.slider1 .airplane_bg_end_jeju').fadeIn();
		$('.slider1 .airplane_bg_front_busan').fadeIn();
		$('.slider1 .airplane_bg_end_busan').fadeIn();

		$('.slider1 .airplane_bg_front_tway').fadeIn();
		$('.slider1 .airplane_bg_end_tway').fadeIn();

		$('.slider1 .airplane_bg_front_yp_HL838').fadeIn();
		$('.slider1 .airplane_bg_end_yp_HL838').fadeIn();

		$('.slider1 .airplane_bg_front_yp_HL851').fadeIn();
		$('.slider1 .airplane_bg_end_yp_HL851').fadeIn();
		
		$('.slider1 .airplane_bg_front').fadeIn();
		$('.slider1 .airplane_bg_end').fadeIn();

		$('.slider1 .airplane_bg_front_jinair').fadeIn();
		$('.slider1 .airplane_bg_end_jinair').fadeIn();

		$('.slider1 .airplane_bg_end').fadeIn();
		$('.slider1 .airplane_bg').fadeIn();
		$('.slider1 .popup_infor').fadeIn();
		
		$('.slider1 .seat_sheet_price_box').fadeIn();
		$('.slider1 .seat_sheet_recom_box').fadeIn();
		$('.travel_logo').fadeIn();
		$('.air_time').fadeIn();

		$('.slider1 .seat_sheet_touch_v1').fadeIn();
		$('.slider1 .digital_loading').fadeIn();

		$('.seat_sheet_touch_v0').fadeIn();
		$('.seat_sheet_touch_v00').fadeIn();
		
		$('.trigger_1').fadeIn();
							
				
		},1800);

		
		
		seatCtl.setScrollEvent();
		return false;
	});


	$(document).on("click",".trigger_1", function () {
		console.log("trigger_1");

		/*추가 20240415*/
		$('.travelandtime').fadeOut();

		/*추가 20240508*/
		$('.slider1 .seat_sheet_price_txt').hide();
		$('.slider1 .seat_sheet_touch_newtxt').hide();
		$('.slider1 .finger_mov').hide();
		
		/*--------------------------------------------*/

		$('.scale_type_1').toggleClass('scale');
		$('.scale_type_1').css('top', '0px');
		$('.contents').css('overflow-y', 'scroll');
		$('.seat_sheet_bg.ac1').css('height', '100%');
		$('.seat_sheet_bg.ac1').css('margin-bottom', '100px');
		
		setTimeout(function(){
			$('.ags-summary-group').fadeOut();
			$('.ags-summary').fadeIn();
		},500);
		
		$('.slider1 .seat_sheet_number').hide();
		$('.slider1 .seat_sheet_abcdef').hide();
		$('.slider1 .seat_sheet_A333').hide();
		$('.slider1 .airplane_bg_front_jeju').hide();
		$('.slider1 .airplane_bg_end_jeju').hide();
		$('.slider1 .airplane_bg_front_busan').hide();
		$('.slider1 .airplane_bg_end_busan').hide();

		$('.slider1 .airplane_bg_front_tway').hide();
		$('.slider1 .airplane_bg_end_tway').hide();

		$('.slider1 .airplane_bg_front_yp_HL838').hide();
		$('.slider1 .airplane_bg_end_yp_HL838').hide();

		$('.slider1 .airplane_bg_front_yp_HL851').hide();
		$('.slider1 .airplane_bg_end_yp_HL851').hide();
		
		$('.slider1 .airplane_bg_front').hide();
		$('.slider1 .airplane_bg_end').hide();

		$('.slider1 .airplane_bg_front_jinair').hide();
		$('.slider1 .airplane_bg_end_jinair').hide();

		$('.slider1 .airplane_bg_end').hide();
		$('.slider1 .airplane_bg').hide();
		$('.slider1 .popup_infor').hide();
		
		$('.slider1 .seat_sheet_price_box').hide();
		$('.slider1 .seat_sheet_recom_box').hide();
		$('.slider1 .seat_sheet_loading').hide();
		$('.travel_logo').hide();
		$('.air_time').hide();

		$('.slider1 .seat_sheet_touch_v1').hide();
		$('.slider1 .seat_sheet_touch_v2').hide();
		$('.slider1 .seat_sheet_touch_v3').hide();
		$('.slider1 .digital_loading').hide();

		$('.seat_sheet_touch_v0').hide();
		$('.seat_sheet_touch_v00').hide();		
		
		$('.trigger_1').hide();
		$('.trigger_1_1').fadeIn();

		seatCtl.setScrollEvent();
		return false;
	});
	$(document).on("click",".trigger_2", function () {
		console.log("trigger_2");
		$('.scale_type_2').toggleClass('scale');
		$('.scale_type_2').css('top', '0px');
		$('.contents').css('overflow-y', 'scroll');
		$('.seat_sheet_bg.ac2').css('height', '100%');
		
		$('.slider2 .seat_sheet_number').remove();
		$('.slider2 .seat_sheet_abcdef').remove();
		$('.slider2 .airplane_bg').remove();		
		
		
		$('.slider2 .airplane_bg_front_jeju').remove();
		$('.slider2 .airplane_bg_end_jeju').remove();
		$('.slider2 .airplane_bg_front_busan').remove();
		$('.slider2 .airplane_bg_end_busan').remove();

		$('.slider2 .airplane_bg_end').remove();
		$('.slider2 .seat_sheet_price_box').remove();
		$('.slider2 .seat_sheet_recom_box').remove();
		$('.slider2 .seat_sheet_loading').remove();
		$('.slider2 .popup_infor').remove();
		$('.air_logo').remove();
		$('.air_time').remove();

		$('.slider2 .seat_sheet_touch_v1').remove();		
		$('.slider1 .seat_sheet_touch_v2').remove();
		$('.slider1 .seat_sheet_touch_v3').remove();
		$('.slider2 .digital_loading').remove();
		
		$('.seat_sheet_touch_v0').remove();
		$('.seat_sheet_touch_v00').remove();
		
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
	/*약관동의*/
	$(".credit_box_btn").click(function () {
		var _self	= this;
//alert(		$(_self).attr("agrBtn")	);
		$("div [agrLt]").each(function(idx, obj) {
			if( _self == $("div [agrBtn]").get(idx) && $(obj).hasClass("on") == false) {
				$('.credit_box_btn').eq(idx).removeClass('on');
				$(obj).addClass("on").slideDown(300);
			} else {
				$('.credit_box_btn').eq(idx).addClass('on');			
				$(obj).removeClass("on").slideUp(300);				

			}

		});
	});

	$(".block_group_btn").click(function () {
		var _self	= this;
//alert(		$(_self).attr("agrBtn")	);
		$("div [agrLt]").each(function(idx, obj) {
			if( _self == $("div [agrBtn]").get(idx) && $(obj).hasClass("on") == false) {
				$('.block_group_btn').eq(idx).addClass('on');
				$(obj).addClass("on").slideDown(300);
			} else {
				$('.block_group_btn').eq(idx).removeClass('on');			
				$(obj).removeClass("on").slideUp(300);				

			}

		});
	});
});

/*숫자 버튼 증가감소*/

$(document).ready(function() {
    function updateCounter($counter, $gab) {
        var currentNumber = parseInt($counter.find('.number_box').text(), 10);
        if (currentNumber === 0) {
            $counter.find('.decrease_btn').addClass('active');
        } else {
            $counter.find('.decrease_btn').removeClass('active');
        }
        if (currentNumber === 25) {
            $counter.find('.increase_btn').addClass('active');
        } else {
            $counter.find('.increase_btn').removeClass('active');
        }

        // Update price based on currentNumber
        var price = 0;
        if (currentNumber >= 0 && currentNumber < 25) {
            price = currentNumber * 1000; // $1000 for each unit
        } else if (currentNumber >= 25) {
            price = 25000 + (currentNumber - 25) * 2000; // $2000 for each unit after 25
        }

        // Add comma to price
        var formattedPrice = price.toLocaleString();

        $gab.text(formattedPrice);
    }

    function setupCounter($counter, $gab) {
        updateCounter($counter, $gab);

        $counter.find('.decrease_btn').click(function() {
            var currentNumber = parseInt($counter.find('.number_box').text(), 10);
            if (currentNumber > 0) {
                currentNumber = currentNumber - 5;
                $counter.find('.number_box').text(currentNumber);
                updateCounter($counter, $gab);
            }
        });

        $counter.find('.increase_btn').click(function() {
            var currentNumber = parseInt($counter.find('.number_box').text(), 10);
            if (currentNumber < 25) {
                currentNumber = currentNumber + 5;
                $counter.find('.number_box').text(currentNumber);
                updateCounter($counter, $gab);
            }
        });
    }

    $('.baggagep_btn_chk').each(function(index) {
        var $counter = $(this);
        var $gab = $('.gab' + (index + 1)); // Assuming gab classes are named as gab1, gab2, gab3, ...

        setupCounter($counter, $gab);
    });
});

