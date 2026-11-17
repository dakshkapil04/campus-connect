package com.campusconnect.controller;

import com.campusconnect.dto.UserView;
import com.campusconnect.model.JobPost;
import com.campusconnect.model.User;
import com.campusconnect.repository.JobPostRepository;
import com.campusconnect.repository.UserRepository;
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
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobPostRepository jobs;
    private final UserRepository users;

    @GetMapping
    public List<JobPost> list() {
        return jobs.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public JobPost create(@Valid @RequestBody JobPost j, @AuthenticationPrincipal User me) {
        j.setId(null);
        j.setPostedBy(me);
        j.setApplicantIds(new HashSet<>());
        return jobs.save(j);
    }

    /** Students apply, or withdraw if they already applied. */
    @PostMapping("/{id}/apply")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public JobPost toggleApply(@PathVariable Long id, @AuthenticationPrincipal User me) {
        JobPost j = jobs.findById(id).orElseThrow(() -> Guard.notFound("Job"));
        Guard.toggle(j.getApplicantIds(), me.getId());
        return jobs.save(j);
    }

    /** Only the person who posted the job (or an admin) can see who applied. */
    @GetMapping("/{id}/applicants")
    public List<UserView> applicants(@PathVariable Long id, @AuthenticationPrincipal User me) {
        JobPost j = jobs.findById(id).orElseThrow(() -> Guard.notFound("Job"));
        Guard.ownerOrAdmin(me, j.getPostedBy());
        return users.findAllById(j.getApplicantIds()).stream().map(UserView::of).toList();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User me) {
        JobPost j = jobs.findById(id).orElseThrow(() -> Guard.notFound("Job"));
        Guard.ownerOrAdmin(me, j.getPostedBy());
        jobs.delete(j);
        return ResponseEntity.noContent().build();
    }
}
