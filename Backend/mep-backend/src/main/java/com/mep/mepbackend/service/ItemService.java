package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.Item;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;

    public List<Item> getAll() {
        return itemRepository.findAll();
    }

    public Item getById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
    }

    public Item getByCode(String code) {
        return itemRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with code: " + code));
    }

    @Transactional
    public Item create(Item item) {
        if (itemRepository.existsByCode(item.getCode())) {
            throw new RuntimeException("Mã vật tư đã tồn tại");
        }
        item.setStatus("ACTIVE");
        item.setCreatedAt(LocalDate.now());
        return itemRepository.save(item);
    }

    @Transactional
    public Item update(Long id, Item details) {
        Item item = getById(id);
        item.setCode(details.getCode());
        item.setName(details.getName());
        item.setItemGroup(details.getItemGroup());
        item.setModel(details.getModel());
        item.setUnit(details.getUnit());
        item.setStandardPrice(details.getStandardPrice());
        item.setStatus(details.getStatus());
        item.setNote(details.getNote());
        item.setUpdatedAt(LocalDate.now());
        return itemRepository.save(item);
    }

    @Transactional
    public void delete(Long id) {
        Item item = getById(id);
        // Kiểm tra xem có inventory liên quan không? (nếu cần)
        itemRepository.delete(item);
    }

    public List<Item> getByStatus(String status) {
        return null;
    }
}