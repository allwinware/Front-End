/* loader & header
----------------------------------------------------------------------------------------------*/
$(window).load(function() {
	$('#loader').fadeOut();
    $("#header").animate({top:'0px'},"slow");
});

$(document).ready(function(){

	// window.alert(height_body);

	// gnb
	$('.dep_01 > li > a').click(function(){
		$(this).toggleClass("open");
		$(this).siblings().toggle();
	});
	$('.dep_02 > li > a').click(function(){
		$(this).toggleClass("open");
		$(this).siblings().toggle();
	});

	// 레이어팝업, 모달BG
	var wrap_width = $(".wrap").width();
	var wrap_height = $("#gnb").height() + 181;

	var lp_width = $(".l-popup").width();
	var lp_height = $(".l-popup").height();

	$(".dim_50").css("height", wrap_height);

	$(".l-popup").css("top", 400);
	$(".l-popup").css("left", wrap_width/2-lp_width/2);

	// 레이어팝업 열기 / 닫기
	$('.lp-test').click(function(){
		$('.dim_50').fadeIn();
		$('.l-popup').fadeIn();
	});
	$('.close_lp').click(function(){
		$('.dim_50').fadeOut();
		$('.l-popup').fadeOut();
	});
	

	// bx슬라이드 플러그인
	$('.wrap_slide_list').bxSlider({
		mode: 'horizontal',
		speed: 500,
		easing: 'ease-in-out',
		touchEnabled: true,
		responsive: true,
		pager: false,
		controls: false,
		auto: true,
		pause : 1000000,
		swipeThreshold : 60,
		oneToOneTouch : false
	});

	$('.area_ad_noti').bxSlider({
		mode: 'horizontal',
		speed: 500,
		easing: 'ease-in-out',
		touchEnabled: true,
		responsive: true,
		pager: false,
		controls: false,
		auto: true,
		pause : 10000000,
		swipeThreshold : 60,
		oneToOneTouch : false
	});

	$('#').bxSlider({
		mode: 'horizontal',
		speed: 500,
		easing: 'ease-in-out',
		touchEnabled: true,
		responsive: true,
		pager: true,
		controls: true,
		auto: true
	});

	// slide dot 가운데 정렬
	var bxpager = $(".bx-pager").width() / 2;
	$(".bx-pager").css("marginLeft",-bxpager);	

	// 최상단으로 가기 가속도
	$('a[href^="#wrap"]').on('click',function (e) {
		e.preventDefault();
		var target = this.hash,
		$target = $(target);
		$('html, body').stop().animate({
			'scrollTop': $target.offset().top 
		}, 800, 'easeInOutExpo', function () {
			window.location.hash = target;
		});
	});
	// 최상단으로 가기
	$(".btn_go_top").hide();
	$(window).scroll(function(){
		
		var srolled = $(window).scrollTop();
		
		if(srolled >= 140){
			 $(".btn_go_top").stop().fadeIn();
		}
		else{
			
			$(".btn_go_top").stop().fadeOut();
		}
	});





	//gnb
	var gnb_width = $('#wrap').width();
	var gnb_height = $('#wrap').height();
	$('.wrap_gnb').css("width", gnb_width);
	//$('.wrap_gnb').css("height", gnb_height);
	$('.wrap_gnb_2dep').css("width", gnb_width);
	$('.wrap_gnb_setting').css("width", gnb_width);
	$('.wrap_gnb_search').css("width", gnb_width);
	//$('.wrap_gnb_search').css("height", gnb_height);
	$('.wrap_gnb').css("left", -gnb_width);
	$('.wrap_gnb_2dep').css("left", -gnb_width);
	$('.wrap_gnb_setting').css("left", -gnb_width);
	$('.wrap_gnb_search').css("right", -gnb_width);

	$('.btn_gnb').click(function(){
		$('.modal_bg').fadeIn();
		$(".wrap_gnb").animate({left: 0});
		//$("#header, #container, #footer").animate({left: 120});
	});	

	$('.btn_close, .modal_bg').click(function(){
		$('.modal_bg').fadeOut();
		$('.modal_bg_2dep').fadeOut();
		$(".wrap_gnb").animate({left: -gnb_width});
		//$("#header, #container, #footer").animate({left: 0});
		$(".wrap_gnb_2dep").animate({left: -gnb_width});
		$(".wrap_gnb_setting").animate({left: -gnb_width});
	});

	$('.btn_2dep').click(function(){
		$('.modal_bg_2dep').fadeIn();
		$(".wrap_gnb_2dep").animate({left: 0});
	});

	$('.btn_prev').click(function(){
		$('.modal_bg_2dep').fadeOut();
		$(".wrap_gnb_2dep").animate({left: -gnb_width});
		$(".wrap_gnb_setting").animate({left: -gnb_width});		
	});

	$('.btn_setting').click(function(){
		$('.modal_bg_2dep').fadeIn();
		$(".wrap_gnb_setting").animate({left: 0});
	});

	$('.btn_search').click(function(){
		$('.modal_bg').fadeIn();
		$(".wrap_gnb_search").animate({right: 0});
	});	
	$('.btn_prev_search').click(function(){
		$('.modal_bg').fadeOut();
		$(".wrap_gnb_search").animate({right: -gnb_width});
	});





	//로그인, 회원가입단
	
	//로그인wrap height
	var height_log_wrap = $(window).height();
	$('.bg_login_grey').css("height", height_log_wrap);

	//회원가입 바텀 버튼 fixed
	var height_flds_join = $('.flds_join').height() + 60;
	var height_join_header = $('.header_case_login').height();
	var height_join_wrap = $(window).height();
	
	if( height_flds_join + height_join_header > height_join_wrap ) {
		$('.area_btn_next').css({
			position: "relative",
			width: 100+"%"	
		});
	}
	else {
		$('.area_btn_next').css({
			position: "absolute",
			bottom: 0,
			width: 100+"%"	
		});
	}

	//약관 모두 동의
	$("#terms_chk_all").click(function(){
		$('#terms_chk_01, #terms_chk_02, #terms_chk_03').not(this).prop('checked', this.checked);
	});

	//약관보기 팝업
	$('.btn_show_terms').click(function(){
		$('.modal_bg').fadeIn(200).queue(function(){
			$('.pop_terms').fadeIn(100).dequeue();
		});
	});
	$('.btn_close_terms').click(function(){
		$('.pop_terms').fadeOut(100).queue(function(){
			$('.modal_bg').fadeOut(200).dequeue();
		});
	});


	//조건별 검색
	$('.item_case').click(function(){
		$(this).toggleClass( "on" );
	});	
	$('.item_case_all').click(function(){
		$('.item_case').removeClass( "on" );
	});


	//댓글 입력
	$('.link_write').click(function(){
		$(this).fadeOut().queue(function(){
			$(this).parents().children('.wrap_show_textarea').fadeIn();		
		});
	});
	//textarea 포커스
	$('.txta_comment').focusin(function(){
		$('.lb_comment').fadeOut();
	});
	$('.txta_comment').focusout(function(){
		var chk_some = $(this).val();
		if(chk_some == ""){
			$('.lb_comment').fadeIn();
		}
	});
	
	$('.inner_btn_cancel').click(function(){
		$(this).parents().parents().parents().parents().children('.wrap_show_textarea').fadeOut().queue(function(){
			$('.link_write').show();
		});
	});	

	//댓글, 공감 or 비공감
	$('.btn_reply_supp').click(function(){
		$('.btn_reply_supp').removeClass('on');
		$(this).addClass('on');
	});
	//댓글 dep2 width
	var width_reply2 = $('#wrap').width() - 34;
	$(".reply_info_dep2").css("width",width_reply2);

	//답글(dep2) 열기
	$('.wrap_reply_reply').hide();
	$('.btn_reply_reply').click(function(){
		$(this).parents().parents().children('.wrap_reply_reply').fadeToggle();
	});



	//탭메뉴 플러그인
	$("#tabs").tabs();

	// 탭 슬라이드
	var options = {
		horizontal: 1,
		itemNav: 'basic',
		speed: 300,
		mouseDragging: 1,
		touchDragging: 1
	};
	var frame = new Sly('#frame_best', options).init();

	var options = {
		horizontal: 1,
		itemNav: 'basic',
		speed: 300,
		mouseDragging: 1,
		touchDragging: 1
	};
	var frame = new Sly('#frame_cate', options).init();
});