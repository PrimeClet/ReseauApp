# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **CI/CD Pipeline** - GitHub Actions workflow with lint, test, and build stages
- **API Versioning** - All API routes prefixed with `/api/v1/`
- **Correlation ID Middleware** - Request tracing via `X-Correlation-ID` header
- **ApiResponse Trait** - Standardized JSON responses (`successResponse`, `errorResponse`, `paginatedResponse`)
- **Service Layer** - Dedicated service classes for all business logic (CoffretService, EquipementService, etc.)
- **Laravel Policies** - Model-level authorization (CoffretPolicy, EquipementPolicy, SitePolicy, PortPolicy, LiaisonPolicy)
- **Cache Strategy** - `Cache::remember()` on dashboard statistics (10-min TTL) with invalidation helpers
- **Queue Jobs** - `SendNotificationJob` for async notification dispatch, `ProcessImportJob` for background CSV imports
- **Activity Logs** - `ActivityLog` model and service for audit trail
- **PR Template** - `.github/pull_request_template.md` for consistent reviews
- **Test Suite** - PHPUnit tests: LoginTest, AuthorizationTest, CoffretTest, HealthCheckTest, UserTest
- **Lazy Routes** - React lazy loading for all page components
- **Sites & Zones** - Full CRUD modules with soft deletes

### Changed
- **Controller Refactoring** - All 20+ controllers use ApiResponse trait instead of raw `response()->json()`
- **Fat Controller Reduction** - EquipementsController (959 -> 350 lines), CoffretController (567 -> 120 lines), ModificationController (706 -> 400 lines), CartographyController (580 -> 250 lines)
- **Authorization** - Removed redundant `isAdministrator()` checks from controllers (handled by middleware/policies)

### Fixed
- Dependency chain formatting duplication in EquipementsController
- Topology building duplication in CartographyController

## [1.0.0] - 2026-01-26

### Added
- Initial release with full CRUD for Coffrets, Equipements, Ports, Liaisons, LANs
- User authentication with Laravel Sanctum
- Role-based access control with Spatie Permission
- Network cartography visualization
- Modification request workflow (submit, approve, reject, rollback)
- CSV import/export for all entities
- QR code generation for coffrets and equipements
- Dashboard with global statistics
- Notification system for modification requests
- PWA support for mobile access
