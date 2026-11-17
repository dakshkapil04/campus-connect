package com.campusconnect.controller;

import com.campusconnect.model.Announcement;
import com.campusconnect.model.User;
import com.campusconnect.repository.AnnouncementRepository;
import com.campusconnect.util.Guard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementRepository announcements;

    @GetMapping
    public List<Announcement> list() {
        return announcements.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public Announcement create(@Valid @RequestBody Announcement a, @AuthenticationPrincipal User me) {
        a.setId(null);
        a.setAuthor(me);
        return announcements.save(a);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User me) {
        Announcement a = announcements.findById(id).orElseThrow(() -> Guard.notFound("Announcement"));
        Guard.ownerOrAdmin(me, a.getAuthor());
        announcements.delete(a);
        return ResponseEntity.noContent().build();
    }
}
