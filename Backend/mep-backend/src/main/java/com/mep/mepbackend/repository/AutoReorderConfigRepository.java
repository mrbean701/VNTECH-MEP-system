package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.AutoReorderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AutoReorderConfigRepository extends JpaRepository<AutoReorderConfig, Long> {

    // Chỉ có 1 bản ghi duy nhất, có thể lấy bằng id = 1
    // Hoặc có thể thêm phương thức tìm kiếm mặc định
}