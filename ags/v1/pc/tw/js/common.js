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

    (function(popupHandler){

        /*스크롤바 너비를 구합니다.*/
        function getScrollBarWidth() {
            var inner = document.createElement('p');
            inner.style.width = "100%";
            inner.style.height = "200px";

            var outer = document.createElement('div');
            outer.style.position = "absolute";
            outer.style.top = "0px";
            outer.style.left = "0px";
            outer.style.visibility = "hidden";
            outer.style.width = "200px";
            outer.style.height = "150px";
            outer.style.overflow = "hidden";
            outer.appendChild (inner);

            document.body.appendChild (outer);
            var w1 = inner.offsetWidth;
            outer.style.overflow = 'scroll';
            var w2 = inner.offsetWidth;
            if (w1 === w2) w2 = outer.clientWidth;

            document.body.removeChild (outer);

            return (w1 - w2);
        };

        /*윈도우 사이즈에 따라 팝업을 포지셔닝합니다.*/
        function calcPopupPosition(target){
            if(target.length > 0){
                var popupHeight = target.height(),
                    popupWidth = target.width();
                popupIndex = target.attr('id');
                if(popupHeight > $(window).height()){
                    target.css("top","0");
                    target.siblings(".popupDimmed").css({
                        "right" : getScrollBarWidth()
                    });
                } else {
                    target.css("top","calc(50% - "+(popupHeight+2)/2+"px");
                    target.siblings(".popupDimmed").css({
                        "right" : 0
                    });
                }
                if(popupWidth > $(window).width()){
                    target.css("left","0");
                    target.siblings(".popupDimmed").css({
                        "bottom" : getScrollBarWidth()
                    });
                } else {
                    target.css("left","calc(50% - "+(popupWidth+2)/2+"px");
                    target.siblings(".popupDimmed").css({
                        "bottom" : 0
                    });

                }
            }
        }

        /*팝업 동작 정의*/
        $(document).on('click', '.popupBtn', function() {
            var popupIndex = $(this).attr('id');
            $(".popupContainer."+popupIndex).show();
            var $popup = $('.popupContainer .popupWrap').not( ":hidden" );
            var popupwidth = $popup.width();
            $("html,body").css("overflow", "hidden");
            calcPopupPosition($popup)
        });

        /*팝업 포지셔닝 변경을 위해 리사이즈 이벤트 설정*/
        $(window).on("resize", function(){
            calcPopupPosition($('.popupContainer .popupWrap').not(":hidden"))
        }).resize();
    })();

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
        $("html,body").css("overflow", "auto");
	});
	$(document).on('click', '.popupContainer .close', function() {
	    /*200529 닫기 버튼이 disabled 상태일 때의 작동을 제외하기 위한 if문 추가*/
	    if($(this).attr("disabled") !== "disabled"){
            $('.popupContainer').hide();
            $("html,body").css("overflow", "auto");
        }
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


