/*배경 DIM 생성*/
function createDim(){
    $("#ags-wrap").append("<div class='page-dim active'></div>");
    $("html, body").css("overflow", "hidden");
}

/*배경 DIM 제거*/
function deleteDim(){
    $(".page-dim.active").remove();
    $("html, body").css("overflow", "");
}

/*횡렬 아이템들 중 하나를 선택하면 선택된 아이템을 scrollLeft로 정렬*/
function activeLinkScrollLeft(el, wrap, duration){
    var thisLeft = $(el).offset().left,
        elLeft = $(wrap).scrollLeft(),
        myScrollPos = thisLeft + elLeft - 32;
    $(wrap).animate({ scrollLeft: myScrollPos }, duration)
}

/*스크롤이 특정 위치를 지나갈 때 클래스 첨삭*/
function compScroll(el, current, setPoint, className) {
    if (current > setPoint) {
        el.addClass(className);
    } else {
        el.removeClass(className)
    }
}

/* 상품가격 등의 숫자정보 표현 시 콤마 추가기능 정의 */
$.fn.digits = function(){
    return this.each(function(){
        $(this).text( $(this).text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") );
    })
};

/* 버튼을 이용한 탭간 이동 기능 정의 */
function moveTabByClick(el, target, position, duration){
    $(el).on("click", function(){
        $("html").animate({scrollTop: position}, duration, function(){
            $(target).mousedown()
        });
    })
}

/* 팝업 생성 기능 정의 */
function popupShow(target){
    createDim();
    setTimeout(function(){ target.addClass("active") }, 250);
}
/* 팝업 삭제 기능 정의  */
function popupHide(target){
    setTimeout(function(){ target.removeClass("active"); }, 250);
    setTimeout(function(){ deleteDim() }, 1000)
}

/* 메시지 팝업 기능 정의(하단에서 올라오는 팝업) */
function messagePopShow(target){
    popupShow(target);
    target.css({
        "max-height": $(window).innerHeight()
    })
}
function messagePopHide(target){
    popupHide(target)
    setTimeout(function(){ target.css("max-height", "") }, 750);
}

$(document).ready(function(){
    /* variation */
    var $win = $(window),
        $doc = $(document),
        $body = $("body");

    /* 상품가격 등의 숫자정보 표현 시 콤마 추가 */
    (function(digitsHandler){
        $(".digits").digits();
    })();

    /*.page-name에 단축 navigation 링크가 있을 경위*/
    (function(){
        $(document).on("click", "#btn_nav-shortcut", function(){
            $($(this).attr("href")).toggleClass("active")
        });
        $(document).on("click", '#nav-shortcut a', function(){
            $("#nav-shortcut").removeClass("active");
        });
    })();

    /* Tab(탭) */
    (function(tabHandler){
        $(".tab-wrap").each(function(){
            var $thisTap = $(this),
                $tabBtn = $thisTap.find("[role='tab']"),
                $tabPan = $thisTap.find("[role='tabpanel']"),
                $innerWrap = $thisTap.find(".align-horizontal");

            // 탭의 갯수에 맞추어 .tab-wrap 사이즈 조정
            if($innerWrap.length > 0){
                $innerWrap.css("width", $tabPan.length * 100 + "%");
                $tabPan.css("width", $win.innerWidth())
            }

            // 시각적으로 활성화 표기를 위한 클래스 추가
            $tabBtn.first().addClass("active").attr("tabindex", "0");
            $tabPan.first().addClass("active").attr("tabindex", "0");

            // 의미적으로 활성화 표기를 위해 true로 설정된 aria-selected 속성 추가
            $tabBtn.attr("aria-selected", "true");
            $tabBtn.on("keydown", function(event){
                event = event || window.event;
                event.preventDefault ? event.preventDefault() : event.returnValue = false;
                var keycode = event.keyCode || event.which;

                switch(keycode){
                    case 37:  // left arrow
                        if(this.previousElementSibling){
                            $(this)
                                .attr("tabindex", "-1")
                                .prev()
                                .attr("tabindex", "0")
                                .focus();
                        }else{
                            // 초점이 첫 번째 요소에 있었다면, 마지막 탭으로 초점 이동
                            $(this)
                                .attr("tabindex", "-1");
                            $tabPan.first()
                                .attr("tabindex", "0")
                                .focus();
                        }
                        break;
                    case 39:  // right arrow
                        if(this.nextElementSibling){
                            $(this)
                                .attr("tabindex", "-1")
                                .next()
                                .attr("tabindex", "0")
                                .focus();
                        }else{
                            // 초점이 마지막 요소에 있었다면, 첫 번째 탭으로 초점 이동
                            $(this)
                                .attr("tabindex", "-1");
                            $tabPan.first()
                                .attr("tabindex", "0")
                                .focus();
                        }
                        break;
                    case 32:    // Space
                    case 13:    // Enter
                        // 선택된 탭 활성화
                        $(this)
                            .addClass("active")
                            .attr("aria-selected", "true")
                            // 기존 탭 비활성화
                            .siblings()
                            .removeClass("active")
                            .attr("aria-selected", "false");
                        // 연관된 탭 패널 활성화
                        $("#" + $(this).attr("aria-controls"))
                            .attr("tabindex", "0")
                            .addClass("active")
                            // 기존 탭 패널 비활성화
                            .siblings("[role='tabpanel']")
                            .attr("tabindex", "-1")
                            .removeClass("active");
                        break;
                }
            });
            $tabBtn.on("keydown", ".active", function(event){
                event = event || window.event;
                var keycode = event.keyCode || event.which;

                // tab 키 눌렀을 때 (shift + tab은 제외)
                if(!event.shiftKey && keycode === 9){
                    event.preventDefault ? event.preventDefault() : event.returnValue = false;
                    $("#" + $(this).attr("aria-controls"))
                        .attr("tabindex", "0")
                        .addClass("active")
                        .focus()
                        .siblings("[role='tabpanel']")
                        .attr("tabindex", "-1")
                        .removeClass("active");
                }
            });
            $tabBtn.on("mousedown", function(){
                // 선택된 탭 활성화
                var $this = $(this),
                    $target = $("#" + $this.attr("aria-controls"));
                $this
                    .addClass("active")
                    .attr({
                        "tabindex": "0",
                        "aria-selected": "true"
                    })
                    .focus()
                    // 기존 탭 비활성화
                    .siblings()
                    .removeClass("active")
                    .attr({
                        "tabindex": "-1",
                        "aria-selected": "false"
                    });
                // 연관된 탭 패널 활성화
                $target
                    .attr("tabindex", "0")
                    .addClass("active")
                    // 기존 탭 패널 비활성화
                    .siblings("[role='tabpanel']")
                    .attr("tabindex", "-1")
                    .removeClass("active");

                /* 탭 컨텐츠가 화면 중앙에 오도록 이동 */
                $innerWrap.css("margin-left", "-" + $target.index() * 100 + "vw");
            });

        });
    })();

    /* 전체 선택 Checkbox */
    (function(checkAllHandler){
        $("input[data-checked='all']").each(function(){
            var $trigger = $(this),
                $family = $("input[type='checkbox'][name='" + $(this).attr("name") + "']").not($(this));
            $trigger.on("change", function(){
                if($(this).is(":checked") === true){
                    $family.prop("checked", true);
                } else {
                    $family.prop("checked", false);
                }
            });
            $family.on("change", function(){
                var checkedFamily = $("input[type='checkbox'][name='" + $(this).attr("name") + "']:checked").not($trigger);
                if($family.length === checkedFamily.length){
                    $trigger.prop("checked", true);
                } else {
                    $trigger.prop("checked", false);
                }
            });
        });
    })();

    /* 일반적인 팝업 */
    $(document).on("click", "[data-popup]", function(){
        var $pop = $($(this).attr("data-popup"));
        if($pop.attr("data-type") === 'alert'){
            popupShow($pop);
        } else if($pop.attr("data-type") === 'message'){
            messagePopShow($pop)
        } else if($pop.attr("data-type") === 'drawer'){
            if($pop.hasClass("active") === true){
                $pop.css("height", "");
                popupHide($pop)
            } else {
                popupShow($pop);
                $pop.css("height", $win.innerHeight() - $("#ags-header").height());
            }
        }
    });

    $(document).on("click", "[data-role='close']", function(){
        var $pop = $($("#" + $(this).parents(".pop-area").attr("id")));
        if($pop.attr("data-type") === 'alert'){
            popupHide($pop);
        } else if($pop.attr("data-type") === 'message'){
            messagePopHide($pop)
        }
    });

    /*gnb 팝업 정의*/
    $(document).on("click", "#btn_gnb", function(){
        $("#ags-wrap").addClass("gnb-active");
        $("#gnb-2dp").addClass("active");
        $("html, body").css("overflow", "hidden");
    });
    $(document).on("click", "#btn_gnb-close", function(){
        $("#gnb-2dp").removeClass("active");
        setTimeout(function(){$("#ags-wrap").removeClass("gnb-active");}, 1000);
        $("html, body").css("overflow", "");
    });

    /* 스크롤 이벤트의 작동을 컨트롤 합니다. */
    (function(scrollHandler){
        if($("[data-ui*='fixed']").length > 0){
            var $trg = $(".tab-panel.active [data-ui*='fixed']"),
                mainSetPoint = $trg.offset().top;
            $win.on("scroll", function(){
                var currentScrollTop = $doc.scrollTop();
                compScroll($body, currentScrollTop, mainSetPoint, "ui-fixed");
            }).scroll()
        }
    })();

    /* 앵커 태그를 이용해 타겟을 접고 펼치는 이벤트를 컨트롤합니다. */
    (function(){
        $(document).on("click", "a[data-foldable-target]", function(){
            var $trigger = $(this),
                $target = $($(this).attr("data-foldable-target"));
            if($target.hasClass("active") === true){
                $trigger.removeClass("active")
                $target.removeClass("active")
            } else {
                $trigger.addClass("active")
                $target.addClass("active")
            }
        });
    })()
});