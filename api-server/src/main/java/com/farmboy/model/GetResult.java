package com.farmboy.model;

import lombok.Data;

@Data
public class GetResult<T> {
    private T data;
} 