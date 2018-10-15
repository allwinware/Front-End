AIRUI = (function () {
    'use strict';

    var AIRUI = {
        /**
         * 공통 UI
         */
        common: {
            init: function () {
              AIRUI.common.select();
              AIRUI.common.loading();
            },
            select: function () {
                $('.custom-select select').select2({minimumResultsForSearch: -1});
                // $('.awa-select__srch select').select2();
            },
          loading: function () {
            var $elGSAP = $('.wing-thumb'),
                tl = new TimelineMax({repeat: -1});
            tl.to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-7C.svg)'})
            .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-CX.svg)'})
            .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-LJ.svg)'})
            .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-NX.svg)'})
            .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-PR.svg)'})
            .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-SQ.svg)'})
            .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-TG.svg)'})
            .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-VJ.svg)'})
            .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-VN.svg)'})
            .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-ZE.svg)'});
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