(function ($, Backdrop, window, document, undefined) {
    'use strict';

    var storageKey = 'shortcutToolbarHidden';
    var state = {
        initialized: false,
        storageSupported: false,
        delegated: false
    };
    var actionState = {
        bound: false
    };

    function storageAvailable() {
        try {
            var testKey = '__shortcutStorageTest__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        }
        catch (e) {
            return false;
        }
    }

    function setVisibility(show, elements, persist) {
        var $body = elements.body;
        var $toolbar = elements.toolbar;
        var $toggles = elements.toggles || $();

        if (show) {
            $body.addClass('shortcut-toolbar-visible').removeClass('shortcut-toolbar-hidden');
            $toolbar.attr('aria-hidden', 'false');
        }
        else {
            $body.removeClass('shortcut-toolbar-visible').addClass('shortcut-toolbar-hidden');
            $toolbar.attr('aria-hidden', 'true');
        }

        var toggleStateText = show ? Backdrop.t('Hide shortcuts') : Backdrop.t('Show shortcuts');
        $toggles.each(function () {
            var $toggle = $(this);
            $toggle
                .toggleClass('toggle-active', show)
                .attr({
                    'aria-pressed': show ? 'true' : 'false',
                    'aria-expanded': show ? 'true' : 'false',
                    'title': toggleStateText,
                    'aria-label': toggleStateText
                });

            var $label = $toggle.find('.admin-bar-link-text');
            if ($label.length) {
                $label.text(toggleStateText);
            }
        });

        if (persist && elements.storage) {
            window.localStorage.setItem(storageKey, show ? '0' : '1');
        }
    }

    function getButtonConfig($button) {
        var data = $button.data();
        return {
            action: (data.shortcutToolbarAction || '').toLowerCase(),
            request: $.trim(data.shortcutToolbarRequest || ''),
            title: $.trim(data.shortcutToolbarTitle || ''),
            token: $.trim(data.shortcutToolbarToken || ''),
            addUrl: $.trim(data.shortcutToolbarAddUrl || ''),
            removeUrl: $.trim(data.shortcutToolbarRemoveUrl || ''),
            disableUrl: $.trim(data.shortcutToolbarDisableUrl || data.shortcutToolbarRemoveUrl || '')
        };
    }

    function updateMessages(markup) {
        if (typeof markup !== 'string') {
            return;
        }

        var trimmed = $.trim(markup);
        if (!trimmed.length) {
            return;
        }

        var $container = $('#messages');
        if (!$container.length) {
            $container = $('<div id="messages" class="l-messages"></div>').prependTo('body');
        }

        if (Backdrop.detachBehaviors && $container.length) {
            Backdrop.detachBehaviors($container[0]);
        }

        $container.html(trimmed);

        if (Backdrop.attachBehaviors && $container.length) {
            Backdrop.attachBehaviors($container[0]);
        }
    }

    function renderFallbackMessage(text) {
        if (!text) {
            return;
        }

        var safeText = Backdrop.checkPlain(text);
        var markup = '<div class="messages error" role="alert"><div>' + safeText + '</div></div>';
        updateMessages(markup);
    }

    function refreshToolbar(markup, wasVisible) {
        if (typeof markup !== 'string' || !markup.length) {
            return;
        }

        var $toolbar = $('#shortcut-toolbar');
        if (!$toolbar.length) {
            return;
        }

        var $replacement = $(markup);
        if (!$replacement.length) {
            return;
        }

        if (Backdrop.detachBehaviors) {
            Backdrop.detachBehaviors($toolbar[0]);
        }

        $replacement.attr('aria-hidden', wasVisible ? 'false' : 'true');
        $toolbar.replaceWith($replacement);

        if (Backdrop.attachBehaviors) {
            Backdrop.attachBehaviors($replacement[0]);
        }

        if (!wasVisible) {
            $replacement.attr('aria-hidden', 'true');
        }
    }

    function handleActionResponse($button, wasVisible, response) {
        if (response && response.messages) {
            updateMessages(response.messages);
        }

        if (!response || typeof response !== 'object') {
            renderFallbackMessage(Backdrop.t('Unexpected response received.'));
            return;
        }

        if (response.status === 'success' && response.toolbar) {
            refreshToolbar(response.toolbar, wasVisible);
        }
        else if (response.status === 'error' && response.message) {
            renderFallbackMessage(response.message);
        }
    }

    function requestAction($button, config, url) {
        if (!url || !config.request || !config.token) {
            return;
        }

        var wasVisible = $('body').hasClass('shortcut-toolbar-visible');

        $button.addClass('shortcut-toolbar__manage-button--busy')
            .attr('aria-busy', 'true')
            .prop('disabled', true);

        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            data: {
                request: config.request,
                token: config.token,
                title: config.title
            }
        })
            .done(function (response) {
                handleActionResponse($button, wasVisible, response);
            })
            .fail(function () {
                renderFallbackMessage(Backdrop.t('There was a problem updating shortcuts.'));
            })
            .always(function () {
                $button.removeClass('shortcut-toolbar__manage-button--busy')
                    .removeAttr('aria-busy')
                    .prop('disabled', false);
            });
    }

    function confirmDisable($button, config) {
        var name = config.title || Backdrop.t('this page');
        var promptText = Backdrop.t('Disable "@title" shortcut?', {
            '@title': name
        });

        if (Backdrop.dialog) {
            var cancelText = Backdrop.t('Cancel');
            var removeText = Backdrop.t('Disable');
            var titleText = Backdrop.t('Disable shortcut');
            var $dialog = $('<div class="shortcut-toolbar__dialog" role="document"></div>');
            $dialog.append($('<p></p>').text(promptText));

            var dialogInstance = Backdrop.dialog($dialog, {
                title: titleText,
                modal: true,
                width: 360,
                dialogClass: 'shortcut-toolbar-dialog',
                close: function () {
                    $dialog.remove();
                },
                buttons: [
                    {
                        text: cancelText,
                        'class': 'button button-secondary',
                        click: function () {
                            dialogInstance.close();
                        }
                    },
                    {
                        text: removeText,
                        'class': 'button button-danger',
                        click: function () {
                            dialogInstance.close();
                            requestAction($button, config, config.disableUrl || config.removeUrl);
                        }
                    }
                ]
            });
            $dialog.closest('.ui-dialog').find('.ui-dialog-buttonset').addClass('shortcut-toolbar-dialog__buttons');

            dialogInstance.showModal();
        }
        else if (window.confirm(promptText)) {
            requestAction($button, config, config.disableUrl || config.removeUrl);
        }
    }

    function handleManageButton(event) {
        var $button = $(this);
        var config = getButtonConfig($button);

        if (config.action === 'add') {
            event.preventDefault();
            requestAction($button, config, config.addUrl);
        }
        else if (config.action === 'enable') {
            event.preventDefault();
            requestAction($button, config, config.addUrl);
        }
        else if (config.action === 'disable' || config.action === 'remove') {
            event.preventDefault();
            confirmDisable($button, config);
        }
    }

    Backdrop.behaviors.shortcutToolbarToggle = {
        attach: function (context) {
            var $body = $('body');
            var $toolbar = $('#shortcut-toolbar');

            if (!$body.length || !$toolbar.length) {
                return;
            }

            var adminBarActive = $body.hasClass('shortcut-toolbar-with-admin-bar');

            if (!state.initialized) {
                state.storageSupported = storageAvailable();
                var storedHidden = state.storageSupported ? window.localStorage.getItem(storageKey) : null;
                var showToolbar = (!adminBarActive || storedHidden !== '1');
                setVisibility(showToolbar, {
                    body: $body,
                    toolbar: $toolbar,
                    toggles: $('[data-shortcut-toggle]'),
                    storage: state.storageSupported && adminBarActive
                }, false);
                state.initialized = true;
            }
            else {
                var canPersist = state.storageSupported && adminBarActive;
                setVisibility($body.hasClass('shortcut-toolbar-visible'), {
                    body: $body,
                    toolbar: $toolbar,
                    toggles: $('[data-shortcut-toggle]'),
                    storage: canPersist
                }, false);
            }

            if (!state.delegated) {
                $(document).on('click.shortcutToggle', '[data-shortcut-toggle]', function (event) {
                    event.preventDefault();
                    var canPersist = state.storageSupported && $body.hasClass('shortcut-toolbar-with-admin-bar');
                    setVisibility(!$body.hasClass('shortcut-toolbar-visible'), {
                        body: $body,
                        toolbar: $toolbar,
                        toggles: $('[data-shortcut-toggle]'),
                        storage: canPersist
                    }, true);
                });
                state.delegated = true;
            }
        }
    };

    Backdrop.behaviors.shortcutToolbarManageActions = {
        attach: function () {
            if (!actionState.bound) {
                $(document).on('click.shortcutManage', '.shortcut-toolbar__manage-button', handleManageButton);
                actionState.bound = true;
            }
        }
    };

})(jQuery, Backdrop, window, document);
