package com.campusconnect.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 150)
    private String title;

    @Size(max = 2000)
    @Column(length = 2000)
    private String description;

    @NotBlank @Size(max = 150)
    private String location;

    private String category;

    @NotNull
    private LocalDateTime startTime;

    @ManyToOne(fetch = FetchType.EAGER)
    private User organizer;

    // RSVPs are stored as a simple set of user ids (table: event_attendees)
    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_attendees", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "user_id")
    private Set<Long> attendeeIds = new HashSet<>();
}
