package com.campusconnect.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Club {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 100)
    @Column(unique = true)
    private String name;

    @Size(max = 2000)
    @Column(length = 2000)
    private String description;

    private String category;

    @ManyToOne(fetch = FetchType.EAGER)
    private User lead;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "club_members", joinColumns = @JoinColumn(name = "club_id"))
    @Column(name = "user_id")
    private Set<Long> memberIds = new HashSet<>();
}
