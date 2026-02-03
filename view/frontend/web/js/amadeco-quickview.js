/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
define([
    'jquery',
    'mage/url',
    'mage/translate',
    'Magento_Ui/js/modal/modal',
    'knockout',
    'mage/apply/main',
    'jquery-ui-modules/widget',
    'mage/cookies',
    'mage/applyBindings'
], function ($, urlBuilder, $t, modal, ko, mageApply) {
    'use strict';

    /**
     * Amadeco QuickView jQuery UI widget.
     *
     * Responsibilities:
     * - Inject a Quick View button inside product tiles
     * - Load product HTML via AJAX into a modal
     * - Re-run Magento init (data-mage-init / x-magento-init) on injected content
     * - Apply Knockout bindings via Magento's applyBindings() helper (when KO markup is present)
     *
     * @class
     * @name amadeco.amadecoQuickView
     */
    $.widget('amadeco.amadecoQuickView', {
        /**
         * Widget options.
         *
         * @type {Object}
         */
        options: {
            /**
             * Enables lazy initialization through IntersectionObserver.
             *
             * @type {Boolean}
             */
            lazy: true,

            /**
             * Button class added to the Quick View button.
             *
             * @type {String}
             */
            handlerClassName: 'quickview-button',

            /**
             * Modal container selector.
             *
             * @type {String}
             */
            modalClass: '#quickview-modal',

            /**
             * Modal title label.
             *
             * @type {String}
             */
            modalTitle: $t('Quick View'),

            /**
             * Button visible label.
             *
             * @type {String}
             */
            btnLabel: $t('Quick View'),

            /**
             * Button title attribute.
             *
             * @type {String}
             */
            btnTitle: $t('Quick overview of the product'),

            /**
             * Button placement in the container.
             * Allowed: "before" | "after"
             *
             * @type {String}
             */
            btnPlacement: 'before',

            /**
             * Enables the "Go To Product" modal button.
             *
             * @type {Boolean}
             */
            enableBtnGoToProduct: true,

            /**
             * DOM selectors.
             *
             * @type {Object<string, string>}
             */
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
                initializedClass: 'quickview-initialized'
            },

            /**
             * Translatable UI texts.
             *
             * @type {Object<string, string>}
             */
            texts: {
                goToProductText: $t('Go To Product'),
                errorLoading: $t('Unable to load product details. Please try again.')
            }
        },

        /**
         * Modal root container.
         *
         * @private
         * @type {jQuery|null}
         */
        _$modal: null,

        /**
         * Intersection observer instance for lazy init.
         *
         * @private
         * @type {IntersectionObserver|null}
         */
        _observer: null,

        /**
         * Tracks whether KO bindings were applied for the current modal content.
         *
         * @private
         * @type {Boolean}
         */
        _hasAppliedBindings: false,

        /**
         * Initializes widget.
         *
         * @private
         * @return {void}
         */
        _create: function () {
            this._$modal = $(this.options.modalClass);

            if (!this._$modal.length) {
                return;
            }

            if (this.options.lazy && 'IntersectionObserver' in window) {
                this._setupLazyObserver();
                return;
            }

            this._initialize();
        },

        /**
         * Disconnects observers and removes event handlers.
         *
         * @private
         * @return {void}
         */
        _destroy: function () {
            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }

            this.element.removeClass(this.options.selectors.initializedClass);
            this._disposeModalContent();
        },

        /**
         * Sets up lazy initialization using IntersectionObserver.
         *
         * @private
         * @return {void}
         */
        _setupLazyObserver: function () {
            var self = this;

            this._observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        self._initialize();
                        self._observer.disconnect();
                        self._observer = null;
                    }
                });
            }, {
                rootMargin: '200px'
            });

            if (this.element && this.element[0]) {
                this._observer.observe(this.element[0]);
            }
        },

        /**
         * Creates the Quick View button for the current widget element if possible.
         *
         * @private
         * @return {this}
         */
        _initialize: function () {
            var $el = this.element,
                $parent = $el.closest(this.options.selectors.productItem),
                $priceBox = $parent.find(this.options.selectors.priceBox),
                productId = $priceBox.attr('data-product-id') || $parent.attr('data-product-id'),
                $productLink = $parent.find(this.options.selectors.productPhotoLink),
                productHref = $productLink.attr('href');

            if (!productId || $el.hasClass(this.options.selectors.initializedClass)) {
                return this;
            }

            this._createQuickViewButton($el, String(productId), productHref || '');
            $el.addClass(this.options.selectors.initializedClass);

            return this;
        },

        /**
         * Creates the Quick View button markup and binds delegated events.
         *
         * @private
         * @param {jQuery} $el - Widget root element.
         * @param {String} productId - Product entity ID.
         * @param {String} productHref - Product URL.
         * @return {void}
         */
        _createQuickViewButton: function ($el, productId, productHref) {
            var self = this,
                $btnContainer = $el.find(this.options.selectors.btnContainer);

            if (!$btnContainer.length) {
                $btnContainer = $el;
            }

            if ($btnContainer.find('.' + this.options.selectors.btnContainerClass).length) {
                return;
            }

            $btnContainer.addClass(this.options.selectors.btnContainerClass);

            $btnContainer.append(
                $('<button/>', {
                    type: 'button',
                    title: this.options.btnTitle,
                    'class': this.options.handlerClassName,
                    'data-product-id': productId,
                    'data-product-href': productHref
                }).text(this.options.btnLabel)
            );

            if (this.options.btnPlacement === 'before') {
                $btnContainer.prepend($btnContainer.children().last());
            }

            this._off($btnContainer, 'click.quickview');
            this._on($btnContainer, {
                /**
                 * Handles click on the injected Quick View button.
                 *
                 * @param {jQuery.Event} event - Click event.
                 * @return {void}
                 */
                'click.quickview .' + this.options.handlerClassName: function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    self._handleQuickViewClick($(event.currentTarget));
                }
            });
        },

        /**
         * Handles Quick View button click.
         *
         * @private
         * @param {jQuery} $button - The clicked button element.
         * @return {void}
         */
        _handleQuickViewClick: function ($button) {
            var productId = String($button.data('product-id') || ''),
                productHref = String($button.data('product-href') || ''),
                formKey = this._getFormKey();

            if (!productId) {
                return;
            }

            this._loadAndOpenModal(productId, productHref, formKey);
        },

        /**
         * Retrieves the form_key from Magento cookies.
         *
         * @private
         * @return {String} Cookie value or empty string.
         */
        _getFormKey: function () {
            if ($.mage && $.mage.cookies && typeof $.mage.cookies.get === 'function') {
                return String($.mage.cookies.get('form_key') || '');
            }

            return '';
        },

        /**
         * Loads the modal HTML and opens the modal.
         *
         * @private
         * @param {String} productId - Product entity ID.
         * @param {String} productHref - Product URL.
         * @param {String} formKey - CSRF form key.
         * @return {void}
         */
        _loadAndOpenModal: function (productId, productHref, formKey) {
            var self = this;

            $.ajax({
                url: urlBuilder.build('quickview/index/view'),
                data: {
                    id: productId,
                    form_key: formKey
                },
                type: 'POST',
                dataType: 'html',
                showLoader: true
            }).done(function (html) {
                self._renderModalContent(html, formKey);
                self._bindProductBundle();
                self._bindProductDownloadable();
                self._bindProductReviews();
                self._bindProductAddToCart(formKey);
                self._openQuickViewModal(productHref);
            }).fail(function () {
                self._renderModalContent(
                    '<div class="message error"><div>' + self.options.texts.errorLoading + '</div></div>',
                    formKey
                );
                self._openQuickViewModal(productHref);
            });
        },

        /**
         * Injects HTML in the modal container, then re-applies Magento JS init and KO bindings if needed.
         *
         * Note:
         * - `mageApply()` executes data-mage-init and x-magento-init within the given context.
         * - `applyBindings()` is Magento's jQuery helper to (re)bind Knockout on dynamically injected content.
         *
         * @private
         * @param {String} html - Modal HTML content.
         * @param {String} formKey - CSRF form key.
         * @return {void}
         */
        _renderModalContent: function (html, formKey) {
            this._disposeModalContent();

            this._$modal.html(html);

            // 1) Run Magento init for widgets/components declared in the returned HTML.
            mageApply(this._$modal);

            // 2) Apply KO bindings ONLY when KO markup exists in this injected content.
            this._applyKnockoutBindings();

            // 3) Ensure form_key exists for add-to-cart usage inside the modal HTML.
            this._bindProductAddToCart(formKey);
        },

        /**
         * Applies Knockout bindings using Magento's jQuery helper when KO markup is present.
         *
         * This enables blocks that rely on UI Components / KO (estimate rates, swatches, etc.)
         * without hardcoding individual initializers.
         *
         * @private
         * @return {void}
         */
        _applyKnockoutBindings: function () {
            var hasKoMarkup;

            if (this._hasAppliedBindings || !this._$modal || !this._$modal.length) {
                return;
            }

            hasKoMarkup = this._$modal.find('[data-bind]').length > 0;

            if (!hasKoMarkup || typeof this._$modal.applyBindings !== 'function') {
                return;
            }

            this._$modal.applyBindings();
            this._hasAppliedBindings = true;
        },

        /**
         * Opens the Magento modal and updates page state classes.
         *
         * @private
         * @param {String} productHref - Product URL for the "Go To Product" action.
         * @return {void}
         */
        _openQuickViewModal: function (productHref) {
            var self = this,
                optionsModal = {
                    type: 'popup',
                    responsive: true,
                    innerScroll: true,
                    title: this.options.modalTitle,
                    buttons: [],
                    /**
                     * Called when the modal closes.
                     *
                     * @return {void}
                     */
                    closed: function () {
                        self._onModalClose();
                    }
                };

            this._addGoToProductButton(optionsModal, productHref);

            modal(optionsModal, this._$modal);

            this._$modal.modal('openModal');

            $('html').addClass(this.options.selectors.htmlOpenModalClass);
            $('body').addClass(this.options.selectors.bodyOpenedClass);
        },

        /**
         * Adds the optional "Go To Product" button to modal options.
         *
         * @private
         * @param {Object} optionsModal - Magento modal options.
         * @param {String} productHref - Product URL.
         * @return {void}
         */
        _addGoToProductButton: function (optionsModal, productHref) {
            if (!this.options.enableBtnGoToProduct || !productHref) {
                return;
            }

            optionsModal.buttons.push({
                text: this.options.texts.goToProductText,
                class: 'action secondary',
                /**
                 * Navigates to the product page.
                 *
                 * @return {void}
                 */
                click: function () {
                    window.location.href = productHref;
                }
            });
        },

        /**
         * Modal close callback. Cleans up KO bindings and content.
         *
         * @private
         * @return {void}
         */
        _onModalClose: function () {
            $('html').removeClass(this.options.selectors.htmlOpenModalClass);
            $('body').removeClass(this.options.selectors.bodyOpenedClass);

            this._disposeModalContent();
        },

        /**
         * Disposes modal content safely (KO clean + HTML reset).
         *
         * @private
         * @return {void}
         */
        _disposeModalContent: function () {
            if (!this._$modal || !this._$modal.length) {
                return;
            }

            try {
                ko.cleanNode(this._$modal[0]);
            } catch (e) {
                // Intentionally silent: modal content may have no KO bindings.
            }

            this._$modal.empty();
            this._hasAppliedBindings = false;
        },

        /**
         * Binds bundle logic if present (shows bundle tab on button click).
         *
         * @private
         * @return {void}
         */
        _bindProductBundle: function () {
            var $bundleBtn = this._$modal.find(this.options.selectors.bundleButton),
                $bundleTabLink = this._$modal.find(this.options.selectors.bundleTabLink);

            if (!$bundleBtn.length || !$bundleTabLink.length) {
                return;
            }

            $bundleTabLink.parent().hide();

            this._off($bundleBtn, 'click.qvBundle');
            this._on($bundleBtn, {
                /**
                 * Shows bundle tab and triggers tab click.
                 *
                 * @param {jQuery.Event} event - Click event.
                 * @return {void}
                 */
                'click.qvBundle': function (event) {
                    event.preventDefault();
                    $bundleTabLink.parent().show();
                    $bundleTabLink.trigger('click');
                }
            });
        },

        /**
         * Hides quantity field for downloadable products.
         *
         * @private
         * @return {void}
         */
        _bindProductDownloadable: function () {
            if (!this._$modal.find(this.options.selectors.downloadableLinks).length) {
                return;
            }

            this._$modal.find(this.options.selectors.qtyField).hide();
        },

        /**
         * Ensures review action links trigger the reviews tab in the modal.
         *
         * @private
         * @return {void}
         */
        _bindProductReviews: function () {
            var $reviewsTabLink = this._$modal.find(this.options.selectors.reviewTabSelector),
                $reviewsActions = this._$modal.find(this.options.selectors.reviewsActions);

            if (!$reviewsTabLink.length || !$reviewsActions.length) {
                return;
            }

            this._off($reviewsActions, 'click.qvReviews');
            this._on($reviewsActions, {
                /**
                 * Switches to the reviews tab when a review action is clicked.
                 *
                 * @param {jQuery.Event} event - Click event.
                 * @return {void}
                 */
                'click.qvReviews': function (event) {
                    var href = String($(event.currentTarget).attr('href') || '');

                    if (href.indexOf('#') !== -1) {
                        event.preventDefault();
                    }

                    $reviewsTabLink.trigger('click');
                }
            });
        },

        /**
         * Ensures the add-to-cart form inside the modal contains a valid form_key input.
         *
         * @private
         * @param {String} formKey - CSRF form key.
         * @return {void}
         */
        _bindProductAddToCart: function (formKey) {
            var $form;

            if (!formKey) {
                return;
            }

            $form = this._$modal.find(this.options.selectors.addToCartForm);

            if (!$form.length) {
                return;
            }

            if ($form.find('input[name="form_key"]').length) {
                return;
            }

            $('<input/>', {
                type: 'hidden',
                name: 'form_key',
                value: formKey
            }).prependTo($form);
        }
    });

    return $.amadeco.amadecoQuickView;
});
