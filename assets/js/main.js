/*
	Phantom by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ '361px',   '480px'  ],
			xxsmall:  [ null,      '360px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Touch?
		if (browser.mobile)
			$body.addClass('is-touch');

	// Forms.
		function initForms($context) {
			var $form = $context.find('form');

			// Auto-resizing textareas.
			$form.find('textarea').each(function() {

				var $this = $(this);

				if ($this.parent().hasClass('textarea-wrapper')) return;

				var $wrapper = $('<div class="textarea-wrapper"></div>');

				$this
					.wrap($wrapper)
					.attr('rows', 1)
					.css('overflow', 'hidden')
					.css('resize', 'none')
					.on('keydown', function(event) {

						if (event.keyCode == 13
						&&	event.ctrlKey) {

							event.preventDefault();
							event.stopPropagation();

							$(this).blur();

						}

					})
					.on('blur focus', function() {
						$this.val(String($this.val()).trim());
					})
					.on('input blur focus --init', function() {

						$wrapper
							.css('height', $this.height());

						$this
							.css('height', 'auto')
							.css('height', $this.prop('scrollHeight') + 'px');

					})
					.on('keyup', function(event) {

						if (event.keyCode == 9)
							$this
								.select();

					})
					.triggerHandler('--init');

				// Fix.
					if (browser.name == 'ie'
					||	browser.mobile)
						$this
							.css('max-height', '10em')
							.css('overflow-y', 'auto');

			});
		}

		initForms($body);

	// Menu.
		var $menu = $('#menu');

		if ($menu.children('.inner').length == 0) {
			$menu.wrapInner('<div class="inner"></div>');
		}

        var $menuTriggers = $('a[href="#menu"]'),
            menuDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;
        $menu.attr({ 'aria-hidden': 'true', 'tabindex': '-1' }).prop('inert', true);
        $menuTriggers.attr({ 'aria-controls': 'menu', 'aria-expanded': 'false', 'aria-haspopup': 'dialog' });

        $menu._show = function() {
            if ($body.hasClass('is-menu-visible')) return;
            $body.addClass('is-menu-visible');
            $menuTriggers.attr('aria-expanded', 'true');
            SiteDialog.open($menu[0], { onClose: $menu._hide, returnFocus: $menuTriggers[0] });
            loadMenu();
        };

        $menu._hide = function() {
            if (!$body.hasClass('is-menu-visible')) return;
            $body.removeClass('is-menu-visible');
            $menuTriggers.attr('aria-expanded', 'false');
            SiteDialog.close($menu[0]);
        };

        $menu._toggle = function() {
            if ($body.hasClass('is-menu-visible')) $menu._hide();
            else $menu._show();
        };

		$menu
			.appendTo($body)
			.on('click', function(event) {
				event.stopPropagation();
			})
			.on('click', 'a', function(event) {

				var href = $(this).attr('href');
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

				event.preventDefault();
				event.stopPropagation();

				// Hide.
					$menu._hide();

				// Redirect.
					if (href == '#menu')
						return;

					window.setTimeout(function() {
						window.location.href = href;
					}, menuDelay);

			})
			.append('<a class="close" href="#menu">Close</a>');

		$body
			.on('click', 'a[href="#menu"]', function(event) {

				event.stopPropagation();
				event.preventDefault();

				// Toggle.
					$menu._toggle();

			})
			.on('click', function(event) {

				// Hide.
					$menu._hide();

			})
			.on('keydown', function(event) {

				// Hide on escape.
					if (event.keyCode == 27)
						$menu._hide();

			});

	// Function to load the menu
	function loadMenu() {
		// Check if #menu exists and if it hasn't been loaded already
		if ($menu.length && !$menu.data('loaded') && !$menu.data('loading')) {
            $menu.data('loading', true);
			// Ensure the inner wrapper exists so we don't clobber it during load
			if (!$menu.children('.inner').length) {
				$menu.wrapInner('<div class="inner"></div>');
			}
			var menuSource = $menu.attr('data-menu-src') || 'menu.html';
            // A stable URL lets the browser revalidate the shared menu normally.
			$menu.children('.inner').load(menuSource, function(response, status, xhr) {
                $menu.data('loading', false);
				if (status == "error") {
					$menu.children('.inner').html('<p role="status">The menu could not be loaded. <a href="/index.html">Return home</a>.</p>');
				} else {
					// Mark as loaded to prevent multiple loads if script is run again
					$menu.data('loaded', true);
					// Re-initialize menu scripts if they depend on dynamic content
					initForms($menu);

					$menu.trigger('menu_loaded');
				}
			});
		}
	}

	$(function() {
		loadMenu();
	});

})(jQuery);
