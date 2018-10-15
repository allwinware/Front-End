AIRUI = (function () {
    'use strict';

    var AIRUI = {
        /**
         * 공통 UI
         */
        common: {
            init: function () {
                AIRUI.common.select();
            },
            select: function () {
                $('.custom-select select').select2({minimumResultsForSearch: -1});
              $('.policy .scroll').mCustomScrollbar({scrollInertia: 100});

                // $('.awa-select__srch select').select2();
            }
        },
        /**
         * 모달 UI
         */
        layer: {
            open: function (layerID) {
                var targetLayer = "#" + layerID,
                    dims = $('<div class="dims"></div>');

                $('body').addClass('kill');
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
                    'z-index': 99
                }).fadeTo('fast', 0.5);
                $(window).resize(function () {
                    $(targetLayer).css({
                        'top': Math.max(0, (($(window).height() - $(targetLayer).height()) / 2) + $(window).scrollTop()) + "px",
                        'left': Math.max(0, (($(window).width() - $(targetLayer).width()) / 2) + $(window).scrollLeft()) + "px"
                    }).fadeIn('fast');
                });
            },
            close: function (layerID) {
                $('body').removeClass('kill');
                $("#" + layerID).fadeOut('fast');
                $('.dims').remove();
            }
        }
    };

    return AIRUI;
}());

$(function () {
    AIRUI.common.init();
});