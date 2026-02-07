<?php
/**
 * Amadeco QuickView Configuration Model
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\QuickView\Model;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

/**
 * Service class for QuickView Configuration.
 */
class Config
{
    /**
     * Default Values
     */
    private const DEFAULT_BTN_CONTAINER_SELECTOR = '.product-item-info';
    private const DEFAULT_WRAPPER_IDENTIFIER = 'quickview-wrapper';
    private const DEFAULT_REVIEW_TAB_SELECTOR = '#tab-label-reviews-title[data-role=trigger]';
    private const DEFAULT_TAB_TITLE_CLASS = '.quickview-tab-title';
    private const DEFAULT_TAB_CONTENT_CLASS = '.quickview-tab-content';

    /**
     * Logic Constants
     */
    private const SEPARATOR_REPLACEMENT = '=>';

    /**
     * General configuration paths
     */
    private const XML_PATH_ENABLED = 'quickview/general/enable';
    private const XML_PATH_ELEMENTS_SELECTOR = 'quickview/general/elements_selector';
    private const XML_PATH_BTN_CONTAINER_SELECTOR = 'quickview/general/btn_container';
    private const XML_PATH_BTN_LABEL = 'quickview/general/btn_label';

    /**
     * Modal configuration paths
     */
    private const XML_PATH_MODAL_TITLE = 'quickview/modal/modal_title';
    private const XML_PATH_SHOW_BTN_GO_DETAIL = 'quickview/modal/show_button_go_detail';

    /**
     * Selectors configuration paths
     */
    private const XML_PATH_REVIEW_TAB = 'quickview/selectors/review_tab';
    private const XML_PATH_TAB_TITLE_CLASS = 'quickview/selectors/tab_title_class';
    private const XML_PATH_TAB_CONTENT_CLASS = 'quickview/selectors/tab_content_class';

    /**
     * Replacements configuration paths
     */
    private const XML_PATH_WRAPPER_IDENTIFIER = 'quickview/replacements/wrapper_identifier';
    private const XML_PATH_GALLERY_PLACEHOLDER = 'quickview/replacements/gallery_placeholder';
    private const XML_PATH_GALLERY_PLACEHOLDER_ALT = 'quickview/replacements/gallery_placeholder_alt';
    private const XML_PATH_SWATCH_OPTIONS = 'quickview/replacements/swatch_options';
    private const XML_PATH_SWATCH_OPTIONS_ALT = 'quickview/replacements/swatch_options_alt';
    private const XML_PATH_ADDTOCART_FORM = 'quickview/replacements/addtocart_form';
    private const XML_PATH_ADDTOCART_BUTTON = 'quickview/replacements/addtocart_button';
    private const XML_PATH_SWATCH_PRODUCT_SELECTOR = 'quickview/replacements/swatch_product_selector';
    private const XML_PATH_CUSTOM_REPLACEMENTS = 'quickview/replacements/custom_replacements';

    /**
     * @param ScopeConfigInterface $scopeConfig
     */
    public function __construct(
        private readonly ScopeConfigInterface $scopeConfig
    ) {
    }

    /**
     * Check if module is enabled.
     *
     * @param int|null $storeId
     * @return bool
     */
    public function isEnabled(?int $storeId = null): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_ENABLED,
            ScopeInterface::SCOPE_STORE,
            $storeId
        );
    }

    /**
     * Get CSS elements selector.
     *
     * @return string
     */
    public function getElementsSelector(): string
    {
        return (string)$this->scopeConfig->getValue(
            self::XML_PATH_ELEMENTS_SELECTOR,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get button container selector.
     *
     * @return string
     */
    public function getButtonContainerSelector(): string
    {
        $selector = (string)$this->scopeConfig->getValue(
            self::XML_PATH_BTN_CONTAINER_SELECTOR,
            ScopeInterface::SCOPE_STORE
        );

        return $selector ?: self::DEFAULT_BTN_CONTAINER_SELECTOR;
    }

    /**
     * Get button label.
     *
     * @return string
     */
    public function getButtonLabel(): string
    {
        return (string)$this->scopeConfig->getValue(
            self::XML_PATH_BTN_LABEL,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get modal title.
     *
     * @return string
     */
    public function getModalTitle(): string
    {
        return (string)$this->scopeConfig->getValue(
            self::XML_PATH_MODAL_TITLE,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Check if "Go to product" button should be shown.
     *
     * @return bool
     */
    public function showButtonGoDetail(): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_SHOW_BTN_GO_DETAIL,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Get wrapper identifier.
     *
     * @return string
     */
    public function getWrapperIdentifier(): string
    {
        $identifier = (string)$this->scopeConfig->getValue(
            self::XML_PATH_WRAPPER_IDENTIFIER,
            ScopeInterface::SCOPE_STORE
        );

        return $identifier ?: self::DEFAULT_WRAPPER_IDENTIFIER;
    }

    /**
     * Get review tab selector.
     *
     * @return string
     */
    public function getReviewTabSelector(): string
    {
        $selector = (string)$this->scopeConfig->getValue(
            self::XML_PATH_REVIEW_TAB,
            ScopeInterface::SCOPE_STORE
        );

        return $selector ?: self::DEFAULT_REVIEW_TAB_SELECTOR;
    }

    /**
     * Get tab title class.
     *
     * @return string
     */
    public function getTabTitleClass(): string
    {
        $class = (string)$this->scopeConfig->getValue(
            self::XML_PATH_TAB_TITLE_CLASS,
            ScopeInterface::SCOPE_STORE
        );

        return $class ?: self::DEFAULT_TAB_TITLE_CLASS;
    }

    /**
     * Get tab content class.
     *
     * @return string
     */
    public function getTabContentClass(): string
    {
        $class = (string)$this->scopeConfig->getValue(
            self::XML_PATH_TAB_CONTENT_CLASS,
            ScopeInterface::SCOPE_STORE
        );

        return $class ?: self::DEFAULT_TAB_CONTENT_CLASS;
    }

    /**
     * Get all selectors as array.
     * Preserves legacy structure for backward compatibility.
     *
     * @return array<string, string>
     */
    public function getAllSelectors(): array
    {
        return [
            'reviewTabSelector' => $this->getReviewTabSelector(),
            'tabTitleClass'     => $this->getTabTitleClass(),
            'tabContentClass'   => $this->getTabContentClass()
        ];
    }

    /**
     * Get consolidated array of selectors (used by Block\Init).
     *
     * @return array<string, string>
     */
    public function getSelectors(): array
    {
        return array_merge(
            ['btnContainer' => $this->getButtonContainerSelector()],
            $this->getAllSelectors()
        );
    }

    /**
     * Get identifier replacements.
     * Logic parses "search=>replace" strings from config.
     *
     * @return array<string, string>
     */
    public function getIdentifierReplacements(): array
    {
        $replacements = [];

        // 1. Standard Replacements
        $configPaths = [
            self::XML_PATH_GALLERY_PLACEHOLDER,
            self::XML_PATH_GALLERY_PLACEHOLDER_ALT,
            self::XML_PATH_SWATCH_OPTIONS,
            self::XML_PATH_SWATCH_OPTIONS_ALT,
            self::XML_PATH_ADDTOCART_FORM,
            self::XML_PATH_ADDTOCART_BUTTON
        ];

        foreach ($configPaths as $path) {
            $value = (string)$this->scopeConfig->getValue($path, ScopeInterface::SCOPE_STORE);
            if ($value) {
                $this->parseReplacementLine($value, $replacements);
            }
        }

        // 2. Special Case: Swatch Renderer
        $swatchSelector = (string)$this->scopeConfig->getValue(
            self::XML_PATH_SWATCH_PRODUCT_SELECTOR,
            ScopeInterface::SCOPE_STORE
        );

        if ($swatchSelector) {
            $key = '"Magento_Swatches/js/swatch-renderer": {';
            $value = $key . PHP_EOL . '    "selectorProduct": "' . $swatchSelector . '",';
            $replacements[$key] = $value;
        }

        // 3. Custom Replacements (Textarea)
        $customReplacements = (string)$this->scopeConfig->getValue(
            self::XML_PATH_CUSTOM_REPLACEMENTS,
            ScopeInterface::SCOPE_STORE
        );

        if ($customReplacements) {
            foreach (explode("\n", $customReplacements) as $line) {
                $this->parseReplacementLine($line, $replacements);
            }
        }

        return $replacements;
    }

    /**
     * Helper to parse "key=>value" strings into the array.
     *
     * @param string $line
     * @param array<string, string> $replacements
     * @return void
     */
    private function parseReplacementLine(string $line, array &$replacements): void
    {
        if (str_contains($line, self::SEPARATOR_REPLACEMENT)) {
            $parts = explode(self::SEPARATOR_REPLACEMENT, $line, 2);
            if (count($parts) === 2) {
                $replacements[trim($parts[0])] = trim($parts[1]);
            }
        }
    }
}