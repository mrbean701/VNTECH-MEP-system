package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.VendorGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorGroupRepository extends JpaRepository<VendorGroup, Long> {

    /**
     * Lấy tất cả nhóm hàng của một nhà cung cấp
     */
    List<VendorGroup> findByVendorId(Long vendorId);

    /**
     * Lấy tất cả nhóm hàng của nhiều nhà cung cấp (dùng cho bulk)
     */
    List<VendorGroup> findByVendorIdIn(List<Long> vendorIds);

    /**
     * Xóa tất cả nhóm hàng của một nhà cung cấp
     */
    void deleteByVendorId(Long vendorId);

    /**
     * Kiểm tra vendor có group không
     */
    boolean existsByVendorId(Long vendorId);
}