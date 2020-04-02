$(document).ready(function () {
	$(".seatWrap ul li").click(function(){
		$(this).toggleClass("selected");
	});

    /* 200402 선택불가인 경우를 고려한 선택자 수정 */
	$(".seat .passengerWrap ul li:not(.disabled)").click(function(){
		$(this).siblings().removeClass("selected");
		$(this).addClass("selected");
	});
    /* //200402 선택불가인 경우를 고려한 선택자 수정 */

	$("a.qa").hover(function(){
		$(this).next().show();
	}, function(){
		$(this).next().hide();
	});
	$(".baggage .passengerWrap > ul > li").click(function(){
		$(this).siblings().removeClass("selected");
		$(this).addClass("selected");
	});

    /* 200402 선택불가인 경우를 고려한 선택자 수정 */
	$(".meal .passengerWrap ul li:not(.disabled)").click(function(){
		$(this).toggleClass("selected");
	});
    /* //200402 선택불가인 경우를 고려한 선택자 수정 */

	$(document).on('click', '.popupBtn', function() {
		var popupIndex = $(this).attr('id');
		$(".popupContainer."+popupIndex).show();
		var popupwidth = $('.popupContainer .popupWrap').not( ":hidden" ).width();
		var popupHeight = $('.popupContainer .popupWrap').not( ":hidden" ).height();
		$('.popupContainer .popupWrap').not( ":hidden" ).css("left","calc(50% - "+(popupwidth+2)/2+"px");
		$('.popupContainer .popupWrap').not( ":hidden" ).css("top","calc(50% - "+(popupHeight+2)/2+"px");
	});

	$(document).on('click', '.agreeWrap .tabSelect li', function() {
		var tabIndex = $(this).attr('id');
		$(this).siblings().removeClass("on");
		$(this).addClass("on");
		$(".agreeWrap .tabContent li").removeClass("on");
		$(".agreeWrap .tabContent li."+tabIndex).addClass("on");
	});

    $(".anchorWrap a").click(function(event){    
        event.preventDefault();
        $('html,body').animate({scrollTop:$(this.hash).offset().top}, 500);
    });

	$(document).on('click', '.popupDimmed:not(.preventClick)', function() {/*200212 dim 클릭 시 자동으로 닫히지 않게 처리하는 특수 클래스를 위한 처리 추가*/
		$(this).parent().hide();
	});
	$(document).on('click', '.popupContainer .close', function() {
		$('.popupContainer').hide();
	});

	$(".popupContainer.buyHistory .popupContent > ul > li > p").click(function(){
		$(this).parents().toggleClass("on");
	});

	$(".selectForm > p").click(function(){
		$(this).toggleClass("on");
	});
	$(".selectForm > ul > li").click(function(){
		$(".selectForm > p").removeClass("on");
	});


    $("tr.titleWrap").click(function(event){    
		$(this).siblings().removeClass("view");
		$(this).toggleClass("view");
    });








	$(window).scroll(function() {
		if ($(document).scrollTop() > 302 ) {
			$(".priceContainer").addClass("menuFixed");
		}	else	{
			$(".priceContainer").removeClass("menuFixed");
		}
	});	

	$(window).scroll(function() {
		if ($(document).scrollTop() > 80 ) {
			$(".headerContainer.main").addClass("fixed");
		}	else	{
			$(".headerContainer.main").removeClass("fixed");
		}
	});	


	/*$(window).scroll(function() {
		var scrollHeight = $(document).height();
		var scrollPosition = $(window).height() + $(window).scrollTop();		
		if (scrollPosition > scrollHeight - 284 + 948 - $(".priceContainer").innerHeight()) {		
				$(".priceContainer").addClass("bottom");
				$(".priceContainer").css("bottom",scrollPosition - scrollHeight + 284);
			}	else	{
				$(".priceContainer").removeClass("bottom");
				$(".priceContainer").css("bottom","auto");
			}
		});	*/

});


