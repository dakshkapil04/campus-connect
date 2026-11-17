package com.campusconnect.repository;

import com.campusconnect.model.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long> {
    List<Club> findAllByOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
}
