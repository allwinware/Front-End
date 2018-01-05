TOZUI = (function () {
    'use strict';

    var TOZUI = {
        /**
         * 공통
         */
        common: {
            init: function () {

            }
        },
        /**
         * 모달 레이어
         */
        layers: {
            open: function (modalID) {
                var layer = "#" + modalID;
                var bg = $('<div class="dim" ></div>');
                var layerType = $(layer).attr('class');

                if ($(layer).hasClass('layer_type1')) {
                    $(layer).fadeIn('fast');
                } else if ($(layer).hasClass('layer_type2')) {
                    $(layer).css({
                        'top': Math.max(0, (($(window).height() - $(layer).height()) / 2) + $(window).scrollTop()) + "px",
                        'left': Math.max(0, (($(window).width() - $(layer).width()) / 2) + $(window).scrollLeft()) + "px"
                    }).fadeIn('fast');
                    $(bg).appendTo('body').fadeIn('fast');

                    //레이어 높이가 화면보다 클경우
                    if ($(layer).height() > $(window).height()) {
                        $(layer).css({'top': '50px'});
                    }
                    ;
                } else if ($(layer).hasClass('layer_type3')) {
                    $(layer).css({
                        'top': Math.max(0, (($(window).height() - $(layer).height()) / 2) + $(window).scrollTop()) + "px",
                        'left': Math.max(0, (($(window).width() - $(layer).width()) / 2) + $(window).scrollLeft()) + "px"
                    }).fadeIn('fast');
                    $(bg).appendTo('body').fadeIn('fast');
                    var layerSlider = $('.layer_slider > ul').bxSlider({
                        onSlideAfter: function () {
                            $('.slide_num .current_num').text(layerSlider.getCurrentSlide() + 1);
                        }
                    });
                    $('.slide_num .current_num').text(1);
                    $('.slide_num .total_num').text(layerSlider.getSlideCount());
                }
            },
            close: function (modalID) {
                $('#' + modalID).hide();
                $('.dim').remove();
            }
        }
    };

    return TOZUI;
}());

$(function () {
    TOZUI.common.init();
});