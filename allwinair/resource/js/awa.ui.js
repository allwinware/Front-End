AWAUI = (function () {
    'use strict';

    var AWAUI = {
        /**
         * 공통 UI
         */
        common: {
            init: function () {
                AWAUI.common.headerFixed();
                AWAUI.common.select();
                AWAUI.common.datepicker();
                AWAUI.common.scramble();
                AWAUI.common.tooltips();
            },
            headerFixed: function () {
                //헤더 고정
                $(window).scroll(function () {
                    var sticky = $('.awa-header, .evt__state-bar'),
                        scroll = $(window).scrollTop();

                    if (scroll >= 80) sticky.addClass('fixed');
                    else sticky.removeClass('fixed');
                });
            },
            select: function () {
                $('.awa-select__default select').select2({minimumResultsForSearch: -1});

                $('.awa-select__srch select').select2();
            },
            datepicker: function () {
                $('.js-datepicker-single').each(function () {
                    $(this).allwinDatepicker({
                        container: $(this).parent(),
                        autoClose: true,
                        singleDate: true,
                        showShortcuts: false,
                        singleMonth: true,
                        time: {
                            enabled: false
                        },
                        customOpenAnimation: function (cb) {
                            $(this).fadeIn(0, cb);
                        },
                        customCloseAnimation: function (cb) {
                            $(this).fadeOut(0, cb);
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
                        },
                        customOpenAnimation: function (cb) {
                            $(this).fadeIn(0, cb);
                        },
                        customCloseAnimation: function (cb) {
                            $(this).fadeOut(0, cb);
                        }
                    });
                });

                $('.js-datepicker-range').each(function () {
                    $(this).allwinDatepicker({
                        container: $(this).parent(),
                        autoClose: true,
                        time: {
                            enabled: false
                        },
                        customOpenAnimation: function (cb) {
                            $(this).fadeIn(0, cb);
                        },
                        customCloseAnimation: function (cb) {
                            $(this).fadeOut(0, cb);
                        }
                    });
                });
            },
            scramble: function () {

                if ($('.pnr-ct__top-profit').length > 0) {
                    $('.pnr-ct__top-profit strong').each(function () {
                        $(this).prop('Counter', 0).animate({
                            Counter: $(this).text()
                        }, {
                            duration: 5000,
                            step: function (now) {
                                //$(this).text(Math.ceil(now));
                                $(this).text(numberWithCommas(Math.ceil(now)));
                            }
                        });
                    });
                }


                if ($('.state-number').length > 0) {
                    $(".state-number").each(function () {
                        $(this).scramble(1000, 30, "numbers", true);
                    });
                }
            },
            customScroll: function () {
                var customScoll = $('.custom-scroll');
                $(customScoll).mCustomScrollbar();
            },
            tooltips: function () {
                $('.js-tooltips').each(function(){
                    var position, direction = $(this).data('tooltip-direction');
                    switch (direction) {
                        case 'top':
                            position = {
                                my: 'center bottom', at: 'center top', collision:'none',
                                using: function( position, feedback ) {
                                    $( this ).addClass( feedback.vertical ).css( position);
                                }
                            };
                            break;
                        case 'bottom':
                            position = {
                                my: 'center top', at: 'center bottom', collision:'none',
                                using: function( position, feedback ) {
                                    $( this ).addClass( feedback.vertical ).css( position);
                                }
                            };
                            break;
                        case 'left':
                            position = {
                                my: 'right center', at: 'left center',
                                using: function( position, feedback ) {
                                    $( this ).addClass( feedback.horizontal ).css( position);
                                }
                            };
                            break;
                        case 'right':
                            position = {
                                my: 'left center', at: 'right center',
                                using: function( position, feedback ) {
                                    $( this ).addClass( feedback.horizontal ).css( position);
                                }
                            };
                            break;
                    }

                    $(this).tooltip({
                        show: null,
                        items: "[data-tooltip-txt]",
                        position: position,
                        content: function () {
                            return $(this).data("tooltip-txt");
                        },
                        open: function (event, ui) {
                            if(direction == "right" || direction == "left" ){
                                ui.tooltip.animate({left: ui.tooltip.position().left + 5}, "fast");
                            }else if(direction == "top"){
                                ui.tooltip.animate({top: ui.tooltip.position().top - 5}, "fast");
                            }else if(direction == "bottom" ){
                                ui.tooltip.animate({top: ui.tooltip.position().top + 5}, "fast");
                            }
                        }

                    });
                });
            }
        },
        loading: {
            init: function () {
                var $elGSAP = $('.loading_ele'),
                    tl = new TimelineMax({repeat:-1});
                tl.to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading1.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading2.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading3.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading4.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading5.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading6.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading7.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading1.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading2.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading3.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading4.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading5.png)'})
                    .to($elGSAP, 0.2, {backgroundImage:'url(https://allwinware.github.io/Front-End/allwinair/resource/img/loading6.png)'});
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
                AWAUI.main.partners();
            },
            banner: function () {
                $('#js-top-banner__close').on('click', function () {
                    $(this).parent().slideUp('fast');
                });
            },
            matching: function () {
                //출/귀국일 선택
                if ($('#matching-datapicker__input').length > 0) {
                    $('#matching-datapicker__input').allwinDatepicker({
                        stickyMonths: true,
                        inline: true,
                        container: '.matching--datapicker__view',
                        alwaysOpen: true,
                        hoveringTooltip: false,
                        customHtml: '<div class="awa-datepicker__add-info"></div>'
                    });
                }


                var html = '';
                html += '<storng class="add-info__txt1">선호하는 편명 혹은 출국, 귀국 시간이 있으신가요?</storng>' +
                    '<p class="add-info__txt2">선택사항이며 가능한 선호사항을 반영하나 다른 항공권이 매칭 될 수 있어요.</p>' +
                    '<div class="add-info__radios">' +
                    '   <span class="tk-write__radio">' +
                    '       <input type="radio" id="pr1" value="time" name="add-info__radios" checked="checked"><label for="pr1">출/귀국 시간</label>' +
                    '   </span>' +
                    '   <span class="tk-write__radio">' +
                    '       <input type="radio" id="pr2" value="bp" name="add-info__radios" ><label for="pr2">편명</label>' +
                    '   </span>' +
                    '</div>' +
                    '<div class="add-info__selects" id="add-info__selects">' +
                    '   <div class="awa-select__layer">' +
                    '      <button type="button" class="awa-select__layer--target">출국 시간</button>' +
                    '      <div class="awa-select__layer--inner">' +
                    '           <ul>' +
                    '              <li><a href="">오전 00:00 ~ 11:51</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 11:52</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 11:53</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 11:54</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 11:55</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 11:56</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 11:57</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 11:58</a></li>' +
                    '           </ul>' +
                    '      </div>' +
                    '   </div>' +
                    '   <div class="awa-select__layer">' +
                    '      <button type="button" class="awa-select__layer--target">귀국 시간</button>' +
                    '      <div class="awa-select__layer--inner">' +
                    '           <ul>' +
                    '              <li><a href="">오전 00:00 ~ 10:51</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 10:52</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 10:53</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 10:54</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 10:55</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 10:56</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 10:57</a></li>' +
                    '              <li><a href="">오전 00:00 ~ 10:58</a></li>' +
                    '           </ul>' +
                    '      </div>' +
                    '   </div>' +
                    '</div>' +
                    '<div class="add-info__inputs" id="add-info__inputs">' +
                    '   <span class="tk-write__input">' +
                    '       <input type="text" placeholder="출국 편명 입력">' +
                    '   </span>' +
                    '   <span class="tk-write__input">' +
                    '       <input type="text" placeholder="귀국 편명 입력">' +
                    '   </span>' +
                    '   <p class="add-info__tip">*가능한 선호사항을 반영하나 다른 항공권이 매칭될 수 있습니다.</p>' +
                    '</div>' +
                    '<button type="button" class="awa-btn-300 yellow" >날짜 선택 완료</button>';

                $('.awa-datepicker__add-info').append(html);
                $('.add-info__radios input[type=radio]').change(function () {
                    var val = $(this).val();
                    $('.add-info__selects, .add-info__inputs').hide();
                    if (val == "time") {
                        $('#add-info__selects').show();
                    } else if (val == "bp") {
                        $('#add-info__inputs').show();
                    }
                });

                var selectTaget = $('.awa-select__layer--target'), selectLayer = $('.awa-select__layer--inner'),
                    selectItem = $('.awa-select__layer--inner a');
                $(selectTaget).on('click', function () {
                    $(selectLayer).hide();
                    $(this).next().slideDown('fast');
                    $(selectLayer).mCustomScrollbar();
                });
                $(selectItem).on('click', function () {
                    var text = $(this).text();
                    $(this).closest('.awa-select__layer').find(selectTaget).attr('data-value', text).text(text);
                    $(selectLayer).hide();
                    return false;
                });
                $(selectLayer).mouseleave(function () {
                    $(this).hide();
                });

                //도착도시
                $(document).on('click', '.ag__link', function() {
                    $('.ag__link').removeClass('ag__link--active');
                    $(this).addClass('ag__link--active');
                    $('.agc__items').hide();
                    var activeTab = $(this).attr('href');
                    $(activeTab).show();
                    return false;
                });
            },
            success: function () {
                for (var i = 30 - 1; i >= 0; i--) {
                    $('.flower-papers').prepend('<div class="flower-paper flower-paper' + i + '"></div>');
                }

                function flowerPapers() {
                    $('.flower-paper').each(function () {
                        var distX = getRandomArbitrary(-130, 130),
                            distY = getRandomArbitrary(-130, 130),
                            rotY = getRandomArbitrary(-720, 720),
                            rotX = getRandomArbitrary(-720, 720),
                            z = getRandomArbitrary(-500, 500);

                        TweenLite.to($(this), 1.5, {
                            x: distX,
                            y: distY,
                            rotationX: rotX,
                            rotationY: rotY,
                            opacity: 0,
                            z: z,
                            onComplete: complete
                        });

                    });
                }

                function getRandomArbitrary(min, max) {
                    return Math.random() * (max - min) + min;
                }

                var complete = function () {
                    $('.flower-paper').remove();
                };
                var successList = $('.mc-suc__list > ul').awaSlide({
                    mode: 'vertical',
                    pause: 5000,
                    auto: true,
                    onSliderLoad: function () {
                        flowerPapers();
                    },
                    onSlideAfter: function () {
                        for (var i = 30 - 1; i >= 0; i--) {
                            $('.flower-papers').prepend('<div class="flower-paper flower-paper' + i + '"></div>');
                        }
                        flowerPapers();
                    }
                });
                var timeoutId, eT = 0;
                $('.mc-suc__list').on('mouseenter', function () {
                    if (!timeoutId) {
                        timeoutId = window.setTimeout(function() {
                            timeoutId = null;
                            $('.mc-suc__list').addClass('mc-suc__list--hover');
                            successList.destroySlider();

                            $('.mc-suc__list--hover .mc-suc__item').each(function (i) {
                                $(this).delay(eT).animate({ opacity: 1 }, 500);
                                eT += 100;
                            });
                        }, 500);
                    }
                });
                $('.mc-suc__list').on('mouseleave', function () {
                    if (timeoutId) {
                        window.clearTimeout(timeoutId);
                        timeoutId = null;

                    }
                    else {
                        eT = 0;
                        $('.mc-suc__bts').hide();
                        $(this).removeClass('mc-suc__list--hover');
                        $('.mc-suc__item').css('opacity', '');
                        successList.reloadSlider();
                    }
                });
                $('.mc-suc__item').on('click', function () {
                    $('.mc-suc__bts').hide();
                    $(this).find('.mc-suc__bts').fadeIn('fast');
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
                    if($(this).hasClass("pnrs-sort__link--not")) return false;
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
                    if($(this).hasClass("pnrs-sort__link--not")) return false;
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
        layer: {
            open: function (layerID) {
                var targetLayer = "#" + layerID;
                var dims = $('<div class="dims"></div>');

                if ($('.custom-scroll').length > 0) {
                    AWAUI.common.customScroll();
                }
                $(targetLayer).css({
                    'top': Math.max(0, (($(window).height() - $(targetLayer).height()) / 2) + $(window).scrollTop()) + "px",
                    'left': Math.max(0, (($(window).width() - $(targetLayer).width()) / 2) + $(window).scrollLeft()) + "px"
                }).fadeIn('fast');
                $(dims).appendTo('body').css({
                    'width': '100%',
                    'height': '100%',
                    'display': 'none',
                    'background-color': '#000',
                    'filter': 'alpha(opacity=50)',
                    'position': 'fixed',
                    'top': 0,
                    'left': 0,
                    'z-index': 3000
                }).fadeTo('fast', 0.5);
                $(window).resize(function () {
                    $(targetLayer).css({
                        'top': Math.max(0, (($(window).height() - $(targetLayer).height()) / 2) + $(window).scrollTop()) + "px",
                        'left': Math.max(0, (($(window).width() - $(targetLayer).width()) / 2) + $(window).scrollLeft()) + "px"
                    }).fadeIn('fast');
                });
            },
            close: function (layerID) {
                $("#" + layerID).fadeOut('fast');
                $('.dims').remove();
            }
        }
    };

    return AWAUI;
}());

$(function () {
    AWAUI.common.init();
});