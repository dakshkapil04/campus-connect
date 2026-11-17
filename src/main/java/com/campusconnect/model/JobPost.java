package com.campusconnect.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobPost {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 150)
    private String title;

    @NotBlank @Size(max = 150)
    private String company;

    @NotNull
    @Enumerated(EnumType.STRING)
    private JobType type;

    private String location;

    @Size(max = 3000)
    @Column(length = 3000)
    private String description;

    private LocalDate deadline;

    @ManyToOne(fetch = FetchType.EAGER)
    private User postedBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_applicants", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "user_id")
    private Set<Long> applicantIds = new HashSet<>();
}
