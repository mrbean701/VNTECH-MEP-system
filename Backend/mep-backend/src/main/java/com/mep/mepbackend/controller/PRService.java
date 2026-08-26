package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.PR;

import java.util.List;

public class PRService {
    public List<PR> getAll() {

        return List.of();
    }

    public PR getById(Long id) {

        return null;
    }

    public PR getByCode(String code) {
        return null;
    }

    public List<PR> getByProjectCode(String projectCode) {
        return null;
    }

    public List<PR> getByStatus(String status) {
        return null;
    }

    public PR create(PR pr) {
        return null;
    }

    public PR createFromMR(Long mrId, PR pr) {
        return null;
    }

    public PR update(Long id, PR pr) {
        return null;
    }

    public void submit(Long id) {
        
    }

    public void approve(Long id) {
    }

    public void reject(Long id) {
    }

    public void delete(Long id) {
    }
}
