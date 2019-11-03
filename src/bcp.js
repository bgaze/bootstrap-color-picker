(function ($) {
    /*
     * UTILS
     */

    // Turn 3 digit hex color into 6 digit version.
    var normalizeColor = (color) => {
        if (!color) {
            return null;
        }
        return color.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b);
    };

    // Check hex color brightness.
    var isColorDark = (hex) => {
        if (!hex) {
            return null;
        }

        // Parse color.
        var result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizeColor(hex));
        if (!result) {
            return null;
        }

        // Manage foreground color based on background brightness
        // https://www.w3.org/TR/AERT/#color-contrast
        result = Math.round(((parseInt(result[1], 16) * 299) + (parseInt(result[2], 16) * 587) + (parseInt(result[3], 16) * 114)) / 1000);
        return (result <= 125);
    };

    /*
     * DEFAULT OPTIONS 
     */

    // Define default configuration. 
    var defaults = {
        // Colors list.
        colors: [],
        // Template.
        template: '<div class="popover bcp-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
        // Build popover content.
        body: (colors) => {
            var content = colors.map(row => {
                let tmp = '';

                for (var color in row) {
                    let cl = isColorDark(color) ? 'dark' : 'light';
                    tmp += `<div class="bcp-color ${cl}" style="background-color: ${color};" data-color="${color}" title="${row[color]}"></div>`;
                }

                return `<div class="bcp-row">${tmp}</div>`;
            }).join('');

            return `<div class="bcp-content">${content}</div>`;
        }
    };

    // Override default configuration.
    $.bcpSetup = (options) => {
        defaults = $.extend(defaults, options);
    };

    /*
     * JQUERY PLUGIN
     */

    $.fn.bcp = function (options, value) {
        // Method "color" : get colorpicker value.
        if (options === 'color') {
            // Set.
            if (value) {
                $(this).attr('data-color', normalizeColor(value));
                $(this).trigger('pcb.selected').trigger('pcb.refresh');
                return;
            }

            // Get.
            return {
                value: $(this).first().attr('data-color') || null,
                dark: isColorDark($(this).first().attr('data-color') || null)
            };
        }


        // Prepare popover configuration.
        var settings = $.extend({}, defaults, options);
        if (!settings.colors.length) {
            return;
        }

        // Override reserved popover configuration.
        settings = $.extend(settings, {
            html: true,
            sanitize: false,
            trigger: 'manual',
            content: function () {
                console.log(settings.body(settings.colors));
                return settings.body(settings.colors);
            }
        });

        // Init popover.
        $(this).popover(settings).on('shown.bs.popover', function () {
            var color = $(this).attr('data-color');
            if (color && color !== '') {
                $(`[data-color="${color}"]`, $($(this).data('bs.popover').tip)).addClass('active');
            }
        });

        // Open popover on element click.
        $(this).click(function () {
            $(this).popover('toggle');
        });

        // Init default color.
        $(this).each(function () {
            if (!$(this).attr('data-color') || $(this).attr('data-color') === '') {
                $(this).attr('data-color', normalizeColor(settings.color));
            }
        }).trigger('pcb.refresh');

        // Keep chaining.
        return this;
    };

    /*
     * MANAGE CLICK EVENT GLOBALLY
     */

    $(document).on('click', function (e) {
        var $e = $(e.target);

        // Manage collor button click.
        if ($e.is('.bcp-popover .bcp-color *')) {
            $e = $e.parents('.bcp-color');
        }
        if ($e.is('.bcp-popover .bcp-color:not(.active)')) {
            let $p = $e.parents('.bcp-popover');
            $('.active', $p).removeClass('active');

            let $b = $(`[aria-describedby="${$p.attr('id')}"]`);
            $b.popover('hide').bcp('color', $e.attr('data-color'));

            return;
        }

        // Close opened popovers on outside click.
        $('.bcp-popover.show').each(function () {
            let id = $(this).attr('id');
            if (!$e.is(`[aria-describedby="${id}"], [aria-describedby="${id}"] *, #${id}, #${id} *`)) {
                $(`[aria-describedby="${id}"]`).popover('hide');
            }
        });
    });
}(jQuery));