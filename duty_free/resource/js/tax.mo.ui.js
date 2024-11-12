/*gnb 팝업 정의*/
$(document).on("click", "#btn_gnb", function () {
    $("#gnb-2dp").addClass("active").trigger("menu.onshow");
    $("html, body").css("overflow", "hidden");
});

$(document).on("click", "#btn_gnb-close", function () {
    $("#gnb-2dp").removeClass("active");
    $("html, body").css("overflow", "");
});


/* 기내면세 이용안내*/

$(document).ready(function() {
    // duty_use div 안의 링크 요소를 선택
    const links = $(".duty_use a");
    $(".m_message1").css("display", "block");
    $(".m_message2").css("display", "none");
    $(".m_message3").css("display", "none");
    $(".m_message4").css("display", "none");
    // 각 링크에 클릭 이벤트 핸들러 추가
    links.on("click", function(event) {
        event.preventDefault(); // 기본 링크 동작 방지

        // 모든 버튼의 active 클래스 제거
        removeActiveClass();

        // 클릭한 링크에 active 클래스 추가
        $(this).addClass("active");

        // 메시지 업데이트
        const index = $(".duty_use a").index(this);
        displayMessage('.m_message' + (index + 1));
    });

    function removeActiveClass() {
        // 모든 링크에서 active 클래스 제거
        links.removeClass("active");
    }

    function displayMessage(messageClass) {
        // 모든 메시지 숨김
        $(".message").css("display", "none");

        // 특정 메시지를 보이도록 설정
        $(messageClass).css("display", "block");
    }

    $(".ticket_share_name").click(function(){
        // 현재 클릭된 버튼에만 'active' 클래스 추가
        $(this).addClass("active");

        // 다른 버튼에서 'active' 클래스 제거
        $(".ticket_share_name").not(this).removeClass("active");
    });
});
//예약내역 확인
$(document).ready(function () {
    const links = $(".reserv_check a");
    $(".reserv_check_msg1").css("display", "none");
    $(".reserv_check_msg2").css("display", "block");
    // 각 링크에 클릭 이벤트 핸들러 추가
    links.on("click", function (event) {
        event.preventDefault(); // 기본 링크 동작 방지

        // 모든 버튼의 active 클래스 제거
        removeActiveClass();

        // 클릭한 링크에 active 클래스 추가
        $(this).addClass("active");

        // 메시지 업데이트
        const index = $(".reserv_check a").index(this);
        displayMessage('.reserv_check_msg' + (
            index + 1
        ));
    });

    function removeActiveClass() {
        // 모든 링크에서 active 클래스 제거
        links.removeClass("active");
    }

    function displayMessage(messageClass) {
        // 모든 메시지 숨김
        $(".reserv_check_msg1").css("display", "none");
        $(".reserv_check_msg2").css("display", "none");
        // 특정 메시지를 보이도록 설정
        $(messageClass).css("display", "block");
    }

    /*예약내역*/
    $(".credit_box_btn").click(function () {
        var _self	= this;
    //alert(		$(_self).attr("agrBtn")	);
        $("div [agrLt]").each(function(idx, obj) {
            if( _self == $("div [agrBtn]").get(idx) && $(obj).hasClass("on") == false) {
                $('.credit_box_btn').eq(idx).removeClass('on');
                $(obj).addClass("on").slideDown(300);	                
                $('.reserv_border_box').eq(idx).addClass('active');
            } else {
                $('.credit_box_btn').eq(idx).addClass('on');			
                $(obj).removeClass("on").slideUp(300);		
                $('.reserv_border_box').eq(idx).removeClass('active');

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

        /* 전체 선택 Checkbox */
    (function (checkAllHandler) {
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
    })();


});

/*알림팝업 2초후 사라지기*/
$(document).ready(function() {
    $('.pay_ment_btn0').click(function() {
        $('.black_popup').show(); 
        setTimeout(function() {
            $('.black_popup').fadeOut(); 
        }, 2000);
    });
});

/*첫번째 팝업 바로띄우기*/
$(document).on("click", ".footer-first_close, .close_btn_1", function () {
    $(".footer-first-pop").removeClass("active");
    /* $(".dimmed_bg").css("display", "none"); 
    $("body").css("overflow", "");
    $("html").css("overflow", "");*/
});

$(document).on("click", ".footer-agree_close, .close_btn", function () {
    $(".footer-agree-pop").removeClass("active");
    $(".dimmed_bg").css("display", "none");
    $("body").css("overflow", "");
    $("html").css("overflow", "");
});


/*예약자 간편확인 팝업*/

$(document).on("click", ".footer-reserv_open", function () {
    $(".footer-reserv-pop").addClass("active");				
    $(".dimmed_bg, .dimmed_bgs").css("display", "block");
    $("body").css("overflow", "hidden");
    $("html").css("overflow", "hidden");
    
});
$(document).on("click", ".footer-reserv_close,.close_btn", function () {
    $(".footer-reserv-pop").removeClass("active");
    $(".dimmed_bg, .dimmed_bgs").css("display", "none");
    $("body").css("overflow", "");
    $("html").css("overflow", "");
}); 

/*예약내역취소*/

$(document).on("click", ".reserv_cancel_open", function () {
    $(".reserv_cancel-pop").addClass("active");				
    $(".dimmed_bg, .dimmed_bgs").css("display", "block");
    $("body").css("overflow", "hidden");
    $("html").css("overflow", "hidden");
    
});
$(document).on("click", ".reserv_cancel_close, .close_pop1 ", function () {
    $(".reserv_cancel-pop").removeClass("active");
    $(".dimmed_bg, .dimmed_bgs").css("display", "none");
    $("body").css("overflow", "");
    $("html").css("overflow", "");
}); 

/*취소후 팝업*/
$(document).on("click", ".reserv_cancel_open2, .open_pop1", function () {
    $(".reserv_cancel-pop2").addClass("active");				
    $(".dimmed_bg, .dimmed_bgs").css("display", "block");
    $("body").css("overflow", "hidden");
    $("html").css("overflow", "hidden");
    
});
$(document).on("click", ".reserv_cancel_close2, .close_pop2", function () {
    $(".reserv_cancel-pop2").removeClass("active");
    $(".dimmed_bg, .dimmed_bgs").css("display", "none");
    $("body").css("overflow", "");
    $("html").css("overflow", "");
}); 


/*검색창 팝업*/

$(document).on("click", ".search_pop_open", function () {
    $(".search_pop").addClass("active");				
    $(".dimmed_bg, .dimmed_bgs").css("display", "block");
    $("body").css("overflow", "hidden");
    $("html").css("overflow", "hidden");
    
});
$(document).on("click", ".search_pop_close", function () {
    $(".search_pop").removeClass("active");
    $(".dimmed_bg, .dimmed_bgs").css("display", "none");
    $("body").css("overflow", "");
    $("html").css("overflow", "");
});

/*상품상세보기 팝업*/

$(document).on("click", ".goods_detail_btn", function () {
    $(".goods_detail_pop").addClass("active");				
    $(".dimmed_bg, .dimmed_bgs").css("display", "block");
    $("body").css("overflow", "hidden");
    $("html").css("overflow", "hidden");
    
});
$(document).on("click", ".goods_detail_pop_close,.goods_detail_pop_close2", function () {
    $(".goods_detail_pop").removeClass("active");
    $(".dimmed_bg, .dimmed_bgs").css("display", "none");
    $("body").css("overflow", "");
    $("html").css("overflow", "");
});

/*카트 팝업*/

$(document).on("click", ".cart_popup_open", function () {
    $(".cart_popup").addClass("active");				
    $(".dimmed_bg, .dimmed_bgs").css("display", "block");
    $("body").css("overflow", "hidden");
    $("html").css("overflow", "hidden");
    
});
$(document).on("click", ".cart_popup_close", function () {
    $(".cart_popup").removeClass("active");
    $(".dimmed_bg, .dimmed_bgs").css("display", "none");
    $("body").css("overflow", "");
    $("html").css("overflow", "");
});


/*숫자 버튼 증가감소*/
$(document).ready(function() {
    function updateActiveClass($counter) {
        var currentNumber = parseInt($counter.find('.number_box').text(), 10);
        if (currentNumber === 0) {
            $counter.find('.decrease_btn').addClass('active');
        } else {
            $counter.find('.decrease_btn').removeClass('active');
        }
        if (currentNumber === 10) {
            $counter.find('.increase_btn').addClass('active');
        } else {
            $counter.find('.increase_btn').removeClass('active');
        }
    }

    $('.number_btn_check').each(function() {
        var $counter = $(this);
        updateActiveClass($counter);

        $counter.find('.decrease_btn').click(function() {
            var currentNumber = parseInt($counter.find('.number_box').text(), 10);
            if (currentNumber > 0) {
                currentNumber--;
                $counter.find('.number_box').text(currentNumber);
                updateActiveClass($counter);
            }
        });

        $counter.find('.increase_btn').click(function() {
            var currentNumber = parseInt($counter.find('.number_box').text(), 10);
            if (currentNumber < 10) {
                currentNumber++;
                $counter.find('.number_box').text(currentNumber);
                updateActiveClass($counter);
            }
        });
    });
});

//팝업

$(document).ready(function () {
    $("#openpopup_btn1").click(function () {
        $(".popup_box1").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });
  
    $("#openpopup_btn2").click(function () {
        $(".popup_box2").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });
    $("#openpopup_btn3").click(function () {
        $(".popup_box3").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });
    $("#openpopup_agree1").click(function () {
        $(".popup_agree1").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });  
    $("#openpopup_agree2").click(function () {
        $(".popup_agree2").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });
    $("#openpopup_agree3").click(function () {
        $(".popup_agree3").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });
    $("#openpopup_agree4").click(function () {
        $(".popup_agree4").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });


  
    //닫기
    $(".popup_close_btn").click(function () {
        $(".popups").fadeOut();
        $("body").css("overflow", "");
        $("html").css("overflow", "");
    });

    //닫기
    $(".popup_clobtn").click(function () {
        $(".popups").fadeOut();
        $("body").css("overflow", "");
        $("html").css("overflow", "");
    });
  });
  

/*메인메뉴 스크롤 */
$(document).on("click", ".menu_subbtn", function () {
    console.log("menu_subbtn");
    $(".menu_subbtn").removeClass("active");
    $(this).addClass("active");
    
    let index = Number($(".sub-menu").index($(this).closest("div")));
    
    let index2 = Number($(this).closest("ul").find(".menu_subbtn").index(this));
    
    let nav_height = $("#header").outerHeight();
    
    let offset = $(".content_view").eq(index).find("ul").eq(index2).offset();
    
    if(offset){
      $('html, body').animate({
        scrollTop: offset.top - nav_height
      }, 500);
    }  
});



$(document).on("click", ".menu_btn", function () {
    if($(window).width() <= 800) {
        $(".menu_btn").removeClass("active");
        $(this).addClass("active");
        
        let index = Number($(".menu_btn").index(this))+1;
        $(".sub-menu").hide();
        $("#subMenu" + index).show();
        $("#subMenu" + index + " .menu_subbtn").eq(0).addClass("active");
        
        $(".content_view").hide();
        $('html').scrollTop('0');
        $(".content_view").eq(index-1).show();
        
        $("#subMenu" + index + " .menu_subbtn").eq(0).trigger("click");
        
    }
    else{
        $(".menu_btn").removeClass("active");
        $(this).addClass("active");
        
        let index = Number($(".menu_btn").index(this))+1;
        $(".pcsub-menu").hide();
        $("#pcsubMenu" + index).show();
        $("#pcsubMenu" + index + " .menu_subbtn").eq(0).addClass("active");
        
        $(".content_view").hide();
        $('html').scrollTop('0');
        $(".content_view").eq(index-1).show();
        
        $("#pcsubMenu" + index + " .menu_subbtn").eq(0).trigger("click");
    }
});




 // 제이쿼리를 사용하여 스무스한 스크롤 및 버튼 활성화 구현
 
 $(document).ready(function() {
    // 버튼 클릭 시 해당 섹션으로 스크롤
    $(".goods_cart_btn").click(function() {
      $(".goods_cart_btn").removeClass("active");
      $(this).addClass("active");
      
      var target = "#" + $(this).data("target"); // 클릭한 버튼의 data-target 속성에서 대상 ID 가져오기
      var offset = $(target).offset().top - 120; // 스크롤할 위치에서 120px 위로 조정
  
      $("html, body").animate({
        scrollTop: offset
      }, 800); // 스크롤 애니메이션 800ms
    });
  
    // 스크롤 이벤트 처리
    $(window).scroll(function() {
      var scrollPos = $(document).scrollTop(); // 현재 스크롤 위치
  
      $(".goods_cart_detail").each(function() {
        var boxOffset = $(this).offset().top - 120; // 각 섹션의 위치에서 120px 위로 조정
        var boxId = $(this).attr("id");
  
        // 스크롤 위치가 현재 섹션의 위치에 도달하면 버튼 상태 업데이트
        if (scrollPos >= boxOffset) {
          $(".goods_cart_btn").removeClass("active");
          $(".goods_cart_btn[data-target='" + boxId + "']").addClass("active");
        }
      });
    });
  });
