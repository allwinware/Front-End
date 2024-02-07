/*gnb 팝업 정의*/
$(document).on("click", "#btn_gnb", function () {
    $("#gnb-2dp").addClass("active");
    $("html, body").css("overflow", "hidden");
});

$(document).on("click", "#btn_gnb-close", function () {
    $("#gnb-2dp").removeClass("active");
    $("html, body").css("overflow", "");
});


