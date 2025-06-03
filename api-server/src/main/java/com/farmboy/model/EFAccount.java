package com.farmboy.model;

import lombok.Data;

@Data
public class EFAccount {
    private Long id;
    private String username;
    private String password;
    private Long accountCategoryId;
    private String otpKey;
    private Integer tutorialStatus;
    private String countryCode;
    private String lastCheckedAt;
} 