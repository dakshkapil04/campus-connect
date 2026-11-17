# Campus Connect

A university ecosystem platform that brings students, faculty, clubs and administrators together: events, clubs, shared resources, an internship and job board, a discussion forum and campus announcements, all behind role-based access control.

**Stack:** Java 17, Spring Boot 3 (Web, Data JPA, Security, Validation), JWT (jjwt), H2 database, plain HTML/CSS/JavaScript frontend served by the same Spring Boot app.

## Run it

Requirements: JDK 17 or newer and Maven 3.9+.

```bash
mvn spring-boot:run
```

Open http://localhost:8080. The database is created and filled with sample data on first start (it lives in `./data`; delete that folder to reset).

### Demo accounts

| Role      | Email                | Password   |
|-----------|----------------------|------------|
| Student   | student@campus.edu   | student123 |
| Club lead | lead@campus.edu      | lead123    |
| Faculty   | faculty@campus.edu   | faculty123 |
| Admin     | admin@campus.edu     | admin123   |

The sign-in page also has one-click buttons for these.

## Who can do what

| Feature       | Everyone signed in      | Student     | Club lead     | Faculty              | Admin           |
|---------------|-------------------------|-------------|---------------|----------------------|-----------------|
| Announcements | read                    |             |               | post                 | post, delete any|
| Events        | read, RSVP              |             | create        | create               | create, delete any |
| Clubs         | read, join or leave     |             | create        |                      | create, delete any |
| Resources     | read, share             |             |               |                      | delete any      |
| Jobs          | read                    | apply       |               | post, view applicants| post, delete any, view applicants |
| Forum         | read, post, reply       |             |               | delete any thread or reply (moderator) | delete any |
| Users         |                         |             |               |                      | list users, change roles |

Everyone can delete their own posts. New sign-ups are always students; only an admin can promote them.

Permissions are enforced on the server (`@PreAuthorize` and ownership checks in `Guard`). The frontend only hides buttons.

## API

All routes except `/api/auth/*` need `Authorization: Bearer <token>`.

| Method | Path | Notes |
|--------|------|-------|
| POST | /api/auth/register, /api/auth/login | returns `{ token, user }` |
| GET | /api/users/me | current user |
| GET | /api/users | admin only |
| PUT | /api/users/{id}/role | admin only, body `{ "role": "FACULTY" }` |
| GET, POST, DELETE | /api/announcements | |
| GET, POST, DELETE | /api/events, POST /api/events/{id}/rsvp | RSVP toggles |
| GET, POST, DELETE | /api/clubs, POST /api/clubs/{id}/join | join toggles |
| GET, POST, DELETE | /api/resources | |
| GET, POST, DELETE | /api/jobs, POST /api/jobs/{id}/apply, GET /api/jobs/{id}/applicants | apply toggles |
| GET, POST, DELETE | /api/forum, GET, POST /api/forum/{id}/comments, DELETE /api/forum/comments/{id} | |

## Project layout

```
src/main/java/com/campusconnect
  config/       SecurityConfig, ApiExceptionHandler, DataSeeder
  security/     JwtUtil (create and read tokens), JwtFilter (login check on each request)
  model/        JPA entities and enums
  repository/   Spring Data repositories
  controller/   REST controllers
  dto/          UserView (safe user shape)
  util/         Guard (ownership checks, toggle helper)
src/main/resources
  application.properties
  static/       index.html, css/style.css, js/api.js, js/app.js
```

## Design notes

- **Stateless auth.** Login returns a JWT; the browser sends it on every request. `JwtFilter` loads the user from the database each time, so a role change takes effect immediately.
- **RSVPs, club members and applicants** are stored as sets of user ids (`@ElementCollection`). This keeps the code short. A join entity would be the next step if you need timestamps or statuses.
- **Controllers talk to repositories directly** to keep the project small. Extracting a service layer is a good first improvement.
- **Passwords** are hashed with BCrypt. Emails and password hashes are never serialised in API responses (`@JsonIgnore` on `User`).
- **Resource links** must start with http:// or https://, and the frontend escapes all user text before rendering.

## Ideas to extend

1. Move controller logic into `@Service` classes and add unit tests with Mockito.
2. Add JUnit and MockMvc tests for the permission rules (a student calling `POST /api/announcements` must get 403).
3. Switch H2 to MySQL or PostgreSQL (change the datasource properties and add the driver).
4. Add pagination and search to the list endpoints.
5. Add a Dockerfile and deploy to Render, Railway or a VPS. Set `JWT_SECRET` as an environment variable.
6. Replace the vanilla JS frontend with React, keeping the same API.
