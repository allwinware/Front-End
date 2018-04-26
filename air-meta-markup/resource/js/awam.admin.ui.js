AWAMUI = (function () {
    'use strict';

    var AWAMUI = {
        /**
         * 공통 UI
         */
        common: {
            init: function () {
                AWAMUI.common.datepicker();
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
            }
        }
    };

    return AWAMUI;
}());

$(function () {
    AWAMUI.common.init();
});