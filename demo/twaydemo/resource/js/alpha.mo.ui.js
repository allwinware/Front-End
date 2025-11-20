
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

/* 변경 추가 ***************************************----------------------------****************/

// ✅ slider1 요약 업데이트
function updateSummary1(value) {
	$(".slider1-summary .summary-content").text(value);
  }
  
  // ✅ slider2 요약 업데이트
  function updateSummary2(value) {
	$(".slider2-summary .summary-content").text(value);
  }
  
  // 라디오 선택 시 분기
  $(document).on("change", ".slider1 input[type=radio]", function() {
	let val = $(this).siblings("label").find(".foodsfst_txt1").text();
	$(".slider1-summary .summary-content").text(val);
  });
  
  $(document).on("change", ".slider2 input[type=radio]", function() {
	let val = $(this).siblings("label").find(".foodsfst_txt1").text();
	$(".slider2-summary .summary-content").text(val);
  });

/* 변경 ***************************************----------------------------****************/


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

		
		/* 추가 ***************************************----------------------------****************/

		$(".slider1-summary").hide();
  		$(".slider2-summary").show();

		/* 추가 ***************************************----------------------------****************/

		
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

		/* 추가 ***************************************----------------------------****************/

		/* 추가 ***************************************----------------------------****************/
		$(".slider1-summary").show();
 		$(".slider2-summary").hide();
		/* 추가 ***************************************----------------------------****************/


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


	/*좌석선택 */

	$(document).on("click", ".seat_btn", function () {
		var isActive	= $(this).hasClass("seat_active");
		if (isActive) {
			$(this).removeClass("seat_active").find("span").show();
		} else {
			$(this).addClass("seat_active").find("span").hide();;
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
		$(".dimmed_bgs").css("display", "none");
		$("body").css("overflow", "");
		$("html").css("overflow", "");
	});

	/*demo*/
	$(document).on("click", ".btn_demo_pop01", function () {
		$(".footer-first-pop").addClass("active");					
		$(".dimmed_bg, .dimmed_bgs").css("display", "block");
		$("body").css("overflow", "hidden");
		$("html").css("overflow", "hidden");
		
	});
	$(document).on("click", ".btn_demo_pop02", function () {
		$(".footer-twst-pop").addClass("active");					
		$(".dimmed_bg, .dimmed_bgs").css("display", "block");
		$("body").css("overflow", "hidden");
		$("html").css("overflow", "hidden");
		
	});


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
	$(document).on("click", ".btn_footer_closex", function () {
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
		$("html").css("overflow", "hidden");
	});

	/*푸터 슬라이드 팝업 01*/
	$(document).on("click", ".slider_btn_01", function () {
		$(".ags-summary").addClass("active");				
		$(".dimmed_bg").css("display", "block");
		
		$("body").css("overflow", "hidden");
		$("html").css("overflow", "hidden");
	});

	$(document).on("click", ".slider_btn_01_close", function () {
		$(".ags-summary").removeClass("active");
		$(".dimmed_bg").css("display", "none");		
		$("body").css("overflow", "");
		$("html").css("overflow", "");
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

		$('.demo_popup1').hide();
		
		seatCtl.setScrollEvent();
		return false;
	});
	$(document).on("click",".trigger_2", function () {
		console.log("trigger_1");
	
		/*추가 20240415*/
		$('.travelandtime').fadeOut();
	
		/*추가 20240508*/
		$('.slider2 .seat_sheet_price_txt').hide();
		$('.slider2 .seat_sheet_touch_newtxt').hide();
		$('.slider2 .finger_mov').hide();
		
		/*--------------------------------------------*/
	
		$('.scale_type_1').toggleClass('scale');
		$('.scale_type_1').css('top', '0px');
		$('.contents').css('overflow-y', 'scroll');
		$('.seat_sheet_bg.ac1').css('height', '100%');
		$('.seat_sheet_bg.ac1').css('margin-bottom', '100px');
		
		setTimeout(function(){
			$('.ags-summary').fadeIn();
		},500);
		
		$('.slider2 .seat_sheet_number').hide();
		$('.slider2 .seat_sheet_abcdef').hide();
		$('.slider2 .seat_sheet_A333').hide();
		$('.slider2 .airplane_bg_front_jeju').hide();
		$('.slider2 .airplane_bg_end_jeju').hide();
		$('.slider2 .airplane_bg_front_busan').hide();
		$('.slider2 .airplane_bg_end_busan').hide();
	
		$('.slider2 .airplane_bg_front_tway').hide();
		$('.slider2 .airplane_bg_end_tway').hide();
	
		$('.slider2 .airplane_bg_front_yp_HL838').hide();
		$('.slider2 .airplane_bg_end_yp_HL838').hide();
	
		$('.slider2 .airplane_bg_front_yp_HL851').hide();
		$('.slider2 .airplane_bg_end_yp_HL851').hide();
		
		$('.slider2 .airplane_bg_front').hide();
		$('.slider2 .airplane_bg_end').hide();
	
		$('.slider2 .airplane_bg_front_jinair').hide();
		$('.slider2 .airplane_bg_end_jinair').hide();
	
		$('.slider2 .airplane_bg_end').hide();
		$('.slider2 .airplane_bg').hide();
		$('.slider2 .popup_infor').hide();
		
		$('.slider2 .seat_sheet_price_box').hide();
		$('.slider2 .seat_sheet_recom_box').hide();
		$('.slider2 .seat_sheet_loading').hide();
		$('.travel_logo').hide();
		$('.air_time').hide();
	
		$('.slider2 .seat_sheet_touch_v1').hide();
		$('.slider2 .seat_sheet_touch_v2').hide();
		$('.slider2 .seat_sheet_touch_v3').hide();
		$('.slider2 .digital_loading').hide();
	
		$('.seat_sheet_touch_v0').hide();
		$('.seat_sheet_touch_v00').hide();		
		
		$('.trigger_2').hide();
		$('.trigger_2_1').fadeIn();
	
		$('.demo_popup1').hide();
		
		
        $(".boxbox_text1").css("display", "block");

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
				
				$('.credit_box_btn').eq(idx).addClass('on');
				$(obj).addClass("on").slideDown(300);
			} else {
				$('.credit_box_btn').eq(idx).removeClass('on');
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

/*숫자 버튼 증가감소

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
*/

/* 전체 선택 Checkbox */

function selectAll(selectAll)  {
	const checkboxes 
	   = document.querySelectorAll('input[type="checkbox"]');
/*
	   = document.getElementsByName('check_group9');
	*/
	checkboxes.forEach((checkbox) => {
	  checkbox.checked = selectAll.checked
	})
  }

$(function () {
    $("input[data-checked='all']").each(function () {
        var $trigger = $(this),
            $family = $("input[type='checkbox'][name='" + $(this).attr("name") + "']").not($(this)).not(":disabled");
        $trigger.on("change", function () {
            if ($(this).is(":checked")) {
                $family.prop("checked", true);
            } else {
                $family.prop("checked", false);
            }
        });
        $family.on("change", function () {
            var checkedFamily = $("input[type='checkbox'][name='" + $(this).attr("name") + "']:checked").not($trigger);
            if ($family.length === checkedFamily.length) {
                $trigger.prop("checked", true);
            } else {
                $trigger.prop("checked", false);
            }
        });
    });
});

// 스크롤 왔다갔다 안하게
function toggleScrollBasedOnDisplay() {
    const playLoad = $('.play_load');
    if (playLoad.css('display') === 'block') {
        $('html').addClass('scrollDisable').on('scroll touchmove mousewheel', function(e) {
            e.preventDefault();
        });
    } else {
        $('html').removeClass('scrollDisable').off('scroll touchmove mousewheel');
    }
}

$(document).ready(function() {
    toggleScrollBasedOnDisplay();
});

//버튼 눌렀을때 display block

function showPlayLoad() {
    const playLoadDiv = document.querySelector('.play_load');
    if (playLoadDiv) {
        playLoadDiv.style.display = 'block';
    }
}


//cs_center 왔다갔다

  $(document).ready(function() {
    
    // cs_center div 안의 링크 요소를 선택
    const links = $(".cs_center a");
    $(".m_csmsg1").css("display", "block");
    $(".m_csmsg2").css("display", "none");
    $(".m_csmsg3").css("display", "none");
    // 각 링크에 클릭 이벤트 핸들러 추가
    links.on("click", function(event) {
        event.preventDefault(); // 기본 링크 동작 방지

        // 모든 버튼의 active 클래스 제거
        removeActiveClass();

        // 클릭한 링크에 active 클래스 추가
        $(this).addClass("active");

        // 메시지 업데이트
        const index = $(".cs_center a").index(this);
        displayMessage('.m_csmsg' + (index + 1));
    });

    function removeActiveClass() {
        // 모든 링크에서 active 클래스 제거
        links.removeClass("active");
    }

    function displayMessage(messageClass) {
        // 모든 메시지 숨김
        $(".csmessage").css("display", "none");

        // 특정 메시지를 보이도록 설정
        $(messageClass).css("display", "block");
    }

});

//마이페이지 왔다갔다

$(document).ready(function() {
    // 초기 상태 설정
    $(".m_csmsga1").css("display", "block");
    $(".m_csmsga2, .m_csmsga3, .m_csmsga4").css("display", "none");

    // 공통 함수: active 클래스 제거
    function removeActiveClass(links) {
        links.removeClass("active");
    }

    // 공통 함수: 메시지 표시
    function displayMessage(messageClass) {
        $(".mypagecsmg").css("display", "none");
        $(messageClass).css("display", "block");
    }

    // mypagecs_center 링크 이벤트
    const mypageLinks = $(".mypagecs_center a");
    mypageLinks.on("click", function(event) {
        event.preventDefault();
        removeActiveClass(mypageLinks);
        $(this).addClass("active");
        const index = mypageLinks.index(this);
        displayMessage('.m_csmsga' + (index + 1));
    });
/*
    // ags-header 링크 이벤트
    const agsLinks = $(".ags-header a");
    agsLinks.on("click", function(event) {
        event.preventDefault();
        removeActiveClass(agsLinks);
        // 추가: mypagecs_center의 active 클래스도 제거
        removeActiveClass(mypageLinks);
        $(this).addClass("active");
        const index = agsLinks.index(this);
        displayMessage('.m_csmsga' + (index + 1));
    });
*/
});



  function toggleVisibility(div) {
    var $folderContent = $(div).next('.folder-content');
    var isActive = $folderContent.hasClass('folder-open');

    // Close all folders
    $('.folder-content').slideUp(200).removeClass('folder-open');

    // Remove "active" class from all qna-boxes
    $('.qna-box').removeClass('active');

    // Toggle the clicked folder's state
    if (!isActive) {
        $folderContent.slideDown(200).addClass('folder-open');
        $(div).parent('.qna-box').addClass('active');
    }
}
$(document).ready(function () {
	// 처음부터 active인 아이템은 열어줌
	$(".accordion-item.active .accordion-content").show();
  
	// 아코디언 헤더 클릭
	$(".accordion-header").click(function () {
	  let item = $(this).parent(".accordion-item");
	  let content = item.find(".accordion-content.active");
  
	  if (content.length > 0) {
		// 이미 열려 있으면 -> 전부 닫기
		$(".accordion-content").slideUp(200).removeClass("active");
		$(".accordion-item").removeClass("active");
	  } else {
		// 전부 닫기
		$(".accordion-content").slideUp(200).removeClass("active");
		$(".accordion-item").removeClass("active");
  
		// 첫 번째 박스 열기
		let firstBox = item.find(".accordion-content").first();
		firstBox.slideDown(200).addClass("active");
		item.addClass("active");
  
		// 텍스트도 초기화
		$(".accor_txt1, .accor_txt2, .accor_txt3, .accor_txt4, .accor_txt5").hide();
		$(".accor_txt1").show();
	  }
	});
  
	// nextbox 전환
	$(".nextbox").click(function () {
	  let current = $(this);
	  let next;
  
	  if (current.hasClass("nextbox5")) {
		// nextbox5 → nextbox2
		next = $(".nextbox2");
	  } else {
		// 다음 순서 박스로 이동
		next = current.next(".accordion-content");
	  }
  
	  if (next.length > 0) {
		current.removeClass("active").hide();
		next.addClass("active").show();
  
		// accor_txt 전환
		$(".accor_txt1, .accor_txt2, .accor_txt3, .accor_txt4, .accor_txt5").hide();
  
		if (current.hasClass("nextbox1")) {
		  $(".accor_txt2").show();
		} else if (current.hasClass("nextbox2")) {
		  $(".accor_txt3").show();
		} else if (current.hasClass("nextbox3")) {
		  $(".accor_txt4").show();
		} else if (current.hasClass("nextbox4")) {
		  $(".accor_txt5").show();
		} else if (current.hasClass("nextbox5")) {
		  $(".accor_txt2").show(); // 5번 → 2번
		}
		// 📌 스크롤 이동 추가
		$('html, body').animate({
			scrollTop: next.offset().top
		}, 400);
		}
	});
  
	// 처음에는 accor_txt1만 보이게
	$(".accor_txt2, .accor_txt3, .accor_txt4, .accor_txt5").hide();
  });
  



  $(function(){
    // "hh:mm" → 총 분 단위로 변환
    function parseHHMM(str) {
      let parts = str.split(':');
      let h = parseInt(parts[0], 10) || 0;
      let m = parseInt(parts[1], 10) || 0;
      return h * 60 + m;
    }

    // 총 분 → "hh:mm" 포맷
    function formatHHMM(totalMinutes) {
      if (totalMinutes < 0) totalMinutes = 0;
      let h = Math.floor(totalMinutes / 60);
      let m = totalMinutes % 60;
      return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
    }

    let $timer = $('#timer');
    let initialText = $timer.text().trim();
    let totalMinutes = parseHHMM(initialText);

    let intervalId = setInterval(function(){
      totalMinutes--;

      if (totalMinutes <= 0) {
        $timer.text('00:00');
        clearInterval(intervalId);
        return;
      }

      $timer.text(formatHHMM(totalMinutes));
    }, 60000); // 1분(60,000ms)마다 감소
  });


  /*체크 클릭 클릭..******************** */
  $(document).on("change", ".foodsfst input[type=radio]", function() {
	let idx = $(this).attr("id").replace("chk", ""); // chk1 → 1
	let target = $("#boy_face" + idx);
  
	if ($(this).is(":checked")) {
	  target.addClass("active");
	} else {
	  target.removeClass("active");
	}
  });

$(document).on("click", ".btn_bags_open", function () {
	$(".ags_bags_contents").addClass("active");
	
	$(".dimmed_bg, .dimmed_bgs").css("display", "block");
	$("body").css("overflow", "hidden");
	$("html").css("overflow", "hidden");

});
$(document).on("click", ".btn_bags_close", function () {
	$(".ags_bags_contents").removeClass("active");
	
	$(".dimmed_bg, .dimmed_bgs").css("display", "none");
	
	$("body").css("overflow", "");
	$("html").css("overflow", "");
});

/*첫번째 팝업 닫기*/
$(document).on("click", ".footer-first_close, .close_btn_1", function () {
    $(".footer-first-pop").removeClass("active");
    $(".dimmed_bg, .dimmed_bgs").css("display", "none");	
	$("body").css("overflow", "");
	$("html").css("overflow", "");
});

$(document).on("click", ".footer-feets_close, .close_btn_2", function () {
	$(".footer-feets-pop").removeClass("active");
    $(".dimmed_bg, .dimmed_bgs").css("display", "none");	
	$("body").css("overflow", "");
	$("html").css("overflow", "");
});




/*bagggage*/
var lastSelectedQty = null;

$(document).on("click", ".bag_slider_name_box .demos_boxs", function () {	

    var $group = $(this).closest(".bag_slider_name_box");
    var $clicked = $(this);
    var qty = $clicked.find(".demos_boxs_tx1").text().trim();

    // active 클래스 토글 처리
    if ($clicked.hasClass("active")) {
//        $clicked.removeClass("active");
        lastSelectedQty = null;
//        $group.find(".bag_slider_name_box_1 .fst div:last").text("합 0개");
//
//        // 텍스트 복원
//        if (qty === "+5KG") {
//            $clicked.find(".demos_boxs_tx3").text("주문 아주 많아요");
//        }
//        if (qty === "+10KG") {
//            $clicked.find(".demos_boxs_tx3").text("주문 많아요");
//        }
    } else {
//        // 기존 선택 해제와 텍스트 초기화 (클릭한 박스 제외)
//        $group.find(".demos_boxs").removeClass("active");
//        $group.find(".demos_boxs").each(function () {
//            if ($(this).is($clicked)) return; // ← 클릭한 박스는 제외
//            var thisQty = $(this).find(".demos_boxs_tx1").text().trim();
//            if (thisQty === "+5KG") {
//                $(this).find(".demos_boxs_tx3").text("주문 아주 많아요");
//            }
//            if (thisQty === "+10KG") {
//                $(this).find(".demos_boxs_tx3").text("주문 많아요");
//            }
//        });
//
//        // 새 선택 활성화 및 텍스트 변경
//        $clicked.addClass("active");
        lastSelectedQty = qty;
//        $group.find(".bag_slider_name_box_1 .fst div:last").text("합 " + lastSelectedQty);
//
//        if (qty === "+5KG") {
//            $clicked.find(".demos_boxs_tx3").text("25,000원 절약");
//        }
//        if (qty === "+10KG") {
//            $clicked.find(".demos_boxs_tx3").text("50,000원 절약");
//        }
    }

	var remainingElem = $(".countdown_b");
    var remaining = parseInt(remainingElem.text());

    var qty = $(this).find(".demos_boxs_tx1").text().trim();

    

    // 체크박스 옆 텍스트 갱신
//    $("#check5").siblings("label").find("span.blue_text").text((lastSelectedQty || "0개") + "로 ");
//    $("#check6").siblings("label").find("span.blue_text").text((lastSelectedQty || "0개") + "로 ");
});


//----------------------------------------------------------------
//
//$(document).on("click", ".slider_box_line .demos_boxs", function () {
//    if ($(this).find(".demos_boxs_tx1").text().trim() === "+5KG") {
//        $(this).find(".demos_boxs_tx3").text("25,000원 절약");
//		$(".demo_gnb_menu1 div:nth-child(3)").text("65,000 절약");
//    }
//	if ($(this).find(".demos_boxs_tx1").text().trim() === "+10KG") {
//        $(this).find(".demos_boxs_tx3").text("50,000원 절약");
//		$(".demo_gnb_menu1 div:nth-child(3)").text("130,000 절약");
//    }
//	if ($(this).find(".demos_boxs_tx1").text().trim() === "+15KG") {
//        $(this).find(".demos_boxs_tx3").text("75,000원 절약");
//		$(".demo_gnb_menu1 div:nth-child(3)").text("195,000 절약");
//    }
//	if ($(this).find(".demos_boxs_tx1").text().trim() === "+20KG") {
//        $(this).find(".demos_boxs_tx3").text("100,000원 절약");
//		$(".demo_gnb_menu1 div:nth-child(3)").text("260,000 절약");
//    }
//});
//
//
//$(document).on("click", ".bag_slider_name_box .demos_boxs", function () {
//    var remainingElem = $(".countdown_b");
//    var remaining = parseInt(remainingElem.text());
//
//
//    // 1개 선택 시에만 1 차감 (기본값 9에서 8로)
//    var qty = $(this).find(".demos_boxs_tx1").text().trim();
//
//
//    if (qty === "1개" || qty === "1") { // "1개" 텍스트 기준
//        if (remaining > 0) {  // 0 미만 불가
//            remaining--;
//            remainingElem.text(remaining);
//        }
//    }
//});

//----------------------------------------------------------------


// 전원 통일하기 (check5, check6)
//$(document).on("change", "#check5, #check6", function () {
//  let $this = $(this);
//
//  if ($this.is(":checked")) {
//    if (!lastSelectedQty) {
//      alert("수하물을 눌러주세요");
//      $this.prop("checked", false); // 체크 해제
//      return;
//    }
//
//    // 다른 체크박스는 해제
//    if ($this.attr("id") === "check5") {
//      $("#check6").prop("checked", false);
//    } else {
//      $("#check5").prop("checked", false);
//    }
//
//    // 전체 사람 블록 반복
//    $(".bag_slider_name_box").each(function () {
//      var $group = $(this);
//
//      // active 초기화
//      $group.find(".demos_boxs").removeClass("active");
//
//      // lastSelectedQty와 같은 버튼 찾기
//      $group.find(".demos_boxs").each(function () {
//        if ($(this).find(".demos_boxs_tx1").text() === lastSelectedQty) {
//          $(this).addClass("active");
//        }
//      });
//
//      // 합 텍스트 업데이트
//      $group.find(".bag_slider_name_box_1 .fst div:last").text("합 " + lastSelectedQty);
//    });
//
//    // 전원 통일하기 옆 텍스트 변경
//    $this.siblings("label").find("span.blue_text").text(lastSelectedQty + "로 ");
//  } else {
//    // 체크 해제 시 모든 선택과 합계 초기화
//    $(".bag_slider_name_box").each(function () {
//      var $group = $(this);
//      $group.find(".demos_boxs").removeClass("active");
//      $group.find(".bag_slider_name_box_1 .fst div:last").text("합 0개");
//    });
//    lastSelectedQty = null;
//    $this.siblings("label").find("span.blue_text").text("");
//  }
//});



let selectedOption = null; // 현재 선택된 옵션 (예: "+10KG(KRW 130,000)")
let selectedWeight = null; // KG 값만 따로 저장 (예: "10KG")

// 위 슬라이드 옵션 클릭 시
$(document).on("click", ".bag_slider_box .demos_boxs", function () {
  var $group = $(this).closest(".bag_slider_box");
  $group.find(".demos_boxs").removeClass("active");
  $(this).addClass("active");

  // 선택한 값 저장
  selectedWeight = $(this).find(".demos_boxs_tx1").text();
  let price = $(this).find(".demos_boxs_tx2").text();
  selectedOption = `${selectedWeight}(${price})`;

  // "전원 통일하기" 옆 텍스트 업데이트
//  $(".bag_txt_same .blue_text").text(selectedWeight);
});

// 개별 '추가하기' 클릭 시
//$(document).on("click", ".bag_slider_name_box_2", function () {
//  if (!selectedOption) {
//    alert("먼저 위에서 수하물 옵션을 선택해주세요.");
//    return;
//  }
//  let $box = $(this).closest(".bag_slider_name_box");
//  applyOptionToBox($box, selectedOption);
//});

//// X 버튼 클릭 시
//$(document).on("click", ".bag_slider_name_box_2_1_img", function () {
//  let $box = $(this).closest(".bag_slider_name_box");
//  $box.find(".bag_slider_name_box_2_1").remove();
//  $box.find(".bag_slider_name_box_2").show();
//});

// 전원 통일하기 체크/해제 시 (여기 중요!!)
//$(document).on("change", "#check1", function () {
//  if ($(this).is(":checked")) {
//    if (selectedOption) {
//      applyToAll(selectedOption);
//    } else {
//      alert("먼저 위에서 수하물 옵션을 선택해주세요.");
//      $(this).prop("checked", false); // 선택 없으면 다시 해제
//    }
//  } else {
//    resetAll();
//  }
//});

// ✅ 개별 박스에 옵션 적용하는 함수
//function applyOptionToBox($box, optionText) {
//  $box.find(".bag_slider_name_box_2").hide();
//  $box.find(".bag_slider_name_box_2_1").remove();
//  $box.append(`
//    <div class="bag_slider_name_box_2_1">
//      <div class="bag_slider_name_box_2_1_txt">${optionText}</div>
//      <div class="bag_slider_name_box_2_1_img"></div>
//    </div>
//  `);
//}

// ✅ 전체 적용 함수
//function applyToAll(optionText) {
//  $(".bag_slider_name_box").each(function () {
//    let $box = $(this);
//    applyOptionToBox($box, optionText);
//  });
//}

// ✅ 전체 초기화 함수
//function resetAll() {
//  $(".bag_slider_name_box").each(function () {
//    let $box = $(this);
//    $box.find(".bag_slider_name_box_2_1").remove();
//    $box.find(".bag_slider_name_box_2").show();
//  });
//}




//$(document).on("click", ".bag_slider_name_box_a .demos_boxs", function () {
//    if ($(this).find(".demos_boxs_tx1").text().trim() === "1개") {
//        $(this).find(".demos_boxs_tx3").text("약 25분 아낌");
//		$(".demo_gnb_menu1 div:nth-child(3)").text("6,000 절약");
//    }
//	if ($(this).find(".demos_boxs_tx1").text().trim() === "2개") {
//        $(this).find(".demos_boxs_tx3").text("약 25분 아낌");
//		$(".demo_gnb_menu1 div:nth-child(3)").text("12,000 절약");
//    }
//	if ($(this).find(".demos_boxs_tx1").text().trim() === "3개") {
//        $(this).find(".demos_boxs_tx3").text("약 25분 아낌");
//		$(".demo_gnb_menu1 div:nth-child(3)").text("18,000 절약");
//    }
//});

/************************************** */

function updateSelectedCount() {
    var checked = $('.demos_chk_box.active').length;
    var total = $('.demos_chk_box').length;
    $('.demos_chk_name1 div').first().text(checked + '/' + total + ' 선택');
}

document.addEventListener('DOMContentLoaded', function() {
    var lis = document.querySelectorAll('ul li');

    for (var i = 0; i < 3; i++) {
        if (!lis[i]) continue;
        var medalElem = lis[i].querySelector('.foodsfst_medal');
        if (medalElem) {
            medalElem.classList.remove('foodsfst_medal', 'foodsfst_medal1', 'foodsfst_medal2', 'foodsfst_medal3');
            medalElem.classList.add('foodsfst_medal' + (i + 1));
        }
    }
});


$(document).ready(function() {
	
   var initialOrder = [];  

	$(document).ready(function() {

    initialOrder = $('#menuList').children('li').toArray();
		
		var sausageRearranged = false;
		var sushiRearranged = false;

		$(document).on('change', '.btn_foods_open', function() {
			var $this = $(this);
			var menuName = $this.closest('li').find('.foodsfst_txt1').clone()
				.children('span').remove().end()
				.text().trim();

			var $ul = $this.closest('ul');
			var $lis = $ul.children('li');

			if ($this.prop('checked')) {
				var activeCount = $('.demos_chk_box.active').length;
				var totalCount = $('.demos_chk_box').length;

				if (activeCount < totalCount) {
					var $targetBox = $('.demos_chk_box').not('.active').first();

					$targetBox.find('div:last').text(menuName);
					$targetBox.addClass('active');
					$targetBox.find('.boy_face1').addClass('active');
					$targetBox.find('.chk_box_boxbox').show();
				}

				$('#check9').prop('checked', false);
				
			} else {
				var index = $this.closest('li').index();
				$('.demos_chk_box').eq(index).removeClass('active');
				$('.demos_chk_box').eq(index).find('.boy_face1').removeClass('active');
				$('.demos_chk_box').eq(index).find('.chk_box_boxbox').hide();
				$('.demos_chk_box').eq(index).find('div:last').text('');	
				
			}

			if (menuName === "소시지 오므라이스" && $this.prop('checked') && !sausageRearranged) {
				sausageRearranged = true; // 플래그 세팅

				$('.top_txtp').text("여성이 좋아하는 TOP3");

				var $li567 = $lis.slice(4, 7);
				var $liOthers = $lis.not($li567);

				$ul.empty();
				$li567.each(function() { $ul.append(this); });
				$liOthers.each(function() { $ul.append(this); });

				$ul.find('.foodsfst_medal1, .foodsfst_medal2, .foodsfst_medal3')
					.removeClass('foodsfst_medal1 foodsfst_medal2 foodsfst_medal3');

				var $newLis = $ul.children('li');
				$newLis.eq(0).find('.foodsfst_medal').addClass('foodsfst_medal1');
				$newLis.eq(1).find('.foodsfst_medal').addClass('foodsfst_medal2');
				$newLis.eq(2).find('.foodsfst_medal').addClass('foodsfst_medal3');

				$this.prop('checked', false);
			} else if (menuName === "유부초밥" && $this.prop('checked') && !sushiRearranged) {
				sushiRearranged = true; 

				$('.top_txtp').text("남성이 좋아하는 TOP3");

				var $topItems = $lis.slice(7, 9);  // 8, 9번 li 선택
				var $otherItems = $lis.not($topItems);

				$ul.empty();
				$topItems.each(function() { $ul.append(this); });
				$otherItems.each(function() { $ul.append(this); });

				$ul.find('.foodsfst_medal1, .foodsfst_medal2, .foodsfst_medal3')
					.removeClass('foodsfst_medal1 foodsfst_medal2 foodsfst_medal3');

				var $newLis = $ul.children('li');
				$newLis.eq(0).find('.foodsfst_medal').addClass('foodsfst_medal1');
				$newLis.eq(1).find('.foodsfst_medal').addClass('foodsfst_medal2');
				$newLis.eq(2).find('.foodsfst_medal').addClass('foodsfst_medal3');
				
				$lis.filter(function() {
					return $(this).find('.foodsfst_txt1').text().includes('유부초밥');
				}).find('.foodsfst_txt3').text("남성이 좋아해요");

				$this.prop('checked', false);
			}

			updateSelectedCount();
		});
	});



		$(document).on("click", ".slider1-summary .demos_chk_box", function() {
			var $this = $(this);
			if ($this.hasClass('active')) {
				// 체크 해제 처리
				$this.removeClass('active');
				$this.find('.boy_face1').removeClass('active');
				$this.find('.chk_box_boxbox').hide();
				$this.find('div:last').text('');
				var idx = $this.index();
				$('.btn_foods_open').eq(idx).prop('checked', false);
				// 해제된 요소가 어떤 영역 안에 있는지 체크
				if ($this.closest('#boy1').length) {
					$('.top_txtp').text("아이가 좋아하는 TOP3");
				} else if ($this.closest('#boy2').length) {
					$('.top_txtp').text("여성이 좋아하는 TOP3");
				} else if ($this.closest('#boy3').length) {
					$('.top_txtp').text("남성이 좋아하는 TOP3");
				}
			}
	        updateSelectedCount();
		});

		// slider2 사람별 메뉴 선택
		$(document).on("click", ".slider2-summary .demos_chk_box", function() {
			var $this = $(this);
			if ($this.hasClass('active')) {
				// 체크 해제 처리
				$this.removeClass('active');
				$this.find('.boy_face1').removeClass('active');
				$this.find('.chk_box_boxbox').hide();
				$this.find('div:last').text('');
				var idx = $this.index();
				$('.btn_foods_open').eq(idx).prop('checked', false);
				// 해제된 요소가 어떤 영역 안에 있는지 체크
				if ($this.closest('#boy1').length) {
					$('.top_txtp').text("아이가 좋아하는 TOP3");
				} else if ($this.closest('#boy2').length) {
					$('.top_txtp').text("여성이 좋아하는 TOP3");
				} else if ($this.closest('#boy3').length) {
					$('.top_txtp').text("남성이 좋아하는 TOP3");
				}
			}
				updateSelectedCount();										
		});


    $(document).on('change', '#check9', function() {	
        if ($(this).is(':checked')) {
            var pickedMenu = $('.btn_foods_open:checked').first().closest('li').find('.foodsfst_txt1').clone()
                .children('span').remove().end().text().trim();
            if (pickedMenu === '') return;
            $('.demos_chk_box').addClass('active');
            $('.chk_box_boyface span').addClass('active');
            $('.chk_box_boxbox').show();
            $('.demos_chk_box').each(function () {
                $(this).find('div:last').text(pickedMenu);
            });
            $('.btn_foods_open').prop('checked', true);
        } else {
            $('.demos_chk_box').removeClass('active');
            $('.chk_box_boyface span').removeClass('active');
            $('.chk_box_boxbox').hide();
            $('.demos_chk_box').each(function () {
                $(this).find('div:last').text('');
            });
            $('.btn_foods_open').prop('checked', false);
        }
		updateSelectedCount();
    });
});


var initialLiOrder = [];

$(window).on('load', function() {
    initialLiOrder = $('#menuList').children('li').toArray();
});

$(document).on('change', '#check9', function() {
    if (!$(this).prop('checked')) {
        $('.top_txtp').text("아이가 좋아하는 TOP3!");

        var $ul = $('#menuList');
        $ul.empty();
        initialLiOrder.forEach(function(li) {
            $ul.append(li);
        });
    }
});


$(document).on("click", ".gnb-jinlogo", function () {
    window.location.href = "index_mrt7.html";
});

document.addEventListener("click", function(e) {
  if (e.target.closest(".sound-btn")) {
    play();
  }
});


/************************************************** */

/*골프 */
$(document).ready(function() {
    // 체크박스 변경 이벤트 (라벨 클릭 시 자동으로 발생)
    $('.checkbox-spd').on('change', function() {
        var $checkbox = $(this);
        var $label = $checkbox.next('.checkbox-label-spd');
        
        if ($checkbox.is(':checked')) {
            // 다른 모든 체크박스 해제
            $('.checkbox-spd').not($checkbox).each(function() {
                $(this).prop('checked', false);
                $(this).next('.checkbox-label-spd').removeClass('active');
            });
            
            // 현재 체크박스 활성화
            $label.addClass('active');
        } else {
            $label.removeClass('active');
        }
    });

    // 토글 버튼 클릭 이벤트
    $('.toggle-btn-spd').click(function(e) {
        e.stopPropagation(); // 이벤트 버블링 방지
        
        var $btn = $(this);
        var $currentItem = $btn.closest('.item-spd');
        var $currentDetail = $currentItem.find('.detail-spd');
        var $ico = $btn.find('.ico');
        
        if ($currentDetail.is(':visible')) {
            // 현재 열린 항목 닫기
            $currentDetail.slideUp(250);
            $btn.removeClass('active');
            $ico.removeClass('icoup').addClass('icodown');
        } else {
            // 다른 모든 항목 닫기
            $('.item-spd').each(function() {
                if (this !== $currentItem[0]) { // 현재 항목 제외
                    var $otherDetail = $(this).find('.detail-spd');
                    var $otherBtn = $(this).find('.toggle-btn-spd');
                    var $otherIco = $otherBtn.find('.ico');
                    
                    if ($otherDetail.is(':visible')) {
                        $otherDetail.slideUp(250);
                        $otherBtn.removeClass('active');
                        $otherIco.removeClass('icoup').addClass('icodown');
                    }
                }
            });
            
            // 현재 항목 열기
            $currentDetail.slideDown(250);
            $btn.addClass('active');
            $ico.removeClass('icodown').addClass('icoup');
        }
    });

    // 체크박스 라벨 클릭 시 이벤트 버블링 방지
    $('.checkbox-label-spd').click(function(e) {
        e.stopPropagation();
    });

    // 초기화: 모든 detail을 닫힌 상태로 설정
    $('.detail-spd').hide();
    $('.toggle-btn-spd').removeClass('active');
    $('.toggle-btn-spd .ico').removeClass('icoup').addClass('icodown');
    
    // 골프백 관련 스타일 처리
    if ($('.baggagep_golf').css('display') === 'block') {
        $('.baggagep_advimg').css('border-bottom', 'unset');
    }
		
		// 체크박스 변경 이벤트
	$('.checkbox-spd').on('change', function() {

    const $content = $(this).closest('.foodlistcontent');
    const $activeBox = $('.demos_boxs.active');

    if ($(this).is(':checked')) {

        const foodName  = $content.find('.title-spd div').first().text().trim();
        const foodPrice = $content.find('.title-spd-txt1').text().trim();

        // ★ active된 박스에만 텍스트 넣기
        $activeBox.find('.demos_boxs_tx2').text(foodName);

        // 가격도 지정된 하나에만 넣기
        $('.food-price-bottom').text(foodPrice);

        // 다른 체크박스들은 모두 해제 + 해당 박스 텍스트도 초기화
        $('.checkbox-spd').not(this).each(function() {
            $(this).prop('checked', false);
        });

    } else {

        // ★ 같은 박스 다시 클릭해 해제한 경우: active 박스만 초기화
        $activeBox.find('.demos_boxs_tx2').text('');
        $('.food-price-bottom').text('');
    }
});

	
});

$(document).ready(function() {
    // 기존 초기화 코드 이후에 추가
    $('.food-price-bottom').text('');
});

$(document).ready(function() {
	$('.tws_insure1').on('click', function() {
		$(this).css({
			'background-image': 'url(resource/img/tws_img6.png)',
			'background-repeat': 'no-repeat',
			'background-position': 'center top',
			'background-size': 'contain'
		});
	});
});