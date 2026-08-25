package com.mep.mepbackend.dto;

import lombok.Data;

@Data
public class SearchRequest {
    private String keyword;
    private String status;
    private String projectCode;
    private Integer page;
    private Integer size;
    private String sortBy;
    private String sortDirection;
}