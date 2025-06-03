package com.farmboy.model;

import lombok.Data;

@Data
public class EFAgent {
    private Long id;
    private String name;
    private String status;
    private String lastSeenAt;
    private String createdAt;
    private String updatedAt;
} 