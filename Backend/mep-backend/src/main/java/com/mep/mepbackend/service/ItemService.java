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

    // ✅ Thay đổi: trả về danh sách item theo code (vì code không còn unique)
    public List<Item> getByCode(String code) {
        return itemRepository.findByCode(code);
    }

    // ✅ Lấy tên chính của một mã
    public Item getMainItemByCode(String code) {
        return itemRepository.findByCodeAndIsMainTrue(code)
                .orElseThrow(() -> new ResourceNotFoundException("Main item not found for code: " + code));
    }

    // ✅ Lấy tất cả alias (bao gồm cả tên chính)
    public List<Item> getAllNamesByCode(String code) {
        return itemRepository.findByCode(code);
    }

    @Transactional
    public Item create(Item item) {
        // ✅ Không kiểm tra existsByCode nữa
        if (item.getIsMain() == null) {
            item.setIsMain(true);
        }
        // Nếu item này được đánh dấu là main, đặt các item khác cùng code thành isMain = false
        if (Boolean.TRUE.equals(item.getIsMain())) {
            List<Item> existing = itemRepository.findByCode(item.getCode());
            for (Item ex : existing) {
                if (Boolean.TRUE.equals(ex.getIsMain())) {
                    ex.setIsMain(false);
                    ex.setUpdatedAt(LocalDate.now());
                    itemRepository.save(ex);
                }
            }
        }
        item.setStatus("ACTIVE");
        item.setCreatedAt(LocalDate.now());
        item.setUpdatedAt(LocalDate.now());
        return itemRepository.save(item);
    }

    @Transactional
    public Item update(Long id, Item details) {
        Item item = getById(id);
        // Không cho phép đổi code khi là alias? Có thể cho phép nhưng cần kiểm tra logic.
        // Đơn giản: cho phép đổi code, nhưng nếu code mới đã tồn tại main thì cần xử lý.
        if (details.getCode() != null && !details.getCode().equals(item.getCode())) {
            // Nếu item này đang là main, thì code mới sẽ là main mới
            // Cần cập nhật các item khác cùng code cũ
            if (Boolean.TRUE.equals(item.getIsMain())) {
                // Chuyển main cho code mới
                List<Item> newCodeItems = itemRepository.findByCode(details.getCode());
                for (Item ex : newCodeItems) {
                    if (Boolean.TRUE.equals(ex.getIsMain())) {
                        ex.setIsMain(false);
                        ex.setUpdatedAt(LocalDate.now());
                        itemRepository.save(ex);
                    }
                }
                // item hiện tại sẽ trở thành main cho code mới
            }
        }
        item.setCode(details.getCode());
        item.setName(details.getName());
        item.setItemGroup(details.getItemGroup());
        item.setModel(details.getModel());
        item.setUnit(details.getUnit());
        item.setStandardPrice(details.getStandardPrice());
        item.setStatus(details.getStatus());
        item.setNote(details.getNote());
        item.setIsMain(details.getIsMain() != null ? details.getIsMain() : item.getIsMain());
        item.setUpdatedAt(LocalDate.now());

        // Nếu set isMain = true, reset các main khác cùng code
        if (Boolean.TRUE.equals(item.getIsMain())) {
            List<Item> sameCode = itemRepository.findByCode(item.getCode());
            for (Item ex : sameCode) {
                if (!ex.getId().equals(item.getId()) && Boolean.TRUE.equals(ex.getIsMain())) {
                    ex.setIsMain(false);
                    ex.setUpdatedAt(LocalDate.now());
                    itemRepository.save(ex);
                }
            }
        }

        return itemRepository.save(item);
    }

    @Transactional
    public void delete(Long id) {
        Item item = getById(id);
        // Nếu item là main và có alias, không cho xóa, hoặc chuyển main cho alias khác
        if (Boolean.TRUE.equals(item.getIsMain())) {
            List<Item> sameCode = itemRepository.findByCode(item.getCode());
            if (sameCode.size() > 1) {
                // Chuyển main cho item đầu tiên không phải chính nó
                for (Item other : sameCode) {
                    if (!other.getId().equals(id)) {
                        other.setIsMain(true);
                        other.setUpdatedAt(LocalDate.now());
                        itemRepository.save(other);
                        break;
                    }
                }
            }
        }
        itemRepository.delete(item);
    }

    public List<Item> getByStatus(String status) {
        return itemRepository.findByStatus(status);
    }
}