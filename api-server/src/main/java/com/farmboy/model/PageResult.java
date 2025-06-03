package com.farmboy.model;

import lombok.Data;
import java.util.List;

@Data
public class PageResult<T> {
    private List<T> data;
    private int currentPage;
    private int totalPages;
    private int totalItems;
} 