package com.campusconnect.util;

import com.campusconnect.model.Role;
import com.campusconnect.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

/** Small helpers shared by the controllers. */
public final class Guard {

    private Guard() {}

    public static ResponseStatusException notFound(String what) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, what + " not found");
    }

    public static ResponseStatusException forbidden() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "You don't have permission to do that");
    }

    /** Only the item's owner or an admin may continue. */
    public static void ownerOrAdmin(User me, User owner) {
        boolean isOwner = owner != null && me.getId().equals(owner.getId());
        if (!isOwner && me.getRole() != Role.ADMIN) throw forbidden();
    }

    /** Adds the id if missing, removes it if present. Returns true when it is now in the set. */
    public static boolean toggle(Set<Long> ids, Long id) {
        if (ids.remove(id)) return false;
        ids.add(id);
        return true;
    }
}
