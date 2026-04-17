package com.bongashop.backend.shared.exception;

public class InsufficientStockException extends BusinessException {
    public InsufficientStockException(String message) {
        super(message);
    }
}
