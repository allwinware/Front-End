AWAUI = (function () {
    'use strict';

    var AWAUI = {
        /**
         * 공통 UI
         */
        common: {
            init: function () {
                AWAUI.common.headerFixed();
            },
            headerFixed: function () {
                //헤더 고정
                var stickyOffset = $('.awa-header').offset().top;

                $(window).scroll(function () {
                    var sticky = $('.awa-header'),
                        scroll = $(window).scrollTop();

                    if (scroll >= stickyOffset) sticky.addClass('fixed');
                    else sticky.removeClass('fixed');
                });
            }
        },
        /**
         * 메인 UI
         */
        main: {
            init: function () {
                AWAUI.main.topBanner();
                AWAUI.main.matchingSrch();
                AWAUI.main.matchingSuccess();
            },
            //상단 배너
            topBanner: function () {
                $('#js-top-banner__close').on('click', function () {
                    $(this).parent().slideUp('fast');
                });
            },
            matchingSrch: function () {
                //도착도시
                $('.ag__link').on('click', function () {
                    $('.ag__link').removeClass('ag__link--active');
                    $(this).addClass('ag__link--active');
                    $('.agc__items').hide();
                    var activeTab = $(this).attr('href');
                    $(activeTab).fadeIn();
                    return false;
                });
            },
            matchingSuccess: function () {
                var successList = $('#js-matching-success > ul').awaSlide({mode: 'vertical', auto: true});
                $('#js-matching-success').on('mouseenter', function () {
                    $('#js-matching-success').addClass('hover');
                    successList.destroySlider();
                });
                $('#js-matching-success').on('mouseleave', function () {
                    $('#js-matching-success').removeClass('hover');
                    successList.reloadSlider();
                });
            }
        },
        /**
         * 모달 UI
         */
        layers: {
            open: function (modalID) {

            },
            close: function (modalID) {

            }
        }
    };

    return AWAUI;
}());

$(function () {
    AWAUI.common.init();
    AWAUI.main.init();
});