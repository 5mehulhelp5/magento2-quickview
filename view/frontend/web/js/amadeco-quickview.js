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
    'jquery-ui-modules/widget',
    'mage/cookies',
    'knockout'
], function ($, urlBuilder, $t, modal, widget, cookies, ko) {
    'use strict';

    $.widget('amadeco.amadecoQuickView', {
        options: {
            lazy: true,
            handlerClassName: 'quickview-button',
            modalClass: '#quickview-modal',
            modalTitle: $t('Quick View'),
            btnLabel: $t('Quick View'),
            btnTitle: $t('Quick overview of the product'),
            btnPlacement: 'before',
            enableBtnGoToProduct: true,
            selectors: {
                btnContainer: '.product-item-photo-container',
                productItem: '.product-item',
                productPhotoLink: 'a.product.photo',
                priceBox: '[data-role=priceBox]',
                btnContainerClass: 'quickview-btn-container',
                addToCartForm: '#quickview_product_addtocart_form',
                addToCartButton: '.action.tocart',
                reviewTabSelector: '#tab-label-reviews-title[data-role=trigger]',
                bundleTabLink: '#tab-label-product\\.type\\.bundle\\.options-title',
                bundleButton: '#bundle-slide',
                downloadableLinks: '#downloadable-links-list',
                qtyField: '.box-tocart .field.qty',
                reviewsActions: '.reviews-actions a.view, .reviews-actions a.add',
                // estimateRates selector REMOVED - handled generically now
                videoCloseBtn: '.fotorama__video-close.fotorama-show-control',
                htmlOpenModalClass: 'open-modal',
                bodyOpenedClass: 'quickview-opened',
                initializedClass: 'quickview-initialized',
                disabledClass: 'quickview-disabled'
            },
            texts: {
                goToProductText: $t('Go To Product'),
                errorLoading: $t('Unable to load product details. Please try again.')
            }
        },

        /**
         * @private
         * @type {jQuery}
         */
        _$modal: null,

        /**
         * @private
         * @type {IntersectionObserver}
         */
        _observer: null,

        /**
         * @private
         */
        _create: function () {
            this._$modal = $(this.options.modalClass);

            if (this.options.lazy && 'IntersectionObserver' in window) {
                this._setupLazyObserver();
            } else {
                this._initialize();
            }
        },

        /**
         * @private
         */
        _setupLazyObserver: function () {
            var self = this;

            this._observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        self._initialize();
                        self._observer.disconnect();
                    }
                });
            }, {
                rootMargin: '200px'
            });

            this._observer.observe(this.element[0]);
        },

        /**
         * @private
         * @return {Object}
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

            this._createQuickViewButton($el, productId, productHref);
            $el.addClass(this.options.selectors.initializedClass);

            return this;
        },

        /**
         * @private
         * @param {jQuery} $el
         * @param {String} productId
         * @param {String} productHref
         */
        _createQuickViewButton: function ($el, productId, productHref) {
            var self = this,
                $btnContainer = $el.find(this.options.selectors.btnContainer);

            if (!$btnContainer.length) {
                $btnContainer = $el;
            }

            var $wrapper = $('<div/>', {
                'class': this.options.selectors.btnContainerClass,
                'data-action': 'quickview'
            });

            var $button = $('<button/>', {
                'type': 'button',
                'title': this.options.btnTitle,
                'class': this.options.handlerClassName,
                'data-product-id': productId,
                'data-product-href': productHref
            }).text(this.options.btnLabel);

            $button.appendTo($wrapper);

            if (this.options.btnPlacement === 'before') {
                $btnContainer.prepend($wrapper);
            } else {
                $btnContainer.append($wrapper);
            }

            $wrapper.on('click touch', '.' + this.options.handlerClassName, function (e) {
                e.preventDefault();
                e.stopPropagation();
                self._handleQuickViewClick($(e.currentTarget));
            });
        },

        /**
         * @private
         * @param {jQuery} $button
         */
        _handleQuickViewClick: function ($button) {
            var self = this,
                productId = $button.data('product-id'),
                productHref = $button.data('product-href'),
                formKey = $.mage.cookies.get('form_key');

            if (!productId) {
                return;
            }

            var optionsModal = {
                type: 'popup',
                responsive: true,
                innerScroll: true,
                title: this.options.modalTitle,
                buttons: [],
                closed: function () {
                    self._onModalClose();
                }
            };

            $.ajax({
                url: urlBuilder.build('quickview/index/view'),
                data: {
                    id: productId,
                    form_key: formKey
                },
                type: 'POST',
                dataType: 'html',
                showLoader: true,
                cache: true
            }).done(function (data) {
                self._$modal.html(data).trigger('contentUpdated');

                // Smartly bind ANY Knockout content (Estimate rates, swatches, etc.)
                self._applyKnockoutBindings();

                self._bindProductBundle();
                self._bindProductDownloadable();
                self._bindProductReviews();
                self._bindProductAddToCart(formKey);

                self._addGoToProductButton(optionsModal, productHref);
                self._openQuickViewModal(optionsModal);

            }).fail(function () {
                alert(self.options.texts.errorLoading);
            });
        },

        /**
         * Smartly applies Knockout bindings to the modal container.
         * This removes the need to manually search for specific blocks like Estimate Rates.
         *
         * @private
         */
        _applyKnockoutBindings: function () {
            try {
                // Only apply if the node isn't already bound
                if (!ko.dataFor(this._$modal[0])) {
                    ko.applyBindings({}, this._$modal[0]);
                }
            } catch (e) {
                // Suppress binding errors in production to avoid UI breakage
                if (window.console && console.warn) {
                    console.warn('QuickView KO Binding:', e);
                }
            }
        },

        /**
         * @private
         * @param {Object} optionsModal
         * @param {String} productHref
         */
        _addGoToProductButton: function (optionsModal, productHref) {
            if (this.options.enableBtnGoToProduct && productHref) {
                optionsModal.buttons.push({
                    text: this.options.texts.goToProductText,
                    class: 'action secondary',
                    click: function () {
                        window.location.href = productHref;
                    }
                });
            }
        },

        /**
         * @private
         * @param {Object} optionsModal
         */
        _openQuickViewModal: function (optionsModal) {
            this._$modal.modal(optionsModal).modal('openModal');
            $('html').addClass(this.options.selectors.htmlOpenModalClass);
            $('body').addClass(this.options.selectors.bodyOpenedClass);
        },

        /**
         * Cleans up the modal when closed.
         * Essential for Knockout memory management.
         *
         * @private
         */
        _onModalClose: function () {
            $('html').removeClass(this.options.selectors.htmlOpenModalClass);
            $('body').removeClass(this.options.selectors.bodyOpenedClass);

            // Clean Knockout bindings to prevent collisions on next open
            try {
                ko.cleanNode(this._$modal[0]);
            } catch (e) {}

            this._$modal.empty();
        },

        /**
         * @private
         */
        _bindProductBundle: function () {
            var $bundleBtn = this._$modal.find(this.options.selectors.bundleButton),
                $bundleTabLink = this._$modal.find(this.options.selectors.bundleTabLink);

            if ($bundleBtn.length && $bundleTabLink.length) {
                $bundleTabLink.parent().hide();
                $bundleBtn.off('click.qvBundle').on('click.qvBundle', function (e) {
                    e.preventDefault();
                    $bundleTabLink.parent().show();
                    $bundleTabLink.trigger('click');
                });
            }
        },

        /**
         * @private
         */
        _bindProductDownloadable: function () {
            if (this._$modal.find(this.options.selectors.downloadableLinks).length) {
                this._$modal.find(this.options.selectors.qtyField).hide();
            }
        },

        /**
         * @private
         */
        _bindProductReviews: function () {
            var $reviewsTabLink = this._$modal.find(this.options.selectors.reviewTabSelector),
                $reviewsActions = this._$modal.find(this.options.selectors.reviewsActions);

            if ($reviewsTabLink.length && $reviewsActions.length) {
                $reviewsActions.on('click', function (e) {
                    if ($(this).attr('href').indexOf('#') !== -1) {
                        e.preventDefault();
                    }
                    $reviewsTabLink.trigger('click');
                });
            }
        },

        /**
         * @private
         * @param {String} formKey
         */
        _bindProductAddToCart: function (formKey) {
            var $form = this._$modal.find(this.options.selectors.addToCartForm);
            if ($form.length && formKey) {
                if ($form.find('input[name="form_key"]').length === 0) {
                    $('<input/>', {
                        type: 'hidden',
                        name: 'form_key',
                        value: formKey
                    }).prependTo($form);
                }
            }
        }
    });

    return $.amadeco.amadecoQuickView;
});
