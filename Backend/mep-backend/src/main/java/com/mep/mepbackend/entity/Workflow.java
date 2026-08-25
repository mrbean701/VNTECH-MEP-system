package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "workflows")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Workflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String module; // mr, pr, po, sto, grn, issue, materialreturn

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "JSON", nullable = false)
    private String steps; // JSON: [{step, role, label}]

    @Column(name = "updated_at")
    private LocalDate updatedAt;
}