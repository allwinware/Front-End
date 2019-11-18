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
		var popupHeight = $('.popupContainer .popupWrap').not( ":hidden" ).height();
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
//	191119
	$(document).on('click', '.alertBtn', function() {
		var alertIndex = $(this).attr('id');
		$(".alertContainer."+alertIndex).show();
		$("body").addClass("menuOpen");
	});
	$(document).on('click', '.alertContainer .close', function() {
		$('.alertContainer').hide();
		$("body").removeClass("menuOpen");
	});
//	- 191119

	$(".contentContainer.pay .agreeWrap ul li .more").click(function(){
		$(this).parent().toggleClass("open");
	});

	$(".contentContainer.pay .choiceWrap .btn").click(function(){
		$(".payDetailContainer").show();
	});
	$(".payDetailContainer .top a.close").click(function(){
		$(".payDetailContainer").hide();
	});

});


