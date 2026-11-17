package com.campusconnect.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SharedResource {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 150)
    private String title;

    @Size(max = 1000)
    @Column(length = 1000)
    private String description;

    // Only http(s) links are accepted, which blocks "javascript:" style links
    @NotBlank
    @Pattern(regexp = "^https?://.+", message = "must start with http:// or https://")
    @Column(length = 1000)
    private String url;

    private String category;

    @ManyToOne(fetch = FetchType.EAGER)
    private User uploadedBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
