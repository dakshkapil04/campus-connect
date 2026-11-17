package com.campusconnect.controller;

import com.campusconnect.model.Club;
import com.campusconnect.model.User;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.util.Guard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubRepository clubs;

    @GetMapping
    public List<Club> list() {
        return clubs.findAllByOrderByNameAsc();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLUB_LEAD','ADMIN')")
    public Club create(@Valid @RequestBody Club c, @AuthenticationPrincipal User me) {
        if (clubs.existsByNameIgnoreCase(c.getName().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A club with that name already exists");
        }
        c.setId(null);
        c.setName(c.getName().trim());
        c.setLead(me);
        c.setMemberIds(new HashSet<>(List.of(me.getId())));
        return clubs.save(c);
    }

    /** Join if you aren't a member, leave if you are. */
    @PostMapping("/{id}/join")
    @Transactional
    public Club toggleMembership(@PathVariable Long id, @AuthenticationPrincipal User me) {
        Club c = clubs.findById(id).orElseThrow(() -> Guard.notFound("Club"));
        if (c.getLead() != null && c.getLead().getId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Club leads can't leave their own club");
        }
        Guard.toggle(c.getMemberIds(), me.getId());
        return clubs.save(c);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User me) {
        Club c = clubs.findById(id).orElseThrow(() -> Guard.notFound("Club"));
        Guard.ownerOrAdmin(me, c.getLead());
        clubs.delete(c);
        return ResponseEntity.noContent().build();
    }
}
