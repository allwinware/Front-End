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

/*탭 기능 정의*/
function tabHandler(target) {
    var $tab = $(target.find(".tab-wrap"));
    if ($tab.length > 0) {
        $tab.each(function () {
            var $thisTap = $(this),
                $tabBtn = $thisTap.children(".tabs").children("[role='tablist']").children("[role='tab']"),
                $innerWrap = $thisTap.children(".tab-panels").children(".align-horizontal"),
                $tabPan = $innerWrap.children("[role='tabpanel']");

            if ($thisTap.find(".align-horizontal").length > 0) {
                $innerWrap.css("width", $tabPan.length * 100 + "%");
                $tabPan.css("width", $(window).innerWidth());
                $thisTap.children(".tabs").children("[role='tablist']").children("[role='tab'].active").mousedown();
            }

            // 의미적으로 활성화 표기를 위해 true로 설정된 aria-selected 속성 추가
            $tabBtn.attr("aria-selected", "true");
            $tabBtn.on("keydown", function (event) {
                event = event || window.event;
                event.preventDefault ? event.preventDefault() : event.returnValue = false;
                var keycode = event.keyCode || event.which;

                switch (keycode) {
                    case 37:  // left arrow
                        if (this.previousElementSibling) {
                            $(this)
                                .attr("tabindex", "-1")
                                .prev()
                                .attr("tabindex", "0")
                                .focus();
                        } else {
                            // 초점이 첫 번째 요소에 있었다면, 마지막 탭으로 초점 이동
                            $(this)
                                .attr("tabindex", "-1");
                            $tabPan.first()
                                .attr("tabindex", "0")
                                .focus();
                        }
                        break;
                    case 39:  // right arrow
                        if (this.nextElementSibling) {
                            $(this)
                                .attr("tabindex", "-1")
                                .next()
                                .attr("tabindex", "0")
                                .focus();
                        } else {
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
            $tabBtn.on("keydown", ".active", function (event) {
                event = event || window.event;
                var keycode = event.keyCode || event.which;

                // tab 키 눌렀을 때 (shift + tab은 제외)
                if (!event.shiftKey && keycode === 9) {
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
            $tabBtn.on("mousedown", function (event) {
                event.preventDefault ? event.preventDefault() : event.returnValue = false;

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
    }
}

/*배경 DIM 생성*/
function createDim(target) {
    if (target.attr("data-type") === "drawer" || target.attr("data-type") === "message") {
        $("#ags-wrap").append("<div class='page-dim " + target.attr("id") + " active'></div>");
    } else {
        target.prepend("<div class='page-dim " + target.attr("id") + " active'></div>");
    }
    $("html, body").css("overflow", "hidden");
}

/*배경 DIM 제거*/
function deleteDim(target) {
    $(".page-dim." + target.attr("id") + ".active").remove();
    $("html, body").css("overflow", "");
}

/*횡렬 아이템들 중 하나를 선택하면 선택된 아이템을 scrollLeft로 정렬*/
function activeLinkScrollLeft(el, wrap, duration) {
    var thisLeft = $(el).offset().left,
        elLeft = $(wrap).scrollLeft(),
        myScrollPos = thisLeft + elLeft - 32;
    $(wrap).stop().animate({ scrollLeft: myScrollPos }, duration)
}

/*스크롤이 특정 위치를 지나갈 때 클래스 첨삭*/
function compScroll(el, current, setPoint, className) {
    // console.log(current);
	$("div[class='seat-plan']").each(function(idx, obj) {
		if($(obj).offset().left > -30 && $(obj).offset().left < 30) {
			if (current > setPoint && current < $(obj).height()) {
				el.addClass(className);
			} else {
				el.removeClass(className);
			}
		}
	});
    $("div[class='seat-plan B777-200']").each(function(idx, obj) {
		if($(obj).offset().left > -30 && $(obj).offset().left < 30) {
			if (current > setPoint && current < $(obj).height()) {
				el.addClass(className);
			} else {
				el.removeClass(className);
			}
		}
	});
    $("div[class='seat-plan seat-all']").each(function(idx, obj) {
		if($(obj).offset().left > -30 && $(obj).offset().left < 30) {
			if (current > setPoint && current < $(obj).height()) {
				el.addClass(className);
			} else {
				el.removeClass(className);
			}
		}
	});

    $("div[class='seat-plan seat-all B777-200']").each(function(idx, obj) {
		if($(obj).offset().left > -30 && $(obj).offset().left < 30) {
			if (current > setPoint && current < $(obj).height()) {
				el.addClass(className);
			} else {
				el.removeClass(className);
			}
		}
	});
/*
    if (current > setPoint && current < $("div[class='seat-plan']").eq(itry).height()) {
        el.addClass(className);
    } else {
        el.removeClass(className);
    }
*/
}

// 클래스 삭제
function dellClass(target, className) {
    target.addClass(className);
}

/* 상품가격 등의 숫자정보 표현 시 콤마 추가기능 정의 */
$.fn.digits = function () {
    return this.each(function () {
        $(this).text($(this).text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
    })
};
function digitsActive(target) {
    if (target.find(".digits").length > 0) {
        $(".digits").digits();
    }
}

/* 버튼을 이용한 탭간 이동 기능 정의 */
function moveTabByClick(el, target, position, duration) {
    $(el).on("click", function () {
        $("html").animate({ scrollTop: position }, duration, function () {
            $(target).mousedown()
        });
    })
}

/* 팝업 생성 기능 정의 */
function popupShow(target) {
    createDim(target);
    setTimeout(function () { target.addClass("active"); }, 250);
}
/* 팝업 삭제 기능 정의  */
function popupHide(target) {
    setTimeout(function () { target.removeClass("active"); deleteDim(target) }, 250);
}

/* 팝업 생성 기능 정의 */
function popupShow_noDim(target) {
    setTimeout(function () { target.addClass("active"); }, 250);
}

/* 팝업 삭제 기능 정의  */
function popupHide_noDim(target) {
    setTimeout(function () { target.removeClass("active"); }, 250);
}

/* 메시지 팝업 기능 정의(하단에서 올라오는 팝업) */
function messagePopShow(target) {
    popupShow(target);
    $(window).on("resize", function () {
        target.css({
            "max-height": $(window).innerHeight() - $("#ags-header").height()
        });
    }).resize();
}
function messagePopHide(target) {
    popupHide(target);
    setTimeout(function () { target.css("max-height", "") }, 750);
}
function drawerPopShow(target) {
    createDim(target);
    setTimeout(function () { target.addClass("active") }, 250);
    $(window).on("resize", function () {
        target.css("height", $(window).innerHeight() - $("#ags-header").height());
        $(target.find(".inner-wrap")).scrollTop(0);
    }).resize();
}
function drawerPopHide(target) {
    target.css("bottom", "-100vh");
    setTimeout(function () {
        target.css("height", "");
        target.css("bottom", "");
        popupHide(target);
    }, 1000)
}

function popActivate(target) {
    var $pop = $(target);
    if ($pop.attr("data-type") === 'alert') {
        if ($pop.attr("data-dim") === undefined && $pop.attr("data-dim-clear") === undefined) {
            popupShow($pop);
        } else if ($pop.attr("data-dim") === 'false' && $pop.attr("data-dim-clear") === undefined) {
            popupShow_noDim($pop);
            if ($win.height() > $pop.height()) {
                $pop.css({
                    "top": $doc.scrollTop() + ($win.innerHeight() / 2) - ($pop.outerHeight() / 2)
                })
            } else {
                $pop.css("top", $doc.scrollTop())
            }
            $(document).on("click", function (e) {
                if ($pop.hasClass("active") && !$pop.has(e.target).length) {
                    popupHide($pop);
                }
            });
        } else if ($pop.attr("data-dim") === undefined && $pop.attr("data-dim-clear") === 'true') {
            popupShow_noDim($pop);
        }
    } else if ($pop.attr("data-type") === 'message') {
        messagePopShow($pop);
    } else if ($pop.attr("data-type") === 'submission') {
        popupShow($pop);
    } else if ($pop.attr("data-type") === 'drawer') {
        if ($pop.hasClass("active") === true) {
            drawerPopHide($pop);
        } else {
            drawerPopShow($pop);
        }
    }

    /* 선택된 팝업이 표시될 때 컨텐츠에 .digits 엘리먼트가 있는지 확인하고, 있으면 digits 기능을 수행합니다. */
    if ($pop.is(":visible") === true) {
        tabHandler($pop);
        digitsActive($pop);
    }
}

function popupInactivate(target) {
    var $pop = $(target);
    if ($pop.attr("data-type") === 'alert' || $pop.attr("data-type") === 'submission') {
        popupHide($pop);
    } else if ($pop.attr("data-type") === 'message') {
        messagePopHide($pop)
    } else if ($pop.attr("data-type") === 'drawer') {
        drawerPopHide($pop);
    }
}

$(window).on("load", function () {

    /* variation */
    var $win = $(window),
        $doc = $(document),
        $body = $("body");

    /* 상품가격 등의 숫자정보 표현 시 콤마 추가 */
    (function (digitsHandler) {
        digitsActive($body);
    })();

    /*.page-name에 단축 navigation 링크가 있을 경위*/
    (function () {
        var $nav = $("#nav-shortcut"),
            $navItem = $nav.find("a");
        $(document).on("click", "#btn_nav-shortcut", function (e) {
            $($(this).attr("href")).toggleClass("active");
            e.stopPropagation();
        });
        $(document).on("click", "body", function () {
            if ($nav.length > 0) {
                $nav.removeClass("active");
            }
        });
        $(document).on("click", $navItem, function () {
            $nav.removeClass("active");
        });
    })();

    /* Tab(탭) */
    (function () {
        tabHandler($body)
    })();

    /* 전체 선택 Checkbox */
    (function (checkAllHandler) {
        $("input[data-checked='all']").each(function () {
            var $trigger = $(this),
                $family = $("input[type='checkbox'][name='" + $(this).attr("name") + "']").not($(this));
            $trigger.on("change", function () {
                if ($(this).is(":checked") === true) {
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

    /* 일반적인 팝업의 Active & Inactive */
    $(document).on("click", "[data-popup^='#']", function (e) {
        e.preventDefault();
        var $pop = $($(e.target).attr("data-popup"));
        popActivate($pop)
    });
    $(document).on("click", "[data-role='close']", function (e) {
        e.preventDefault();
        var $pop = $(e.target).parents("[data-type]");
        popupInactivate($pop)
    });

    /*gnb 팝업 정의*/
    $(document).on("click", "#btn_gnb", function () {
        $("#ags-wrap").addClass("gnb-active");
        $("#gnb-2dp").addClass("active");
        $("html, body").css("overflow", "hidden");
    });
    $(document).on("click", "#btn_gnb-close", function () {
        $("#gnb-2dp").removeClass("active");
        setTimeout(function () { $("#ags-wrap").removeClass("gnb-active"); }, 1000);
        $("html, body").css("overflow", "");
    });

    /* 스크롤 이벤트의 작동을 컨트롤 합니다. */
    function uiFixed(target) {
        var $item = $(target).find("[data-ui*='fixed']"),
            mainSetPoint = $item.offset().top;
        $win.on("scroll", function () {
            var currentScrollTop = $doc.scrollTop();
            compScroll($body, currentScrollTop, mainSetPoint, "ui-fixed");
        }).scroll()
    }

    (function (scrollHandler) {
        if ($("[data-ui*='fixed']").length > 0) {
            uiFixed("body")
        }
    })();


    /* 앵커 태그를 이용해 타겟을 접고 펼치는 이벤트를 컨트롤합니다. */
    (function (anchorFoldable) {
        $(document).on("click", "a[data-foldable-target]", function () {
            var $trigger = $(this),
                $target = $($(this).attr("data-foldable-target"));
            if ($target.hasClass("active") === true) {
                $trigger.removeClass("active");
                $target.removeClass("active");
            } else {
                $trigger.addClass("active");
                $target.addClass("active");
            }
        });
    })();

    /*페이지 로드 시 가는 편 탭 열기*/
    (function (routeTabHandler) {
        var $routeTap = $(".tabs_route");
        if ($routeTap.length > 0) {
            $routeTap.find("[role='tab']").first().mousedown();
        }
    })();

    /* input[type='number'] MaxLength */
    $("input[data-max]").on("input", function () {
        var maxLength = parseInt($(this).attr("data-max"));
        console.log($(this).val().length, maxLength)
        if ($(this).val().length > maxLength) {
            return false;
        }

    })
});
    /* selectric */
    (function () {
        if ($(".selectric-select-wrap").length > 0) {
            $(".selectric-select-wrap select").each(function () {
                $(this).selectric()
            })
        }
    })();
/*스크롤바 기본 옵션*/
var scrollOption = {
    setWidth: false,
    setHeight: false,
    setTop: 0,
    setLeft: 0,
    axis: "y",
    scrollbarPosition: "inside",
    scrollInertia: 200,
    autoDraggerLength: true,
    autoHideScrollbar: true,
    autoExpandScrollbar: false,
    alwaysShowScrollbar: false,
    snapAmount: null,
    snapOffset: 0,
    mouseWheel: {
        enable: true,
        scrollAmount: "auto",
        axis: "y",
        preventDefault: false,
        deltaFactor: "auto",
        normalizeDelta: false,
        invert: false,
        disableOver: ["select", "option", "keygen", "datalist", "textarea"]
    },
    scrollButtons: {
        enable: false,
        scrollType: "stepless",
        scrollAmount: "auto"
    },
    keyboard: {
        enable: true,
        scrollType: "stepless",
        scrollAmount: "auto"
    },
    contentTouchScroll: 25,
    advanced: {
        autoExpandHorizontalScroll: false,
        autoScrollOnFocus: "input,textarea,select,button,datalist,keygen,a[tabindex],area,object,[contenteditable='true']",
        updateOnContentResize: true,
        updateOnImageLoad: true,
        updateOnSelectorChange: false,
        releaseDraggableSelectors: false
    },
    theme: "light",
    callbacks: {
        onInit: false,
        onScrollStart: false,
        onScroll: false,
        onTotalScroll: false,
        onTotalScrollBack: false,
        whileScrolling: false,
        onTotalScrollOffset: 0,
        onTotalScrollBackOffset: 0,
        alwaysTriggerOffsets: true,
        onOverflowY: false,
        onOverflowX: false,
        onOverflowYNone: false,
        onOverflowXNone: false
    },
    live: false,
    liveSelector: null
}