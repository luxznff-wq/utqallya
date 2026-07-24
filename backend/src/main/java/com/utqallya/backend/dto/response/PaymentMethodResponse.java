package com.utqallya.backend.dto.response;

import com.utqallya.backend.entity.PaymentMethod;
import com.utqallya.backend.entity.enums.PaymentMethodCode;

public record PaymentMethodResponse(
        PaymentMethodCode code,
        String displayName
) {
    public static PaymentMethodResponse from(PaymentMethod method) {
        return new PaymentMethodResponse(method.getCode(), method.getDisplayName());
    }
}
