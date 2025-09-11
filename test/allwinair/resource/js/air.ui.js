/*배경 DIM 생성*/
function createDim(){
    $("body").append("<div class='page-dim'></div>");
    setTimeout(function(){
        $(".page-dim").addClass("active");
    }, 250);
    $("html, body").css("overflow", "hidden");
}

/*배경 DIM 제거*/
function deleteDim(){
    $(".page-dim").removeClass("active").addClass("remove");
    setTimeout(function(){
        $(".page-dim").remove().removeClass("remove");
    }, 1000);
    $("html, body").css("overflow", "");
}

/* 팝업 생성 기능 정의 */
function popupShow(target){
    createDim();
    setTimeout(function(){ target.addClass("active") }, 250);
}
/* 팝업 삭제 기능 정의  */
function popupHide(target){
    deleteDim();
    target.addClass("remove");
    setTimeout( function(){ target.removeClass("active").removeClass("remove") }, 250);
}

$(document).ready(function(){
    /* variation */
    var $win = $(window),
        $doc = $(document),
        $body = $("body");

    /* 팝업 */
    $doc.on("click", "[data-popup]", function(){
        var $pop = $($(this).attr("data-popup"));
        popupShow($pop);
        if($(this).parents("#site-nav").length > 0){
            /*사이트 네비게이션일 때*/
            setTimeout(function(){
                $("a[href=" + $(this).attr("href") + "]").click();
            }, 1000)
        }
    });

    $doc.on("click", "[data-role='close']", function(){
        var $pop = $($("#" + $(this).parents(".pop-area").attr("id")));
        popupHide($pop);
    });

    /* 팝업형 서브페이지 컨트롤 */
    (function(){
        $("a[data-bind]").on("click", function(e){
            e.preventDefault();
            $("[data-bind='" + $(this).attr("data-bind") + "']").each(function(){
                $(this).addClass("active").siblings().removeClass("active")
            })
        });
    })();

});