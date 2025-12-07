# Role model overview

This codebase keeps **platform-wide admin privileges** distinct from **community-level roles**, so the terms do not overlap:

- **Platform admin**: Controlled by the `users.is_admin` column and loaded into the session as `req.session.isAdmin` during login. Admin-only routes use the `isAdmin` middleware, so anyone with this flag can reach global admin APIs (including apologetics admin pages) regardless of their community memberships.
- **Community roles**: Each community membership stores a `role` of `owner`, `moderator`, or `member` in `community_members.role`. These roles only apply inside that specific community (e.g., managing members or posts) and do not grant platform admin powers.

Because the systems are separate, marking someone as a platform admin will not change their community role, and promoting a community moderator does not make them a platform admin. Set `is_admin = true` for a user (or use the `create-admin` helpers) when you need platform-wide privileges; otherwise, adjust the `community_members.role` field for community-scoped access.
