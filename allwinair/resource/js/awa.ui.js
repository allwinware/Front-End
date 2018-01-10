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
                AWAUI.main.banner();
                AWAUI.main.matching();
                AWAUI.main.success();
                AWAUI.main.tooltips();
                AWAUI.main.partners();
            },
            banner: function () {
                $('#js-top-banner__close').on('click', function () {
                    $(this).parent().slideUp('fast');
                });
            },
            matching: function () {
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
            success: function () {
                var successList = $('.mc-suc__list > ul').awaSlide({mode: 'vertical', auto: true});
                $('.mc-suc__list').on('mouseenter', function () {
                    $(this).addClass('mc-suc__list--hover');
                    successList.destroySlider();
                });
                $('.mc-suc__list').on('mouseleave', function () {
                    $('.mc-suc__bts').hide();
                    $(this).removeClass('mc-suc__list--hover');
                    successList.reloadSlider();
                });
                $('.mc-suc__item').on('click', function () {
                    $('.mc-suc__bts').hide();
                    $(this).find('.mc-suc__bts').fadeIn('fast');
                });
            },
            tooltips: function () {
                //좌
                $('.js-tooltip-type1').tooltip({
                    show: null,
                    tooltipClass: "awa-tooltip1",
                    items: "[data-tooltip-txt]",
                    position: {
                        my: 'left center', at: 'right center'
                    },
                    content: function () {
                        return $(this).data("tooltip-txt");
                    }
                    ,
                    open: function (event, ui) {
                        ui.tooltip.animate({left: ui.tooltip.position().left + 10}, "fast");
                    }
                });

                //위
                $('.js-tooltip-type2').tooltip({
                    show: null,
                    tooltipClass: "awa-tooltip2",
                    items: "[data-tooltip-txt]",
                    position: {
                        my: 'center bottom', at: 'center+5 top'
                    },
                    content: function () {
                        return $(this).data("tooltip-txt");
                    },
                    open: function (event, ui) {
                        ui.tooltip.animate({top: ui.tooltip.position().top - 10}, "fast");
                    }
                });
            },
            partners: function () {
                var airline = $('#pnrs__airlines .pnrs-lists > ul').awaSlide({infiniteLoop: false});
                var travelAgencys = $('#pnrs__travel-agencys .pnrs-lists > ul').awaSlide({infiniteLoop: false});

                $('.pnrs-tab__link').on('click', function () {
                    var activeTab = $(this).attr('href');
                    $('.pnrs-tab__link').removeClass('pnrs-tab__link--active');
                    $(this).addClass('pnrs-tab__link--active');
                    $('.pnrs-tabs__conts > div').hide();
                    $(activeTab).show();
                    $(activeTab).find('.filter-button-group li:first-child button').click();
                    return false;
                });

                //필터 항공사
                $('#pnrs__airlines .filter-button-group').on('click', 'button', function () {
                    var filterValue = $(this).attr('data-filter');

                    if (filterValue == "*") {
                        $('#pnrs__airlines .pnrs-lists > ul').isotope('destroy');
                        airline.reloadSlider();
                    } else {
                        airline.destroySlider();
                        var $pnrLists = $('#pnrs__airlines .pnrs-lists > ul').isotope({
                            transitionDuration: 0,
                            itemSelector: '#pnrs__airlines .pnr-lists__item',
                            layoutMode: 'fitRows'
                        });
                        $pnrLists.isotope({filter: filterValue});
                    }
                    $('#pnrs__airlines .filter-button-group').find('button').removeClass('pnrs-sort__link--active');
                    $(this).addClass('pnrs-sort__link--active');
                });

                //필터 여행사
                $('#pnrs__travel-agencys .filter-button-group').on('click', 'button', function () {
                    var filterValue = $(this).attr('data-filter');
                    if (filterValue == "*") {
                        $('#pnrs__travel-agencys .pnrs-lists > ul').isotope('destroy');
                        travelAgencys.reloadSlider();
                    } else {
                        travelAgencys.destroySlider();
                        var $pnrLists = $('#pnrs__travel-agencys .pnrs-lists > ul').isotope({
                            transitionDuration: 0,
                            itemSelector: '#pnrs__travel-agencys .pnr-lists__item',
                            layoutMode: 'fitRows'
                        });
                        $pnrLists.isotope({filter: filterValue});
                    }
                    $('#pnrs__travel-agencys .filter-button-group').find('button').removeClass('pnrs-sort__link--active');
                    $(this).addClass('pnrs-sort__link--active');
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