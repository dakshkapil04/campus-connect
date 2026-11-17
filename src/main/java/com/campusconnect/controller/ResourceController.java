package com.campusconnect.controller;

import com.campusconnect.model.SharedResource;
import com.campusconnect.model.User;
import com.campusconnect.repository.ResourceRepository;
import com.campusconnect.util.Guard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceRepository resources;

    @GetMapping
    public List<SharedResource> list() {
        return resources.findAllByOrderByCreatedAtDesc();
    }

    // Any signed-in user can share a resource
    @PostMapping
    public SharedResource create(@Valid @RequestBody SharedResource r, @AuthenticationPrincipal User me) {
        r.setId(null);
        r.setUploadedBy(me);
        return resources.save(r);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User me) {
        SharedResource r = resources.findById(id).orElseThrow(() -> Guard.notFound("Resource"));
        Guard.ownerOrAdmin(me, r.getUploadedBy());
        resources.delete(r);
        return ResponseEntity.noContent().build();
    }
}
