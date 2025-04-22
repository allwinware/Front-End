
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
    $("#openpopup_btn4").click(function () {
        $(".popup_box4").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });
    $("#openpopup_btn5").click(function () {
        $(".popup_box5").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });
    $("#openpopup_btn6").click(function () {
        $(".popup_box6").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });
    $("#openpopup_btn7").click(function () {
        $(".popup_box7").fadeIn();
        $("body").css("overflow", "hidden");
        $("html").css("overflow", "hidden");
    });
  
    //닫기
    $(".popup_close_btn").click(function () {
        $(".popups").fadeOut();
        $("body").css("overflow", "");
        $("html").css("overflow", "");
    });
  });
  



/*가는편 오는편*/
$(document).on("click", "#ags-wrap", function () {
    $('.select_back').removeClass("active");
    $('.select_come').addClass("active");

    /*위에 텍스트*/
	$(".menu_text").hide();
	$(".menu_text_fo").show();

    /*밑에 input*/
    $(".locals").hide();
	$(".foreigners").show();
    
    /*버튼*/
    $('.buttons').hide();
    $('.buttons_fo').show();
    

});

$(document).on("click", "#ags-wrap-back", function () {
    $('.select_come').removeClass("active");
    $('.select_back').addClass("active");

    /*위에 텍스트*/
	$(".menu_text").show();
	$(".menu_text_fo").hide();

    /*밑에 input*/
    $(".locals").show();
	$(".foreigners").hide();

    /*버튼*/
    $('.buttons').show();
    $('.buttons_fo').hide();
});