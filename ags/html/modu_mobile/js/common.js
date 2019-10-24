$(document).ready(function () {
	$(".passenger ul li").click(function(){
		$(this).siblings().removeClass("selected");
		$(this).addClass("selected");
	});
	$(window).scroll(function() {
		if ($(document).scrollTop() > 234 ) {
			$(".pageWrap").addClass("passengerFixed");
		}	else	{
			$(".pageWrap").removeClass("passengerFixed");
		}
	});
	$(".paySummaryContainer .moreBtn").click(function(){
		$(".paySummaryContainer").toggleClass("open");
	});
});


