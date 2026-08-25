package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {

    Optional<Vendor> findByCode(String code);

    boolean existsByCode(String code);

    List<Vendor> findByVendorGroup(String vendorGroup);

    List<Vendor> findByNameContainingIgnoreCase(String name);
}