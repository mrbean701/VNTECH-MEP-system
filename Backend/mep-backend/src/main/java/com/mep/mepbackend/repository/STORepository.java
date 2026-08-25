package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.STO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface STORepository extends JpaRepository<STO, Long> {

    Optional<STO> findByCode(String code);

    boolean existsByCode(String code);

    List<STO> findByFromWarehouseId(Long fromWarehouseId);

    List<STO> findByToWarehouseId(Long toWarehouseId);

    List<STO> findByStatus(String status);

    List<STO> findByProjectCode(String projectCode);

    List<STO> findByStatusIn(List<String> statuses);
}