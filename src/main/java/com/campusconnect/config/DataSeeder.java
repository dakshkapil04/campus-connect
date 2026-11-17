package com.campusconnect.config;

import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/** Fills an empty database with demo accounts and sample content so the app looks alive on first run. */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final AnnouncementRepository announcements;
    private final EventRepository events;
    private final ClubRepository clubs;
    private final ResourceRepository resources;
    private final JobPostRepository jobs;
    private final ForumPostRepository posts;
    private final ForumCommentRepository comments;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        if (users.count() > 0) return;

        User admin = users.save(new User("Campus Admin", "admin@campus.edu", encoder.encode("admin123"), Role.ADMIN, "Administration"));
        User faculty = users.save(new User("Dr. Meera Sharma", "faculty@campus.edu", encoder.encode("faculty123"), Role.FACULTY, "Computer Science"));
        User lead = users.save(new User("Rohan Verma", "lead@campus.edu", encoder.encode("lead123"), Role.CLUB_LEAD, "Computer Science"));
        User student = users.save(new User("Aarav Singh", "student@campus.edu", encoder.encode("student123"), Role.STUDENT, "Computer Science"));

        announcements.save(Announcement.builder().title("Mid-semester exam schedule is out")
                .content("The mid-semester timetable has been published. Check your department notice board and report any clashes to the exam cell by Friday.")
                .author(admin).build());
        announcements.save(Announcement.builder().title("Library open until midnight during exams")
                .content("The central library will stay open until 12:00 AM from Monday. Carry your ID card for entry.")
                .author(faculty).build());

        LocalDateTime base = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        events.save(Event.builder().title("Hack the Campus 24h Hackathon")
                .description("Build something useful for campus life in 24 hours. Teams of up to four. Food and swag provided.")
                .location("Innovation Lab, Block C").category("Technical").startTime(base.plusDays(5).withHour(10))
                .organizer(lead).attendeeIds(new HashSet<>(Set.of(student.getId()))).build());
        events.save(Event.builder().title("Placement Preparation Workshop")
                .description("Resume reviews and mock aptitude round with the training and placement cell.")
                .location("Seminar Hall").category("Academic").startTime(base.plusDays(9).withHour(14))
                .organizer(faculty).build());
        events.save(Event.builder().title("Open Mic Night")
                .description("Music, poetry and stand-up. Sign up at the door.")
                .location("Amphitheatre").category("Cultural").startTime(base.plusDays(2).withHour(18))
                .organizer(lead).build());

        clubs.save(Club.builder().name("Coding Club").category("Technical")
                .description("Weekly problem-solving sessions, project nights and contest prep.")
                .lead(lead).memberIds(new HashSet<>(Set.of(lead.getId(), student.getId()))).build());
        clubs.save(Club.builder().name("Photography Society").category("Creative")
                .description("Photo walks, editing workshops and an annual campus exhibition.")
                .lead(lead).memberIds(new HashSet<>(Set.of(lead.getId()))).build());
        clubs.save(Club.builder().name("Debate Union").category("Cultural")
                .description("Parliamentary debates, public speaking practice and inter-college tournaments.")
                .lead(lead).memberIds(new HashSet<>(Set.of(lead.getId()))).build());

        resources.save(SharedResource.builder().title("Data Structures: complete notes")
                .description("Unit-wise notes with solved examples.").url("https://www.geeksforgeeks.org/data-structures/")
                .category("Computer Science").uploadedBy(faculty).build());
        resources.save(SharedResource.builder().title("Java documentation")
                .description("Official Java SE API reference.").url("https://docs.oracle.com/en/java/javase/17/docs/api/")
                .category("Programming").uploadedBy(student).build());

        jobs.save(JobPost.builder().title("Java Backend Intern").company("Acme Software").type(JobType.INTERNSHIP)
                .location("Remote").description("Work on REST APIs with Spring Boot. Stipend provided. Open to 3rd and 4th year students.")
                .deadline(LocalDate.now().plusDays(20)).postedBy(faculty).build());
        jobs.save(JobPost.builder().title("Graduate Software Engineer").company("Northwind Tech").type(JobType.JOB)
                .location("Bengaluru").description("Full-time role for the 2027 batch. Campus drive details will follow.")
                .deadline(LocalDate.now().plusDays(35)).postedBy(admin).build());

        ForumPost post = posts.save(ForumPost.builder().title("Best way to prepare for campus placements?")
                .content("Starting my third year. How are you all splitting time between DSA, projects and core subjects?")
                .category("Careers").author(student).build());
        comments.save(ForumComment.builder().postId(post.getId()).author(faculty)
                .content("Pick one language, solve a few problems every day, and build one project you can explain end to end.").build());
    }
}
