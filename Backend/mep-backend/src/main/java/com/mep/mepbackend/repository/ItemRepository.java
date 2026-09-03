package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    // ✅ Trả về List vì code không còn unique
    List<Item> findByCode(String code);

    // ✅ Tìm tên chính của một mã
    Optional<Item> findByCodeAndIsMainTrue(String code);

    // Vẫn giữ các method khác
    List<Item> findByStatus(String status);
    List<Item> findByItemGroup(String itemGroup);
    List<Item> findByNameContainingIgnoreCase(String name);
}