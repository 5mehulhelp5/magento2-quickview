/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
define([
    'jquery',
    'mage/translate',
    'jquery-ui-modules/widget'
], function ($, $t) {
    'use strict';

    /**
     * Amadeco QuickView jQuery UI widget.
     *
     * OPTIMIZATION NOTE:
     * This widget implements a "Double Lazy" strategy to maximize TTI (Time to Interactive):
     * 1. Lazy Rendering: The QuickView button is only injected into the DOM when the product enters the viewport (IntersectionObserver).
     * 2. Lazy Loading: Heavy dependencies (Knockout, Modal, UrlBuilder) are only loaded via RequireJS when the user actually clicks the button.
     *
     * @class
     * @name amadeco.amadecoQuickView
     */
    $.widget('amadeco.amadecoQuickView', {
        /**
         * Widget options.
         * @type {Object}
         */
        options: {
            lazy: true,
            handlerClassName: 'quickview-button',
            modalClass: '#quickview-modal',
            modalTitle: $t('Quick View'),
            btnLabel: $t('Quick View'),
            btnTitle: $t('Quick overview of the product'),
            btnPlacement: 'before',
            enableBtnGoToProduct: true,
            loaderUrl: null,
            selectors: {
                btnContainer: '.product-item-photo-container',
                productItem: '.product-item',
                productPhotoLink: 'a.product.photo',
                priceBox: '[data-role=priceBox]',
                btnContainerClass: 'quickview-btn-container',
                addToCartForm: '#quickview_product_addtocart_form',
                reviewTabSelector: '#tab-label-reviews-title[data-role=trigger]',
                bundleTabLink: '#tab-label-product\\.type\\.bundle\\.options-title',
                bundleButton: '#bundle-slide',
                downloadableLinks: '#downloadable-links-list',
                qtyField: '.box-tocart .field.qty',
                reviewsActions: '.reviews-actions a.view, .reviews-actions a.add',
                htmlOpenModalClass: 'open-modal',
                bodyOpenedClass: 'quickview-opened',
                initializedClass: 'quickview-initialized',
                contentWrapperClass: 'quickview-content-wrapper',
                videoCloseBtn: '.fotorama__video-close.fotorama-show-control',
                dynamicModalTitle: '.quickview-modal-title'
            },
            texts: {
                goToProductText: $t('Go to Product Infos'),
                errorLoading: $t('Unable to load product details. Please try again.')
            }
        },

        /**
         * @private
         * @type {jQuery|null}
         */
        _$modal: null,

        /**
         * @private
         * @type {IntersectionObserver|null}
         */
        _observer: null,

        /**
         * @private
         * @type {jQuery|null}
         */
        _$boundElement: null,

        /**
         * Widget initialization.
         * Only sets up the Observer. Does NOT touch the DOM yet.
         *
         * @private
         * @return {void}
         */
        _create: function () {
            // If lazy loading is enabled and supported, wait for scroll.
            if (this.options.lazy && 'IntersectionObserver' in window) {
                this._setupLazyObserver();
            } else {
                // Fallback for old browsers or if lazy is disabled
                this._initializeButton();
            }
        },

        /**
         * Clean up widget instance.
         *
         * @private
         * @return {void}
         */
        _destroy: function () {
            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }

            // Remove the container we injected
            this.element.find('.' + this.options.selectors.btnContainerClass).remove();
            this.element.removeClass(this.options.selectors.initializedClass);

            this._disposeModalContent();
        },

        /**
         * Setup IntersectionObserver to inject the "Quick View" button only when visible.
         * This reduces initial DOM complexity.
         *
         * @private
         * @return {void}
         */
        _setupLazyObserver: function () {
            var self = this;

            this._observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        self._initializeButton();
                        if (self._observer) {
                            self._observer.disconnect();
                            self._observer = null;
                        }
                    }
                });
            }, {
                rootMargin: '100px' // Pre-load buttons slightly before they appear
            });

            if (this.element && this.element[0]) {
                this._observer.observe(this.element[0]);
            }
        },

        /**
         * Parses product data and injects the QuickView button into the DOM.
         * This is "Phase 1" of the logic: Lightweight DOM manipulation only.
         *
         * @private
         * @return {this}
         */
        _initializeButton: function () {
            var $el = this.element,
                $parent = $el.closest(this.options.selectors.productItem),
                $priceBox = $parent.find(this.options.selectors.priceBox),
                $productLink = $parent.find(this.options.selectors.productPhotoLink),
                productId = $priceBox.attr('data-product-id') || $parent.attr('data-product-id'),
                productHref = $productLink.attr('href');

            if (!productId || $el.hasClass(this.options.selectors.initializedClass)) {
                return this;
            }

            this._createQuickViewButton($el, String(productId), productHref || '');
            $el.addClass(this.options.selectors.initializedClass);

            return this;
        },

        /**
         * Creates the Button wrapped in a Container.
         *
         * @private
         * @param {jQuery} $el - The element context.
         * @param {String} productId - The product entity ID.
         * @param {String} productHref - The product URL.
         * @return {void}
         */
        _createQuickViewButton: function ($el, productId, productHref) {
            var self = this,
                $targetContainer = $el.find(this.options.selectors.btnContainer),
                $wrapperDiv,
                $button;

            if (!$targetContainer.length) {
                $targetContainer = $el;
            }

            // Prevent duplicate buttons
            if ($targetContainer.find('.' + this.options.selectors.btnContainerClass).length) {
                return;
            }

            // 1. Create Wrapper Div
            $wrapperDiv = $('<div>', {
                'class': this.options.selectors.btnContainerClass,
                'data-action': 'quickview'
            });

            // 2. Create Button
            $button = $('<button>', {
                type: 'button',
                title: this.options.btnTitle,
                'class': this.options.handlerClassName,
                'data-product-id': productId,
                'data-product-href': productHref
            }).text(this.options.btnLabel);

            // 3. Assemble
            $wrapperDiv.append($button);

            if (this.options.btnPlacement === 'before') {
                $targetContainer.prepend($wrapperDiv);
            } else {
                $targetContainer.append($wrapperDiv);
            }

            // 4. Bind Event using delegation
            this._on($targetContainer, {
                ['click .' + this.options.handlerClassName]: function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    // Pass the clicked button to the handler
                    self._handleQuickViewClick($(event.currentTarget));
                }
            });
        },

        /**
         * Handle click event on QuickView button.
         * This triggers "Phase 2": Loading heavy dependencies and initializing the Modal.
         *
         * @private
         * @param {jQuery} $button - The clicked button.
         * @return {void}
         */
        _handleQuickViewClick: function ($button) {
            var self = this,
                productId = String($button.data('product-id') || ''),
                productHref = String($button.data('product-href') || '');

            if (!productId) {
                return;
            }

            // Visual feedback that something is happening (optional, but good UX for async loads)
            $button.addClass('disabled').css('cursor', 'wait');

            // HEAVY DEPENDENCY LOADING
            // We load these only when the user explicitly requests the interaction.
            require([
                'Magento_Ui/js/modal/modal',
                'knockout',
                'mage/url',
                'mage/cookies'
            ], function (modal, ko, urlBuilder) {
                // Restore button state
                $button.removeClass('disabled').css('cursor', '');

                // Pass loaded dependencies to the logic methods
                self._loadAndOpenModal(productId, productHref, modal, ko, urlBuilder);
            });
        },

        /**
         * Ensure modal container exists and initialize the widget if needed.
         *
         * @private
         * @param {Function} modalWidget - The loaded Modal widget factory.
         * @param {Array} initialButtons - Footer buttons
         * @return {void}
         */
        _ensureModal: function (modalWidget, initialButtons) {
            var self = this;

            if (!this._$modal) {
                this._$modal = $(this.options.modalClass);
            }

            if (!this._$modal.length) {
                console.warn('QuickView: Modal container not found. Check "modalClass" option.');
                return;
            }

            if (this._$modal.data('mageModal')) {
                return;
            }

            // Initialize the Magento Modal
            modalWidget({
                type: 'popup',
                modalClass: 'amadeco-quickview',
                responsive: true,
                innerScroll: true,
                title: this.options.modalTitle,
                buttons: initialButtons || [],
                closed: function () {
                    self._onModalClose();
                }
            }, this._$modal);
        },

        /**
         * Perform AJAX request and open modal.
         *
         * @private
         * @param {String} productId
         * @param {String} productHref
         * @param {Function} modal - The modal factory.
         * @param {Object} ko - KnockoutJS instance.
         * @param {Object} urlBuilder - Magento URL builder.
         * @return {void}
         */
        _loadAndOpenModal: function (productId, productHref, modal, ko, urlBuilder) {
            var formKey = $.mage.cookies.get('form_key') || '',
                loaderSrc = this.options.loaderUrl,
                buttons = [];

            // 1. Prepare buttons
            if (this.options.enableBtnGoToProduct && productHref) {
                buttons.push({
                    text: this.options.texts.goToProductText,
                    class: 'action secondary',
                    click: function () {
                        window.location.href = productHref;
                    }
                });
            }

            // 2. Ensure Modal is initialized (using the passed dependency)
            this._ensureModal(modal, buttons);

            if (!this._$modal.length) return;

            // Reset modal title to default before loading new content
            this._$modal.modal('setTitle', this.options.modalTitle);

            // 3. Open Modal
            this._$modal.modal('openModal');
            $('html').addClass(this.options.selectors.htmlOpenModalClass);
            $('body').addClass(this.options.selectors.bodyOpenedClass);

            // 4. Show Loader
            if (loaderSrc !== null) {
                this._$modal.html(
                    '<div class="loading-mask" style="display:block; position:static;">' +
                    '   <div class="loader">' +
                    '       <img alt="' + $t('Loading...') + '" src="' + loaderSrc + '">' +
                    '   </div>' +
                    '</div>'
                );
            }

            // 5. Fetch Data
            $.ajax({
                url: urlBuilder.build('quickview/index/view'),
                data: {
                    id: productId,
                    form_key: formKey
                },
                type: 'POST',
                dataType: 'html',
                showLoader: false,
                context: this
            }).done(function (html) {
                // Pass dependencies down the chain
                this._renderModalContent(html, formKey, ko);

                this._bindProductSpecificEvents();
            }).fail(function () {
                this._renderModalContent(
                    '<div class="message error"><div>' + this.options.texts.errorLoading + '</div></div>',
                    formKey,
                    ko
                );
            });
        },

        /**
         * Renders the modal content, triggers binding and form key injection.
         *
         * @private
         * @param {String} html - The HTML content to inject.
         * @param {String} formKey - The current session form key.
         * @param {Object} ko - KnockoutJS instance.
         * @return {void}
         */
        _renderModalContent: function (html, formKey, ko) {
            var $wrapper,
                $tempHtml = $('<div>').html(html),
                $customTitle = $tempHtml.find(this.options.selectors.dynamicModalTitle);

            // Check for custom title element and update modal title if found
            if ($customTitle.length) {
                var newTitle = $customTitle.text();
                if (newTitle) {
                    this._$modal.modal('setTitle', newTitle);
                }
                // Remove the title element from content
                $customTitle.remove();
                html = $tempHtml.html();
            }

            this._disposeModalContent(ko);

            // 1. Wrap content to create a fresh Scope for Knockout
            $wrapper = $('<div>', {
                'class': this.options.selectors.contentWrapperClass
            }).html(html);

            // 2. Inject into DOM
            this._$modal.html($wrapper);
            this._$boundElement = $wrapper;

            // 3. Trigger Magento Widget Initialization (swatches, gallery, etc)
            $wrapper.trigger('contentUpdated');

            // 4. Trigger Knockout Bindings safely on the wrapper
            try {
                if ($wrapper.find('[data-bind]').length) {
                    ko.applyBindings({}, $wrapper[0]);
                }
            } catch (e) {
                console.error('QuickView: KO Binding Error:', e);
            }

            // 5. Inject Form Key
            this._bindProductAddToCart(formKey);
        },

        /**
         * Handle modal close event.
         *
         * @private
         * @return {void}
         */
        _onModalClose: function () {
            var $videoCloseBtn;

            $('html').removeClass(this.options.selectors.htmlOpenModalClass);
            $('body').removeClass(this.options.selectors.bodyOpenedClass);

            // Remove video close button if fotorama left it
            $videoCloseBtn = $(this.options.selectors.videoCloseBtn);
            if ($videoCloseBtn.length) {
                $videoCloseBtn.remove();
            }

            // Note: We cannot easily access 'ko' here without storing it globally or on the instance.
            // For now, _disposeModalContent handles the DOM cleanup.
            // In a strict environment, we would store `this._ko = ko` during the require phase.
            this._disposeModalContent();
        },

        /**
         * Clean up Knockout bindings and remove modal content.
         *
         * @private
         * @param {Object} [koInstance] - Optional KO instance if available.
         * @return {void}
         */
        _disposeModalContent: function (koInstance) {
            // Attempt to resolve KO from global if not passed (fallback)
            // or if stored on instance (advanced pattern not implemented here for simplicity)
            var ko = koInstance || require.s.contexts._.defined['knockout'];

            if (this._$boundElement && this._$boundElement.length && ko) {
                try {
                    ko.cleanNode(this._$boundElement[0]);
                } catch (e) {
                    // Ignore clean node errors
                }
            }

            this._$boundElement = null;
            if (this._$modal && this._$modal.length) {
                this._$modal.empty();
            }
        },

        /**
         * Bind events for specific product types (Bundle, Downloadable, Reviews).
         *
         * @private
         * @return {void}
         */
        _bindProductSpecificEvents: function () {
            this._bindProductBundle();
            this._bindProductDownloadable();
            this._bindProductReviews();
        },

        /**
         * Handle Bundle product specific logic.
         *
         * @private
         * @return {void}
         */
        _bindProductBundle: function () {
            var $bundleBtn = this._$modal.find(this.options.selectors.bundleButton),
                $bundleTabLink = this._$modal.find(this.options.selectors.bundleTabLink);

            if ($bundleBtn.length && $bundleTabLink.length) {
                $bundleTabLink.parent().hide();
                this._on($bundleBtn, {
                    'click': function (event) {
                        event.preventDefault();
                        $bundleTabLink.parent().show();
                        $bundleTabLink.trigger('click');
                    }
                });
            }
        },

        /**
         * Handle Downloadable product specific logic.
         *
         * @private
         * @return {void}
         */
        _bindProductDownloadable: function () {
            if (this._$modal.find(this.options.selectors.downloadableLinks).length) {
                this._$modal.find(this.options.selectors.qtyField).hide();
            }
        },

        /**
         * Handle Review tab logic inside modal.
         *
         * @private
         * @return {void}
         */
        _bindProductReviews: function () {
            var $reviewsTabLink = this._$modal.find(this.options.selectors.reviewTabSelector),
                $reviewsActions = this._$modal.find(this.options.selectors.reviewsActions);

            if ($reviewsTabLink.length && $reviewsActions.length) {
                this._on($reviewsActions, {
                    'click': function (event) {
                        var href = String($(event.currentTarget).attr('href') || '');

                        if (href.indexOf('#') !== -1) {
                            event.preventDefault();
                        }

                        $reviewsTabLink.trigger('click');
                    }
                });
            }
        },

        /**
         * Inject form key into the Add To Cart form.
         *
         * @private
         * @param {String} formKey
         * @return {void}
         */
        _bindProductAddToCart: function (formKey) {
            var $form;

            if (!formKey) {
                return;
            }

            $form = this._$modal.find(this.options.selectors.addToCartForm);

            if ($form.length && !$form.find('input[name="form_key"]').length) {
                $('<input/>', {
                    type: 'hidden',
                    name: 'form_key',
                    value: formKey
                }).prependTo($form);
            }
        }
    });

    return $.amadeco.amadecoQuickView;
});