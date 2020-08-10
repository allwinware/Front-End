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
            xhr.onreadystatechange = function() {
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
    setTimeout(function() {
        callback();
    }, 0);
}

/*배경 DIM 생성*/
function createDim(target){
    /*if(target.attr("data-type") === "drawer" || target.attr("data-type") === "message"){*/
    if(target.attr("data-type") === "drawer"){
        $("#ags-wrap").append("<div class='page-dim " + target.attr("id") + " active'></div>");
    } else {
        target.prepend("<div class='page-dim " + target.attr("id") + " active'></div>");
    }
    $("html, body").css("overflow", "hidden");
}

/*배경 DIM 제거*/
function deleteDim(target){
    $(".page-dim." + target.attr("id") + ".active").remove();
    $("html, body").css("overflow", "");
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

/* 팝업 생성 기능 정의 */
function popupShow(target){
    createDim(target);
    setTimeout(function(){ target.addClass("active") }, 250);
}
/* 팝업 삭제 기능 정의  */
function popupHide(target){
    setTimeout(function(){ target.removeClass("active"); }, 250);
    setTimeout(function(){ deleteDim(target) }, 1000)
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

/* 엘리먼트가 특정 위치에서 Sticky되거나 unSticky되는 기능 정의 */
function sticky(target, start, end){
    var $target = target;
    if($win.scrollTop() >= start){
        $target.addClass("ui-fixed");
        if ($win.scrollTop() >= end){
            $target.removeClass("ui-fixed").addClass("ui-fixed---bottom");
        } else if ($win.scrollTop() < end) {
            $target.removeClass("ui-fixed---bottom").addClass("ui-fixed");
        } else if (end === null) {
            /* null = do nothing */
            $target.removeClass("ui-fixed---bottom").addClass("ui-fixed");
        }
    } else {
        $target.removeClass("ui-fixed");
    }
}

$(window).on("load", function(){
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
        var $nav = $("#nav-shortcut"),
            $navItem = $nav.find("a");
        $doc.on("click", "#btn_nav-shortcut", function(e){
            $($(this).attr("href")).toggleClass("active");
            e.stopPropagation();
        });
        $doc.on("click", "body", function(){
            if($nav.length > 0){
                $nav.removeClass("active");
            }
        });
        $doc.on("click", $navItem, function(){
            $nav.removeClass("active");
        });
    })();

    /* Tab(탭) */
    (function(tabHandler){
        $("[data-type='tab-group']").each(function(){
            var $thisTap = $(this),
                $tabBtn = $thisTap.find("[role='tab']"),
                $tabPan = $thisTap.find("[role='tabpanel']");

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
            $tabBtn.on("mousedown", function(e){
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
    $doc.on("click", "[data-popup]", function(){
        var $pop = $($(this).attr("data-popup"));
        if($pop.attr("data-type") === 'alert'){
            popupShow($pop);
        } else if($pop.attr("data-type") === 'message'){
            /*messagePopShow($pop)*/
            popupShow($pop);
        } else if($pop.attr("data-type") === 'submission'){
            /*messagePopShow($pop)*/
            popupShow($pop);
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

    $doc.on("click", "[data-role='close']", function(){
        var $pop = $($("#" + $(this).parents(".pop-area").attr("id")));
        if($pop.attr("data-type") === 'alert' || $pop.attr("data-type") === 'message' || $pop.attr("data-type") === 'submission'){
            popupHide($pop);
        }/* else if($pop.attr("data-type") === 'message'){
            messagePopHide($pop)
        }*/
    });

    /*gnb 팝업 정의*/
    $doc.on("click", "#btn_gnb", function(){
        $("#ags-wrap").addClass("gnb-active");
        $("#gnb-2dp").addClass("active");
        $("html, body").css("overflow", "hidden");
    });
    $doc.on("click", "#btn_gnb-close", function(){
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
        $doc.on("click", "a[data-foldable-target]", function(){
            var $trigger = $(this),
                $target = $($(this).attr("data-foldable-target"));
            if($target.hasClass("active") === true){
                $trigger.removeClass("active");
                $target.removeClass("active")
            } else {
                $trigger.addClass("active");
                $target.addClass("active")
            }
        });
    })();

    /*보드(게시판)형 테이블의 링크 처리*/
    (function(){
        var $grid = $("table[data-grid-type='board']");
        if($grid.length > 0){
            $($grid.find("a")).each(function(){
                var $item = $(this);
                $item.closest("tr:not(.accordion-content)").addClass("tr-anchor")
                    .attr("onClick", "location.href='" + $item.attr("href") + "'")
            })
        }
    })();
    /*아코디언 스타일 테이블 처리*/
    (function(){
        var $accordionWrap = $("[data-accordion='true']");
        if($accordionWrap.attr("data-grid-type") === "board"){
            $(".tr-anchor").on("click", function(e){
                $(this).toggleClass("active").siblings("tr:not(.accordion-content)").removeClass("active");
                e.preventDefault()
            })
        } else {
            $($accordionWrap.find("a")).on("click", function(e){
                $(this).closest("tr").toggleClass("active").siblings("tr:not(.accordion-content)").removeClass("active");
                e.preventDefault()
            });
        }
    })();

    /* selectric */
    (function(){
        if($(".selectric-select-wrap").length > 0){
            $(".selectric-select-wrap select").each(function(){
                $(this).selectric()
            })
        }
    })();

    /* 스크롤 바를 미관상 보기 좋게 바꿔줍니다. */
    (function(){
        $("[data-scrollbar='true']").mCustomScrollbar({
            setWidth:false,
            setHeight:false,
            setTop:0,
            setLeft:0,
            axis:"y",
            scrollbarPosition:"inside",
            scrollInertia:200,
            autoDraggerLength:true,
            autoHideScrollbar:true,
            autoExpandScrollbar:false,
            alwaysShowScrollbar:false,
            snapAmount:null,
            snapOffset:0,
            mouseWheel:{
                enable:true,
                scrollAmount:"auto",
                axis:"y",
                preventDefault:false,
                deltaFactor:"auto",
                normalizeDelta:false,
                invert:false,
                disableOver:["select","option","keygen","datalist","textarea"]
            },
            scrollButtons:{
                enable:false,
                scrollType:"stepless",
                scrollAmount:"auto"
            },
            keyboard:{
                enable:true,
                scrollType:"stepless",
                scrollAmount:"auto"
            },
            contentTouchScroll:25,
            advanced:{
                autoExpandHorizontalScroll:false,
                autoScrollOnFocus:"input,textarea,select,button,datalist,keygen,a[tabindex],area,object,[contenteditable='true']",
                updateOnContentResize:true,
                updateOnImageLoad:true,
                updateOnSelectorChange:false,
                releaseDraggableSelectors:false
            },
            theme:"light",
            callbacks:{
                onInit:false,
                onScrollStart:false,
                onScroll:false,
                onTotalScroll:false,
                onTotalScrollBack:false,
                whileScrolling:false,
                onTotalScrollOffset:0,
                onTotalScrollBackOffset:0,
                alwaysTriggerOffsets:true,
                onOverflowY:false,
                onOverflowX:false,
                onOverflowYNone:false,
                onOverflowXNone:false
            },
            live:false,
            liveSelector:null
        });
    })();

    $(window).on("resize", function(){
        /* 컨텐츠의 길이가 윈도우 세로 높이보다 짧을 때, 윈도우의 높이만큼 컨텐츠의 기본 높이를 잡아줍니다(내용이 짧을 때에도 Footer를 하단에 고정시키기 위한 스크립트) */
        (function(){
            var $win = $(window),
                $winHgt = $win.height(),
                $body = $("body");
            if($body.height() < $winHgt){
                $body.addClass("fit-layout").css("min-height", $winHgt);
            }
        })();
    }).resize();
});