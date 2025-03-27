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

use Amadeco\QuickView\Helper\Data;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Serialize\SerializerInterface;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

/**
 * QuickView Init Block
 */
class Init extends Template
{
    /**
     * @var string
     */
    protected $_template = 'Amadeco_QuickView::init.phtml';

    /**
     * @var Data
     */
    private readonly Data $dataHelper;

    /**
     * @var SerializerInterface
     */
    private readonly SerializerInterface $serializer;

    /**
     * @param Context $context
     * @param Data $dataHelper
     * @param array $data
     * @param SerializerInterface|null $serializer
     */
    public function __construct(
        Context $context,
        Data $dataHelper,
        array $data = [],
        ?SerializerInterface $serializer = null
    ) {
        parent::__construct($context, $data);
        $this->dataHelper = $dataHelper;
        $this->serializer = $serializer ?: ObjectManager::getInstance()->get(SerializerInterface::class);
    }

    /**
     * Render HTML code referring to config settings
     *
     * @return string
     */
    protected function _toHtml(): string
    {
        if (!$this->dataHelper->isEnabled()) {
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
        return $this->dataHelper->getElementsSelector();
    }

    /**
     * Get QuickView configuration for JavaScript
     *
     * @return array
     */
    public function getJsConfig(): array
    {
        return [
            'btnLabel' => $this->dataHelper->getButtonLabel(),
            'modalTitle' => $this->dataHelper->getModalTitle(),
            'enableBtnGoToProduct' => $this->dataHelper->showButtonGoDetail(),
            'selectors' => [
                'btnContainer' => $this->dataHelper->getButtonContainerSelector(),
                'reviewTabSelector' => $this->dataHelper->getReviewTabSelector(),
                'tabTitleClass' => $this->dataHelper->getTabTitleClass(),
                'tabContentClass' => $this->dataHelper->getTabContentClass()
            ]
        ];
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
}