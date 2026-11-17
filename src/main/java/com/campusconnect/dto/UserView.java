package com.campusconnect.dto;

import com.campusconnect.model.Role;
import com.campusconnect.model.User;

/** Safe, public shape of a user (never contains the password hash). */
public record UserView(Long id, String name, String email, Role role, String department) {
    public static UserView of(User u) {
        return new UserView(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getDepartment());
    }
}
