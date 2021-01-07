/*
 * jQuery tabs
 */
 
(function($) {
	$.fn.tabs = function(opt) {
		var defaults = {
			menu: "ul li",
			content: "div"
		};
		var options = $.extend(defaults, opt || {});
		
		var tabmenu = $(this).find(options.menu);
		var tabcont = $(this).find(options.content);
		
		$(tabmenu).each(function(index) {
			$(this).css("cursor","pointer");
			
			$(this).click(function() {
				tabcont.hide();
				tabcont.eq(index).show();
			});
		});
	};
})(jQuery);
