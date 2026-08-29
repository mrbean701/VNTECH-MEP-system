package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action", length = 50)
    private String action; // CREATE, UPDATE, DELETE, SUBMIT, APPROVE, REJECT, LOGIN

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id", length = 100)
    private String entityId;

    @Column(length = 200)
    private String description;

    @Column(name = "performed_by", length = 100)
    private String performedBy;

    @Column(name = "performed_by_id")
    private Long performedById;

    @Column(name = "performed_at")
    private LocalDateTime performedAt;

    @Column(columnDefinition = "TEXT")
    private String details;
}
