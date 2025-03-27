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

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Block\Product\Context as ProductContext;
use Magento\Catalog\Model\Product;
use Magento\Customer\Model\Context as CustomerContext;
use Magento\Framework\App\Http\Context;
use Magento\Framework\DataObject\IdentityInterface;
use Magento\Framework\Registry;
use Magento\Framework\View\Element\Template;

/**
 * QuickView main block
 */
class QuickView extends Template implements IdentityInterface
{
    /**
     * @var string
     */
    protected $_template = 'Amadeco_QuickView::container.phtml';

    /**
     * @var Registry
     */
    protected readonly Registry $coreRegistry;

    /**
     * @var Context
     */
    protected readonly Context $httpContext;

    /**
     * @var ProductRepositoryInterface
     */
    protected readonly ProductRepositoryInterface $productRepository;

    /**
     * @param ProductContext $context
     * @param Context $httpContext
     * @param ProductRepositoryInterface $productRepository
     * @param array $data
     */
    public function __construct(
        ProductContext $context,
        Context $httpContext,
        ProductRepositoryInterface $productRepository,
        array $data = []
    ) {
        $this->coreRegistry = $context->getRegistry();
        $this->httpContext = $httpContext;
        $this->productRepository = $productRepository;
        parent::__construct(
            $context,
            $data
        );
    }

    /**
     * Initialize block's cache
     *
     * @return void
     */
    protected function _construct(): void
    {
        parent::_construct();
        $this->addData([
            'cache_lifetime' => 86400,
            'cache_tags' => [Product::CACHE_TAG]
        ]);
    }

    /**
     * Get current product model
     *
     * @return Product|null
     */
    public function getProduct(): ?Product
    {
        if (!$this->coreRegistry->registry('product') && $this->getProductId()) {
            $product = $this->productRepository->getById($this->getProductId());
            $this->coreRegistry->register('product', $product);
        }

        return $this->coreRegistry->registry('product');
    }

    /**
     * Get cache key for block content
     *
     * @return string
     */
    public function getCacheKey(): string
    {
        $product = $this->getProduct();
        $productId = $product ? $product->getId() : '';

        return parent::getCacheKey() . $productId;
    }

    /**
     * Get key pieces for caching block content
     *
     * @return array
     */
    public function getCacheKeyInfo(): array
    {
        $product = $this->getProduct();

        return [
            'CATALOG_QUICKVIEW',
            $this->_storeManager->getStore()->getId(),
            $this->_design->getDesignTheme()->getId(),
            $this->httpContext->getValue(CustomerContext::CONTEXT_GROUP),
            'product' => $product ? $product->getId() : 'none',
            'template' => $this->getTemplate()
        ];
    }

    /**
     * Get identifiers for cache tags
     *
     * @return array
     */
    public function getIdentities(): array
    {
        $product = $this->getProduct();

        return $product ? $product->getIdentities() : [];
    }
}