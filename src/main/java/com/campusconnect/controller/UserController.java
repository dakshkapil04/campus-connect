package com.campusconnect.controller;

import com.campusconnect.dto.UserView;
import com.campusconnect.model.Role;
import com.campusconnect.model.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.util.Guard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository users;

    @GetMapping("/me")
    public UserView me(@AuthenticationPrincipal User me) {
        return UserView.of(me);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserView> all() {
        return users.findAll().stream().map(UserView::of).toList();
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public UserView changeRole(@PathVariable Long id, @RequestBody Map<String, String> body,
                               @AuthenticationPrincipal User me) {
        User target = users.findById(id).orElseThrow(() -> Guard.notFound("User"));
        if (target.getId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't change your own role");
        }
        try {
            target.setRole(Role.valueOf(String.valueOf(body.get("role"))));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown role");
        }
        return UserView.of(users.save(target));
    }
}
