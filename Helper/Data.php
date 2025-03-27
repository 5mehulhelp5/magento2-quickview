<?php
/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\QuickView\Helper;

use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Framework\App\Helper\Context;
use Magento\Store\Model\ScopeInterface;

/**
 * QuickView helper
 */
class Data extends AbstractHelper
{
    /**
     * General configuration paths
     */
    private const XML_PATH_QUICKVIEW_ENABLE = 'quickview/general/enable';
    private const XML_PATH_QUICKVIEW_ELEMENTS_SELECTOR = 'quickview/general/elements_selector';
    private const XML_PATH_QUICKVIEW_BUTTON_CONTAINER_SELECTOR = 'quickview/general/btn_container';
    private const XML_PATH_QUICKVIEW_BUTTON_LABEL = 'quickview/general/btn_label';

    /**
     * Modal configuration paths
     */
    private const XML_PATH_QUICKVIEW_MODAL_TITLE = 'quickview/modal/modal_title';
    private const XML_PATH_QUICKVIEW_SHOW_BUTTON_GO_DETAIL = 'quickview/modal/show_button_go_detail';

    /**
     * Selectors configuration paths
     */
    private const XML_PATH_QUICKVIEW_REVIEW_TAB = 'quickview/selectors/review_tab';
    private const XML_PATH_QUICKVIEW_TAB_TITLE_CLASS = 'quickview/selectors/tab_title_class';
    private const XML_PATH_QUICKVIEW_TAB_CONTENT_CLASS = 'quickview/selectors/tab_content_class';

    /**
     * Replacements configuration paths
     */
    private const XML_PATH_QUICKVIEW_WRAPPER_IDENTIFIER = 'quickview/replacements/wrapper_identifier';
    private const XML_PATH_QUICKVIEW_GALLERY_PLACEHOLDER = 'quickview/replacements/gallery_placeholder';
    private const XML_PATH_QUICKVIEW_GALLERY_PLACEHOLDER_ALT = 'quickview/replacements/gallery_placeholder_alt';
    private const XML_PATH_QUICKVIEW_SWATCH_OPTIONS = 'quickview/replacements/swatch_options';
    private const XML_PATH_QUICKVIEW_SWATCH_OPTIONS_ALT = 'quickview/replacements/swatch_options_alt';
    private const XML_PATH_QUICKVIEW_ADDTOCART_FORM = 'quickview/replacements/addtocart_form';
    private const XML_PATH_QUICKVIEW_ADDTOCART_BUTTON = 'quickview/replacements/addtocart_button';
    private const XML_PATH_QUICKVIEW_SWATCH_PRODUCT_SELECTOR = 'quickview/replacements/swatch_product_selector';
    private const XML_PATH_QUICKVIEW_CUSTOM_REPLACEMENTS = 'quickview/replacements/custom_replacements';

    /**
     * @var Context
     */
    protected readonly Context $_context;

    /**
     * @param Context $context
     */
    public function __construct(
        Context $context
    ) {
        $this->_context = $context;
        parent::__construct($context);
    }

    /**
     * Check if module is enabled
     *
     * @return bool
     */
    public function isEnabled(): bool
    {
        return $this->scopeConfig->isSetFlag(self::XML_PATH_QUICKVIEW_ENABLE, ScopeInterface::SCOPE_STORE);
    }

    /**
     * Get CSS elements selector
     *
     * @return string
     */
    public function getElementsSelector(): string
    {
        return (string)$this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_ELEMENTS_SELECTOR,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get button container selector
     *
     * @return string
     */
    public function getButtonContainerSelector(): string
    {
        $selector = $this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_BUTTON_CONTAINER_SELECTOR,
            ScopeInterface::SCOPE_STORE
        );

        return $selector ?: '.product-item-info';
    }

    /**
     * Get button label
     *
     * @return string
     */
    public function getButtonLabel(): string
    {
        return (string)$this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_BUTTON_LABEL,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get modal title
     *
     * @return string
     */
    public function getModalTitle(): string
    {
        return (string)$this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_MODAL_TITLE,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Check if "Go to product" button should be shown
     *
     * @return bool
     */
    public function showButtonGoDetail(): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_QUICKVIEW_SHOW_BUTTON_GO_DETAIL,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get wrapper identifier
     *
     * @return string
     */
    public function getWrapperIdentifier(): string
    {
        $identifier = $this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_WRAPPER_IDENTIFIER,
            ScopeInterface::SCOPE_STORE
        );

        return $identifier ?: 'quickview-wrapper';
    }

    /**
     * Get review tab selector
     *
     * @return string
     */
    public function getReviewTabSelector(): string
    {
        $selector = $this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_REVIEW_TAB,
            ScopeInterface::SCOPE_STORE
        );

        return $selector ?: '#tab-label-reviews-title[data-role=trigger]';
    }

    /**
     * Get tab title class
     *
     * @return string
     */
    public function getTabTitleClass(): string
    {
        $class = $this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_TAB_TITLE_CLASS,
            ScopeInterface::SCOPE_STORE
        );

        return $class ?: '.quickview-tab-title';
    }

    /**
     * Get tab content class
     *
     * @return string
     */
    public function getTabContentClass(): string
    {
        $class = $this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_TAB_CONTENT_CLASS,
            ScopeInterface::SCOPE_STORE
        );

        return $class ?: '.quickview-tab-content';
    }

    /**
     * Get all selectors as array
     *
     * @return array
     */
    public function getAllSelectors(): array
    {
        return [
            'reviewTabSelector' => $this->getReviewTabSelector(),
            'tabTitleClass' => $this->getTabTitleClass(),
            'tabContentClass' => $this->getTabContentClass()
        ];
    }

    /**
     * Get identifier replacements
     *
     * @return array
     */
    public function getIdentifierReplacements(): array
    {
        $replacements = [];

        // Récupérer les remplacements configurés
        $configPaths = [
            self::XML_PATH_QUICKVIEW_GALLERY_PLACEHOLDER,
            self::XML_PATH_QUICKVIEW_GALLERY_PLACEHOLDER_ALT,
            self::XML_PATH_QUICKVIEW_SWATCH_OPTIONS,
            self::XML_PATH_QUICKVIEW_SWATCH_OPTIONS_ALT,
            self::XML_PATH_QUICKVIEW_ADDTOCART_FORM,
            self::XML_PATH_QUICKVIEW_ADDTOCART_BUTTON
        ];

        foreach ($configPaths as $path) {
            $value = $this->scopeConfig->getValue($path, ScopeInterface::SCOPE_STORE);
            if ($value) {
                $parts = explode('=>', $value, 2);
                if (count($parts) === 2) {
                    $replacements[trim($parts[0])] = trim($parts[1]);
                }
            }
        }

        // Cas spécial pour swatch-renderer
        $selectorValue = $this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_SWATCH_PRODUCT_SELECTOR,
            ScopeInterface::SCOPE_STORE
        );

        if ($selectorValue) {
            $replacements['"Magento_Swatches/js/swatch-renderer": {'] =
                '"Magento_Swatches/js/swatch-renderer": {' . PHP_EOL .
                '    "selectorProduct": "' . $selectorValue . '",';
        }

        // Ajouter les remplacements personnalisés
        $customReplacements = $this->scopeConfig->getValue(
            self::XML_PATH_QUICKVIEW_CUSTOM_REPLACEMENTS,
            ScopeInterface::SCOPE_STORE
        );

        if ($customReplacements) {
            $lines = explode("\n", $customReplacements);
            foreach ($lines as $line) {
                $parts = explode('=>', $line, 2);
                if (count($parts) === 2) {
                    $replacements[trim($parts[0])] = trim($parts[1]);
                }
            }
        }

        return $replacements;
    }
}