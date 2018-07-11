AWAMUI = (function () {
    'use strict';

    var AWAMUI = {
        /**
         * 공통 UI
         */
        common: {
            init: function () {

                AWAMUI.common.datepicker();
                //AWAMUI.common.fixedHeader();
                AWAMUI.common.nav();
            },
            fixedHeader: function () {
                var $obj = $('.header, .container'),
                    $depth2 = $('.depth2-items');

                $(window).scroll(function () {
                    if ($(this).scrollTop() > 60) {
                        $obj.addClass('fixed');
                    } else {
                        $obj.removeClass('fixed');
                        $depth2.show();
                    }
                });
            },
            nav: function () {
                var $depth1 = $('.header .navs li a'),
                    $depth2 = $('.header .depth2-items'),
                    $depth2Item = $('.header .depth2-item'),
                    $depthItems = $('.header .navs li a, .header .depth2-item');

                $(document).on('mouseenter', '.header .navs li a', function () {
                    var index = $depth1.index($(this));
                    $depthItems.removeClass('active');
                    $(this).addClass('active');
                    $depth2.slideDown('fast');
                    // if ($(this).closest('.header').hasClass('fixed')) {
                    //     $depth2.slideDown('fast');
                    // }
                    $depth2Item.eq(index).addClass('active');
                });

                $(document).on('mouseenter', '.header .depth2-item', function () {
                    var index = $depth2Item.index($(this));
                    $depthItems.removeClass('active');
                    $(this).addClass('active');
                    $depth1.eq(index).addClass('active');
                });

                $(document).on('mouseleave', '.header', function () {
                    $depthItems.removeClass('active');
                    $depth2.hide();
                    // if ($(this).hasClass('fixed')) {
                    //     $depth2.hide();
                    // }
                });

            },
            datepicker: function () {
                $('.js-datepicker-month').each(function () {
                    $(this).allwinDatepicker({
                        container: $(this).parent(),
                        autoClose: true,
                        singleDate: true,
                        showShortcuts: false,
                        singleMonth: true,
                        onlyMonth: true,
                        time: {
                            enabled: false
                        }
                    });
                });

                $('.js-datepicker-single').each(function () {
                    $(this).allwinDatepicker({
                        container: $(this).parent(),
                        autoClose: true,
                        singleDate: true,
                        showShortcuts: false,
                        singleMonth: true,
                        time: {
                            enabled: false
                        }
                    });
                });

                $('.js-datepicker-time').each(function () {
                    $(this).allwinDatepicker({
                        format: 'YYYY-DD-MM HH:mm',
                        container: $(this).parent(),
                        autoClose: true,
                        singleDate: true,
                        showShortcuts: false,
                        singleMonth: true,
                        time: {
                            enabled: true
                        }
                    });
                });

                $('.js-datepicker-range').each(function () {
                    $(this).allwinDatepicker({
                        container: $(this).parent(),
                        autoClose: true,
                        time: {
                            enabled: false
                        }
                    });
                });

                $('.js-datepicker-range-month').each(function () {
                    $(this).allwinDatepicker({
                        container: $(this).parent(),
                        autoClose: false,
                        onlyMonth: true,
                        time: {
                            enabled: false
                        }
                    });
                });
            }
        }
    };

    return AWAMUI;
}());

$(function () {
    AWAMUI.common.init();
});