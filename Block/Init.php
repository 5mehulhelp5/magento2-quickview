<?php
/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\QuickView\Block;

use Amadeco\QuickView\Model\Config;
use Magento\Framework\Serialize\SerializerInterface;
use Magento\Framework\View\Asset\Repository as AssetRepository;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

/**
 * QuickView Init Block
 * * Merges XML layout configuration with backend dynamic data.
 */
class Init extends Template
{
    /**
     * @var string
     */
    protected $_template = 'Amadeco_QuickView::init.phtml';

    /**
     * @param Context $context
     * @param Config $config
     * @param SerializerInterface $serializer
     * @param AssetRepository $assetRepository
     * @param array<string, mixed> $data
     */
    public function __construct(
        Context $context,
        protected readonly Config $config,
        protected readonly SerializerInterface $serializer,
        protected readonly AssetRepository $assetRepository,
        array $data = []
    ) {
        parent::__construct($context, $data);

        // Ensure jsLayout is initialized if not provided
        $this->jsLayout = isset($data['jsLayout']) && is_array($data['jsLayout'])
            ? $data['jsLayout']
            : [];
    }

    /**
     * Render HTML code referring to config settings
     *
     * @return string
     */
    protected function _toHtml(): string
    {
        if (!$this->config->isEnabled()) {
            return '';
        }
        return parent::_toHtml();
    }

    /**
     * Get elements selector from configuration
     *
     * @return string
     */
    public function getElementsSelector(): string
    {
        $elementsSelector = $this->config->getElementsSelector();
        if (isset($this->jsLayout['elementsSelector'])) {
            $elementsSelector = $this->jsLayout['elementsSelector'];
        }
        return $elementsSelector;
    }

    /**
     * Get QuickView configuration for JavaScript
     * Merges the static XML config (jsLayout) with dynamic backend data.
     *
     * @return array<string, mixed>
     */
    public function getJsConfig(): array
    {
        $config = [
            'btnLabel' => $this->config->getButtonLabel(),
            'modalTitle' => $this->config->getModalTitle(),
            'enableBtnGoToProduct' => $this->config->showButtonGoDetail(),
            'loaderUrl' => $this->getLoaderUrl(),
            'selectors' => [
                'btnContainer' => $this->config->getButtonContainerSelector(),
                'reviewTabSelector' => $this->config->getReviewTabSelector(),
                'tabTitleClass' => $this->config->getTabTitleClass(),
                'tabContentClass' => $this->config->getTabContentClass()
            ]
        ];

        return array_replace_recursive($config, $this->jsLayout);
    }

    /**
     * Get serialized QuickView config for JavaScript initialization
     *
     * @return string
     */
    public function getSerializedConfig(): string
    {
        return $this->serializer->serialize($this->getJsConfig());
    }

    /**
     * Retrieve the standard Magento Loader URL.
     * * Uses the 'images/loader-1.gif' file from the active theme.
     *
     * @return string
     */
    private function getLoaderUrl(): string
    {
        // 'images/loader-1.gif' without a module prefix looks in the current theme context
        return $this->assetRepository->getUrlWithParams('images/loader-1.gif', []);
    }
}