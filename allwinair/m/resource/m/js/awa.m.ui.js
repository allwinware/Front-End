AWAUI = (function () {
    'use strict';

    var AWAUI = {
        /**
         * 공통 UI
         */
        common: {
            init: function () {

            }
        },
        /**
         * 메인 UI
         */
        main: {
            init: function () {
                var $doc = $(document), $body = $('body'), $matchingSucLayer = $('#js-matching-success__layer');

                var visualSwiper = new Swiper('.visual .swiper-container', {
                    slidesPerView: 1,
                    spaceBetween: 15,
                    centeredSlides: true,
                    loop: true,
                    speed: 500,
                    autoplay: {
                        delay: 3000,
                        disableOnInteraction: false,
                    },
                    pagination: {
                        el: '.visual .swiper-pagination',
                        type: 'progressbar',
                    },
                });

                var successSwiper = new Swiper('.matching-success .swiper-container', {
                    direction: 'vertical',
                    speed: 1000,
                    touchRatio: 0,
                    autoplay: {
                        delay: 3000,
                        disableOnInteraction: false,
                    },
                });

                $doc.on('click', '#js-matching-success', function () {
                    $doc.scrollTop(0);
                    $body.addClass('kill');
                    $matchingSucLayer.addClass('open');

                });

                $doc.on('click', '#js-layer--hide', function () {
                    $body.removeClass('kill');
                    $matchingSucLayer.removeClass('open');
                });
            }
        },
        /**
         * 모달 UI
         */
        layer: {
            open: function (layerID) {

            },
            close: function (layerID) {

            }
        }
    };

    return AWAUI;
}());

$(function () {
    AWAUI.common.init();
});