var $body = $("body"),
    $page = $("#dfs-wrap"),
    $pageHeader = $("#header");

/* 상품가격 등의 숫자정보 표현 시 콤마 추가기능 정의 */
$.fn.digits = function(){
    return this.each(function(){
        $(this).text( $(this).text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") );
    })
};

$(document).ready(function(){
    /* 상품가격 등의 숫자정보 표현 시 콤마 추가 */
    (function(digitsHandler){
        $(".digits").digits();
    })();

    /* 맨 위로 버튼 동작 정의 */
    (function(){
        var $btn_scrollTop = $("#btn_scroll-top");
        $(window).scroll(function(){
            if ($(this).scrollTop() > 100) {
                $btn_scrollTop.fadeIn();
            } else {
                $btn_scrollTop.fadeOut();
            }
        });
        $btn_scrollTop.click(function(){
            $("html, body").animate({ scrollTop: 0 }, 600);
            return false;
        });

    })();

    /* 부드럽게 스크롤 되는 페이지 내부 링크 정의 */
    (function(){
        $(document).on('click', 'a[data-type="scroll-link"]', function (event) {
            event.preventDefault();
            $('html, body').animate({
                scrollTop: $($.attr(this, 'href')).offset().top - 80
            }, 1200);
        });
    })();

    /* 브라우저 상단에 붙어있는 Global Header 동작 정의  */
    (function(stickyHeader){
        function compScroll(el, current, setPoint){
            if (current > setPoint) {
                el.addClass("scroll-active");
            } else {
                el.removeClass("scroll-active")
            }
        }
        function headerHandler(){
            var currentScrollTop = $(document).scrollTop();
            if($page.attr("data-page-type") === "main"){
                var $visual = $("#visual"),
                    mainSetPoint = $visual.offset().top + $visual.height() - $("#dfs-header").height();
                compScroll($page, currentScrollTop, mainSetPoint);
            } else {
                compScroll($page, currentScrollTop, 0);
            }
        }
        $(window).on("scroll", function(){
            headerHandler();
        }).scroll()
    })();

    /* 브라우저 상단에 붙어있는 DFS HEADER 동작 정의 */
    /*(function(dfsNavHandler){
        var $dfsNav = $("#dfs-nav-sticky");
        var $dfsBavStopper = $("#footer");
        if (!!$dfsNav.offset()) { // make sure "#dfs-nav-wrap" element exists
            var generalSidebarHeight = $dfsNav.innerHeight();
            /!*var dfsNavTop = $dfsNav.offset().top;*!/
            var dfsNavOffset = $dfsNav.offset().top + 50;
            var dfsNavStopperPosition = $dfsBavStopper.offset().top;
            var stopPoint = dfsNavStopperPosition - generalSidebarHeight - dfsNavOffset;
            var diff = stopPoint + dfsNavOffset;

            $(window).scroll(function(){ // scroll event
                var windowTop = $(window).scrollTop(); // returns number
                if (stopPoint < windowTop) {
                    $dfsNav.css({ position: 'absolute', top: diff });
                } else if (dfsNavOffset < windowTop) {
                    $dfsNav.css({ position: 'fixed', top: $pageHeader.height() });
                } else {
                    $dfsNav.css({position: 'absolute', top: 'initial'});
                }
            });
        }
    })();*/
});