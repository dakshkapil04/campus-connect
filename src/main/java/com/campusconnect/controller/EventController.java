package com.campusconnect.controller;

import com.campusconnect.model.Event;
import com.campusconnect.model.User;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.util.Guard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository events;

    @GetMapping
    public List<Event> list() {
        return events.findAllByOrderByStartTimeAsc();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLUB_LEAD','FACULTY','ADMIN')")
    public Event create(@Valid @RequestBody Event e, @AuthenticationPrincipal User me) {
        e.setId(null);
        e.setOrganizer(me);
        e.setAttendeeIds(new HashSet<>());
        return events.save(e);
    }

    /** RSVP if you haven't, cancel if you have. */
    @PostMapping("/{id}/rsvp")
    @Transactional
    public Event rsvp(@PathVariable Long id, @AuthenticationPrincipal User me) {
        Event e = events.findById(id).orElseThrow(() -> Guard.notFound("Event"));
        Guard.toggle(e.getAttendeeIds(), me.getId());
        return events.save(e);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User me) {
        Event e = events.findById(id).orElseThrow(() -> Guard.notFound("Event"));
        Guard.ownerOrAdmin(me, e.getOrganizer());
        events.delete(e);
        return ResponseEntity.noContent().build();
    }
}
