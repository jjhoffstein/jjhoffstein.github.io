/* Shared keyboard and focus behavior for the site's existing overlays. */
(function () {
    'use strict';

    var active = null;
    var focusableSelector = 'a[href], button, input, select, textarea, [tabindex]';

    function focusableElements(element) {
        return Array.from(element.querySelectorAll(focusableSelector)).filter(function (item) {
            return !item.disabled && item.tabIndex >= 0 && !item.closest('[inert]') && item.getClientRects().length;
        });
    }

    function focusFirst() {
        if (!active) return;
        var target = active.initialFocus || focusableElements(active.element)[0] || active.element;
        target.focus({ preventScroll: true });
    }

    function open(element, options) {
        options = options || {};
        if (active && active.element === element) return;
        if (active) active.close();

        element.setAttribute('tabindex', '-1');
        element.setAttribute('role', 'dialog');
        element.setAttribute('aria-modal', 'true');
        element.setAttribute('aria-hidden', 'false');
        element.inert = false;
        var state = {
            element: element,
            initialFocus: options.initialFocus,
            previousFocus: options.returnFocus || document.activeElement,
            restoreFocus: options.restoreFocus,
            close: options.onClose,
            siblings: []
        };

        // Disable sibling branches rather than an ancestor containing the dialog.
        var branch = element;
        while (branch && branch !== document.body) {
            Array.from(branch.parentElement.children).forEach(function (sibling) {
                if (sibling === branch) return;
                state.siblings.push({ element: sibling, inert: sibling.inert });
                sibling.inert = true;
            });
            branch = branch.parentElement;
        }
        active = state;
        focusFirst();
    }

    function close(element) {
        if (!active || active.element !== element) return;
        var state = active;
        active = null;
        element.setAttribute('aria-hidden', 'true');
        element.inert = true;
        state.siblings.forEach(function (sibling) {
            sibling.element.inert = sibling.inert;
        });
        var target = state.previousFocus;
        if (!target || target === document.body || !target.isConnected || target.closest('[inert]') || !target.getClientRects().length) {
            target = typeof state.restoreFocus === 'function' ? state.restoreFocus() : state.restoreFocus;
        }
        if (target) target.focus({ preventScroll: true });
    }

    document.addEventListener('keydown', function (event) {
        if (!active) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            active.close();
            return;
        }
        if (event.key !== 'Tab') return;
        var items = focusableElements(active.element);
        var first = items[0] || active.element;
        var last = items[items.length - 1] || active.element;
        if (!active.element.contains(document.activeElement) || !items.length) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === active.element)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }, true);

    document.addEventListener('focusin', function (event) {
        if (active && !active.element.contains(event.target)) focusFirst();
    });

    window.SiteDialog = { open: open, close: close, isOpen: function () { return active !== null; } };
})();
