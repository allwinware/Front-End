$(document).ready(function () {
	$(".pageWrap.wrapper").css("height", $(window).height() );

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
		$(".paySummaryContainer .detailWrap").css("height", $(window).height() - 100 );
		$(".paySummaryContainer").toggleClass("open");
		$(".paySummaryContainer").toggleClass("close");
		$("body").toggleClass("menuOpen");
		$(".paySummaryContainer.open .paySummaryWrap").css("height", $(window).height() - 44 );
		$(".paySummaryContainer.close .paySummaryWrap").css("height", 56 );
	});

	$(document).on('click', '.popupBtn', function() {
		var popupIndex = $(this).attr('id');
		$(".popupContainer."+popupIndex).show();
//		var popupwidth = $('.popupContainer .popupWrap').not( ":hidden" ).width();
		var popupHeight = $('.popupContainer .popupWrap').not( ":hidden" ).height();
//		$('.popupContainer .popupWrap').not( ":hidden" ).css("left","calc(50% - "+(popupwidth+2)/2+"px");
		$('.popupContainer .popupWrap').not( ":hidden" ).css("top","calc(50% - "+(popupHeight+2)/2+"px");
	});
/*
	$(document).on('click', '.popupDimmed', function() {
		$(this).parent().hide();
	});
*/
	$(document).on('click', '.popupContainer .close', function() {
		$('.popupContainer').hide();
	});

});


