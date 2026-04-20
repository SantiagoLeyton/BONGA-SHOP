package com.bongashop.backend.cart.service;

import com.bongashop.backend.cart.dto.CartResponse;
import com.bongashop.backend.cart.entity.Cart;
import com.bongashop.backend.cart.mapper.CartMapper;
import com.bongashop.backend.cart.repository.CartRepository;
import com.bongashop.backend.cartitem.entity.CartItem;
import com.bongashop.backend.cartitem.repository.CartItemRepository;
import com.bongashop.backend.order.entity.Order;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.productvariant.service.ProductVariantService;
import com.bongashop.backend.shared.enums.CartStatus;
import com.bongashop.backend.shared.exception.BusinessException;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import com.bongashop.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserService userService;
    private final ProductVariantService productVariantService;
    private final CartMapper cartMapper;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            UserService userService,
            ProductVariantService productVariantService,
            CartMapper cartMapper
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userService = userService;
        this.productVariantService = productVariantService;
        this.cartMapper = cartMapper;
    }

    @Transactional
    public CartResponse getActiveCart(Long userId) {
        return cartMapper.toResponse(getOrCreateActiveCartEntity(userId));
    }

    @Transactional(readOnly = true)
    public List<CartResponse> listUserCarts(Long userId) {
        return cartRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(cartMapper::toResponse)
                .toList();
    }

    @Transactional
    public CartResponse addItem(Long userId, Long variantId, int quantity) {
        if (quantity <= 0) {
            throw new BusinessException("Quantity must be greater than zero");
        }

        Cart cart = getOrCreateActiveCartEntity(userId);
        ProductVariant variant = productVariantService.getVariantEntity(variantId);
        validateVariantAvailability(variant);

        CartItem item = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)
                .orElseGet(() -> {
                    CartItem newItem = new CartItem();
                    newItem.setCart(cart);
                    newItem.setVariant(variant);
                    newItem.setQuantity(0);
                    cart.getItems().add(newItem);
                    return newItem;
                });
        int nextQuantity = item.getQuantity() + quantity;
        validateQuantity(item.getVariant(), nextQuantity);
        item.setQuantity(nextQuantity);
        return cartMapper.toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateItemQuantity(Long userId, Long variantId, int quantity) {
        Cart cart = getOrCreateActiveCartEntity(userId);
        CartItem item = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found for variant " + variantId));

        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            validateVariantAvailability(item.getVariant());
            validateQuantity(item.getVariant(), quantity);
            item.setQuantity(quantity);
        }

        return cartMapper.toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse changeItemVariant(Long userId, Long currentVariantId, Long nextVariantId) {
        Cart cart = getOrCreateActiveCartEntity(userId);
        if (currentVariantId.equals(nextVariantId)) {
            return cartMapper.toResponse(cart);
        }

        CartItem currentItem = cartItemRepository.findByCartIdAndVariantId(cart.getId(), currentVariantId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found for variant " + currentVariantId));
        ProductVariant nextVariant = productVariantService.getVariantEntity(nextVariantId);
        validateVariantAvailability(nextVariant);

        CartItem nextItem = cartItemRepository.findByCartIdAndVariantId(cart.getId(), nextVariantId).orElse(null);
        int requestedQuantity = currentItem.getQuantity() + (nextItem == null ? 0 : nextItem.getQuantity());
        validateQuantity(nextVariant, requestedQuantity);

        if (nextItem == null) {
            currentItem.setVariant(nextVariant);
        } else {
            nextItem.setQuantity(requestedQuantity);
            cart.getItems().remove(currentItem);
            cartItemRepository.delete(currentItem);
        }

        return cartMapper.toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long variantId) {
        Cart cart = getOrCreateActiveCartEntity(userId);
        CartItem item = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found for variant " + variantId));
        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        return cartMapper.toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse clearActiveCart(Long userId) {
        Cart cart = getOrCreateActiveCartEntity(userId);
        cart.getItems().clear();
        return cartMapper.toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse markCheckedOut(Long userId, Order order) {
        Cart cart = getOrCreateActiveCartEntity(userId);
        cart.setStatus(CartStatus.CHECKED_OUT);
        cart.setConvertedOrder(order);
        return cartMapper.toResponse(cartRepository.save(cart));
    }

    @Transactional
    public Cart getOrCreateActiveCartEntity(Long userId) {
        return cartRepository.findFirstByUserIdAndStatusOrderByUpdatedAtDesc(userId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setUser(userService.getById(userId));
                    cart.setStatus(CartStatus.ACTIVE);
                    return cartRepository.save(cart);
                });
    }

    private void validateVariantAvailability(ProductVariant variant) {
        if (!variant.isActive() || !variant.getProduct().isActive()) {
            throw new BusinessException("Variant is not available for cart operations");
        }
    }

    private void validateQuantity(ProductVariant variant, int requestedQuantity) {
        int availableStock = variant.getInventory() == null ? 0 : variant.getInventory().getStock();
        if (requestedQuantity > availableStock) {
            throw new BusinessException("Requested quantity exceeds available stock");
        }
    }
}
