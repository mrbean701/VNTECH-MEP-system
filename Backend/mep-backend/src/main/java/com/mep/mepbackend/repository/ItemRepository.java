package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findByCode(String code);

    boolean existsByCode(String code);

    List<Item> findByStatus(String status);

    List<Item> findByItemGroup(String itemGroup);

    List<Item> findByNameContainingIgnoreCase(String name);
}