$(document).ready(function () {
	$(".seatWrap ul li").click(function(){
		$(this).toggleClass("selected");
	});
	$(".passengerWrap ul li").click(function(){
		$(this).siblings().removeClass("selected");
		$(this).addClass("selected");
	});
	$("a.qa").hover(function(){
		$(this).next().show();
	}, function(){
		$(this).next().hide();
	});
});


