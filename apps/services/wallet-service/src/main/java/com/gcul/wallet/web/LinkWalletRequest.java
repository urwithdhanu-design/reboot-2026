package com.gcul.wallet.web;

import jakarta.validation.constraints.NotBlank;

public record LinkWalletRequest(@NotBlank String address) {
}
