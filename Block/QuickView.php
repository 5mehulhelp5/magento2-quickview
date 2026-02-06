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

use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Model\Product;
use Magento\Customer\Model\Context as CustomerContext;
use Magento\Framework\App\Http\Context as HttpContext;
use Magento\Framework\DataObject\IdentityInterface;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

/**
 * QuickView main block.
 *
 * Responsible for rendering the QuickView container and providing product data
 * without relying on the deprecated Registry.
 */
class QuickView extends Template implements IdentityInterface
{
    /**
     * @var string
     */
    protected $_template = 'Amadeco_QuickView::container.phtml';

    /**
     * Local cache for the loaded product to prevent redundant DB calls.
     */
    private ?ProductInterface $product = null;

    /**
     * @param Context $context
     * @param HttpContext $httpContext
     * @param ProductRepositoryInterface $productRepository
     * @param array<string, mixed> $data
     */
    public function __construct(
        Context $context,
        protected readonly HttpContext $httpContext,
        protected readonly ProductRepositoryInterface $productRepository,
        array $data = []
    ) {
        // Set default cache lifetime (86400 seconds = 1 day)
        // We set this in data before parent construct to avoid using legacy _construct
        $data['cache_lifetime'] = $data['cache_lifetime'] ?? 86400;

        parent::__construct($context, $data);
    }

    /**
     * Get the current product model.
     *
     * Logic:
     * 1. Returns memoized product if already loaded.
     * 2. Checks if a product ID is set in block data.
     * 3. Fallback: Checks request parameters (common for QuickView AJAX controllers).
     *
     * @return ProductInterface|null
     */
    public function getProduct(): ?ProductInterface
    {
        if ($this->product !== null) {
            return $this->product;
        }

        // Try to get ID from block argument or Request parameters
        $productId = $this->getProductId() ?: $this->getRequest()->getParam('id');

        if ($productId) {
            try {
                $this->product = $this->productRepository->getById((string)$productId);
            } catch (NoSuchEntityException $e) {
                // Product does not exist or is disabled; return null quietly
                $this->product = null;
            }
        }

        return $this->product;
    }

    /**
     * Get unique cache key for this block instance.
     *
     * @return string
     */
    public function getCacheKey(): string
    {
        $productId = $this->getProduct() ? $this->getProduct()->getId() : 'no_product';
        return parent::getCacheKey() . '-' . $productId;
    }

    /**
     * Get comprehensive cache key info to ensure context-aware caching.
     *
     * Includes:
     * - Store ID (multi-store support)
     * - Customer Group (tier pricing support)
     * - Product ID
     * - Template file
     *
     * @return array<int|string, mixed>
     */
    public function getCacheKeyInfo(): array
    {
        $productId = $this->getProduct() ? $this->getProduct()->getId() : 'none';

        return [
            'AMADECO_QUICKVIEW_CONTAINER',
            $this->_storeManager->getStore()->getId(),
            $this->_storeManager->getStore()->getCurrentCurrencyCode(),
            $this->_design->getDesignTheme()->getId(),
            $this->httpContext->getValue(CustomerContext::CONTEXT_GROUP),
            'product_' . $productId,
            'template' => $this->getTemplate()
        ];
    }

    /**
     * Get identifiers for cache tags validation.
     *
     * Combines generic product tag with specific entity identities.
     *
     * @return array<string>
     */
    public function getIdentities(): array
    {
        // Always include the generic catalog product tag for broader invalidation
        $identities = [Product::CACHE_TAG];

        $product = $this->getProduct();
        if ($product instanceof IdentityInterface) {
            $identities = array_merge($identities, $product->getIdentities());
        }

        return array_unique($identities);
    }
}