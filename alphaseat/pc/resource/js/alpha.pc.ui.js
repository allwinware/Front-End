
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

/*스크롤이 특정 위치를 지나갈 때 클래스 첨삭*/
function compScroll(el, current, setPoint, className) {
    if (current > setPoint) {
        el.addClass(className);
    } else {
        el.removeClass(className)
    }
}

/* 상품가격 등의 숫자정보 표현 시 콤마 추가기능 정의 */
$.fn.digits = function () {
    return this.each(function () {
        $(this).text($(this).text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
    })
};

/*배경 DIM 생성*/
function createDim(target) {
    /*if(target.attr("data-type") === "drawer" || target.attr("data-type") === "message"){*/
    if (target.attr("data-type") === "drawer") {
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

/* 팝업 생성 기능 정의 */
function popupShow(target) {
    createDim(target);
    setTimeout(function () { target.addClass("active") }, 250);
}
function popupShow_NoDim(target) {
    setTimeout(function () { target.addClass("active") }, 250);
}
/* 팝업 삭제 기능 정의  */
function popupHide(target) {
    setTimeout(function () { target.removeClass("active"); }, 250);
    setTimeout(function () { deleteDim(target) }, 1000)
}

/* 팝업 활성화 / 비활성화 정의 */
function popupActivate(target) {
    var $pop = $(target);

    if ($pop.attr("data-type") === 'alert') {
        if ($pop.attr("data-dim") === undefined && $pop.attr("data-dim-clear") === undefined) {
            popupShow($pop);
        } else if ($pop.attr("data-dim") === 'false' && $pop.attr("data-dim-clear") === undefined) {
            popupShow_NoDim($pop);
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
            popupShow_NoDim($pop);
        }

    } else if ($pop.attr("data-type") === 'message') {
        /*messagePopShow($pop)*/
        popupShow($pop);
    } else if ($pop.attr("data-type") === 'submission') {
        /*messagePopShow($pop)*/
        popupShow($pop);
    } else if ($pop.attr("data-type") === 'drawer') {
        if ($pop.hasClass("active") === true) {
            $pop.css("height", "");
            popupHide($pop)
        } else {
            popupShow($pop);
            $pop.css("height", $win.innerHeight() - $("#ags-header").height());
        }
    } else if ($pop.attr("data-type") === 'guidance' && $pop.attr("data-dim") === undefined) {
        popupShow($pop);
    } else if ($pop.attr("data-type") === 'guidance' && $pop.attr("data-dim") === 'false') {
        popupShow_NoDim($pop);
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
    }
}

function popupInactivate(target) {
    var $pop = $(target);
    if ($pop.attr("data-type") === 'alert' || $pop.attr("data-type") === 'message' || $pop.attr("data-type") === 'submission' || $pop.attr("data-type") === 'guidance') {
        popupHide($pop);
    }
}

/* 엘리먼트가 특정 위치에서 Sticky되거나 unSticky되는 기능 정의 */
function sticky(target, start, end) {
    var $target = target;
    if ($win.scrollTop() >= start) {
        $target.addClass("ui-fixed");
        if ($win.scrollTop() >= end) {
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

/* 컨텐츠 로드/리사이즈 시 body 높이값 정의 */
function fitLayout() {
    var delay = 300,
        timer = null,
        $win = $(window),
        $body = $("body");
    $win.on("resize", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            if ($(".ags-wrap").height < $win.height()) {
                $body.addClass("fit-layout").css("min-height", $win.innerHeight());
            } else {
                $body.removeClass("fit-layout").css("min-height", "");
            }
        }, delay)
    }).resize()
}

$(window).on("load", function () {
    /* variation */
    var $win = $(window),
        $doc = $(document),
        $body = $("body");

    /* 컨텐츠 로드/리사이즈 시 컨텐츠 높이가 윈도우 높이보다 작으면 body에 최소 높이 주기 */
    fitLayout();
    /* Dom 변경으로 인해 컨텐츠 세로 높이가 윈도우 사이즈보다 길어지거나 짧아질 경우 fitLayout()을 호출해 다시 body의 높이값을 잡아주세요. (ex. 컨텐츠 로딩 전후 등) */

    /* 상품가격 등의 숫자정보 표현 시 콤마 추가 */
    (function (digitsHandler) {
        $(".digits").digits();
    })();

    /*.page-name에 단축 navigation 링크가 있을 경위*/
    (function () {
        var $nav = $("#nav-shortcut"),
            $navItem = $nav.find("a");
        $doc.on("click", "#btn_nav-shortcut", function (e) {
            $($(this).attr("href")).toggleClass("active");
            e.stopPropagation();
        });
        $doc.on("click", "body", function () {
            if ($nav.length > 0) {
                $nav.removeClass("active");
            }
        });
        $doc.on("click", $navItem, function () {
            $nav.removeClass("active");
        });
    })();

    /* Tab(탭) */
    (function (tabHandler) {
        $("[data-type='tab-group']").each(function () {
            var $thisTap = $(this),
                $tabBtn = $thisTap.find("[role='tab']"),
                $tabPan = $thisTap.find("[role='tabpanel']");

            // 시각적으로 활성화 표기를 위한 클래스 추가
            $tabBtn.first().addClass("active").attr("tabindex", "0");
            $tabPan.first().addClass("active").attr("tabindex", "0");

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
            $tabBtn.on("mousedown", function (e) {
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

    /* 일반적인 팝업을 컨트롤합니다. */
    $doc.on("click", "[data-popup]", function (e) {
        e.preventDefault();
        var $pop = $($(this).attr("data-popup"));
        popupActivate($pop)
    });

    $doc.on("click", "[data-role='close']", function (e) {
        e.preventDefault();
        var $pop = $($("#" + $(this).parents(".pop-area").attr("id")));
        popupInactivate($pop)
    });

    /* 스크롤 이벤트의 작동을 컨트롤 합니다. */
    (function (scrollHandler) {
        if ($("[data-ui*='fixed']").length > 0) {
            var $trg = $(".tab-panel.active [data-ui*='fixed']"),
                mainSetPoint = $trg.offset().top;
            $win.on("scroll", function () {
                var currentScrollTop = $doc.scrollTop();
                compScroll($body, currentScrollTop, mainSetPoint, "ui-fixed");
            }).scroll()
        }
    })();

    /* 앵커 태그를 이용해 타겟을 접고 펼치는 이벤트를 컨트롤합니다. */
    (function () {
        $doc.on("click", "a[data-foldable-target]", function () {
            var $trigger = $(this),
                $target = $($(this).attr("data-foldable-target"));
            if ($target.hasClass("active") === true) {
                $trigger.removeClass("active");
                $target.removeClass("active")
            } else {
                $trigger.addClass("active");
                $target.addClass("active")
            }
        });
    })();

    /*보드(게시판)형 테이블의 링크 처리*/
    (function () {
        var $grid = $("table[data-grid-type='board']");
        if ($grid.length > 0) {
            $($grid.find("a")).each(function () {
                var $item = $(this);
                $item.closest("tr:not(.accordion-content)").addClass("tr-anchor")
                    .attr("onClick", "location.href='" + $item.attr("href") + "'")
            })
        }
    })();

    /*아코디언 스타일 테이블 처리*/
    (function () {
        var $accordionWrap = $("[data-accordion='true']");
        if ($accordionWrap.attr("data-grid-type") === "board") {
            $(".tr-anchor").on("click", function (e) {
                $(this).toggleClass("active").siblings("tr:not(.accordion-content)").removeClass("active");
                e.preventDefault()
            })
        } else {
            $($accordionWrap.find("a")).on("click", function (e) {
                $(this).closest("tr").toggleClass("active").siblings("tr:not(.accordion-content)").removeClass("active");
                e.preventDefault()
            });
        }
    })();

    /* selectric */
    (function () {
        if ($(".selectric-select-wrap").length > 0) {
            $(".selectric-select-wrap select").each(function () {
                $(this).selectric()
            })
        }
    })();

    /* 스크롤 바를 미관상 보기 좋게 바꿔줍니다. */
    (function () {
        $("*[data-scrollbar='true']").mCustomScrollbar(scrollOption);
    })();

    /*anchor 태그로 컨텐츠 이동 시 smooth한 scroll 처리*/
    (function () {
        /*아이템 클릭 시 컨텐츠로 스크롤*/
        $(".btn_go-content").on("click", function (e) {
            e.preventDefault();
            var href = $(this).attr("href"),
                id = href.substring(href.indexOf('#'));
            offsetTop = href === "#" ? 0 : $(id).offset().top;
            $("html, body").stop().animate({
                scrollTop: offsetTop
            }, 300);
        });
    })();
});

$(document).ready(function () {
	/*좌석선택 오렌지*/
	$(document).on("click", ".seat_btn", function () {
		$(this).addClass("seat_active");
		$(".seat_num .seat_active span").css("display", "none");
	});

	$(document).on("click", ".seat_active", function () {
		$(this).removeClass("seat_active");
		$(".seat_num .seat_btn span").css("display", "block");
	});

	/*좌석선택 블루*/
	$(document).on("click", ".seat_btn_blue", function () {
		$(this).addClass("seat_active_blue");
		$(".seat_num .seat_active_blue span").css("display", "none");
	});

	$(document).on("click", ".seat_active_blue", function () {
		$(this).removeClass("seat_active_blue");
		$(".seat_num .seat_btn_blue span").css("display", "block");
	});

    /* 헤더 승객 슬라이더*/
    $(".select_group_btn>a").click(function(){
        var submenu = $(this).next("ul");
         if( submenu.is(":visible") ){
            submenu.slideUp(300);
            $(".select_group_btn").removeClass('active');
        }else{
            submenu.slideDown(300);
            $(".select_group_btn").addClass('active');
        }
    });
    /* 특정위치로 스크롤 이동*/

    $(".planscroll").click(function (event) {
        event.preventDefault();
        $('.box1_right').animate({
            scrollTop: $(this.hash).offset().top
        }, 500);

    });
    /*왼쪽 좌석 클릭 색상*/
    $(document).on("click", ".planscroll", function () {
		$(this).addClass("left_active");
	});
    $(document).on("click", ".left_active", function () {
		$(this).removeClass("left_active");
	});
});

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
};