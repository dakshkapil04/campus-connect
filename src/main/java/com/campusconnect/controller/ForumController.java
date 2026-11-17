package com.campusconnect.controller;

import com.campusconnect.model.ForumComment;
import com.campusconnect.model.ForumPost;
import com.campusconnect.model.Role;
import com.campusconnect.model.User;
import com.campusconnect.repository.ForumCommentRepository;
import com.campusconnect.repository.ForumPostRepository;
import com.campusconnect.util.Guard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumPostRepository postRepo;
    private final ForumCommentRepository commentRepo;

    @GetMapping
    public List<ForumPost> list() {
        List<ForumPost> posts = postRepo.findAllByOrderByCreatedAtDesc();
        posts.forEach(p -> p.setCommentCount(commentRepo.countByPostId(p.getId())));
        return posts;
    }

    @GetMapping("/{id}")
    public ForumPost one(@PathVariable Long id) {
        ForumPost p = postRepo.findById(id).orElseThrow(() -> Guard.notFound("Post"));
        p.setCommentCount(commentRepo.countByPostId(id));
        return p;
    }

    @PostMapping
    public ForumPost create(@Valid @RequestBody ForumPost p, @AuthenticationPrincipal User me) {
        p.setId(null);
        p.setAuthor(me);
        p.setCommentCount(0);
        return postRepo.save(p);
    }

    @GetMapping("/{id}/comments")
    public List<ForumComment> comments(@PathVariable Long id) {
        return commentRepo.findByPostIdOrderByCreatedAtAsc(id);
    }

    @PostMapping("/{id}/comments")
    public ForumComment addComment(@PathVariable Long id, @Valid @RequestBody ForumComment c,
                                   @AuthenticationPrincipal User me) {
        postRepo.findById(id).orElseThrow(() -> Guard.notFound("Post"));
        c.setId(null);
        c.setPostId(id);
        c.setAuthor(me);
        return commentRepo.save(c);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deletePost(@PathVariable Long id, @AuthenticationPrincipal User me) {
        ForumPost p = postRepo.findById(id).orElseThrow(() -> Guard.notFound("Post"));
        requireOwnerOrModerator(me, p.getAuthor());
        commentRepo.deleteByPostId(id);
        postRepo.delete(p);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId, @AuthenticationPrincipal User me) {
        ForumComment c = commentRepo.findById(commentId).orElseThrow(() -> Guard.notFound("Comment"));
        requireOwnerOrModerator(me, c.getAuthor());
        commentRepo.delete(c);
        return ResponseEntity.noContent().build();
    }

    /** Faculty act as forum moderators; otherwise only the owner or an admin may delete. */
    private void requireOwnerOrModerator(User me, User owner) {
        if (me.getRole() == Role.FACULTY) return;
        Guard.ownerOrAdmin(me, owner);
    }
}
