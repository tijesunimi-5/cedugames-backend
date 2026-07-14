## July 7
- Initialized backend
- Added Express server
- Configured Typescript

##  July 10
### Added
- Express, TypeScript, and basic application layer configurations.
- Dynamic PostgreSQL connection pool setup supporting local pgAdmin and remote serverless Neon instances.
- Standard player registration endpoints featuring async database query handling. [/auth/user/register]
- Input security layers enforced via Zod schema parsers.
- Centralized `handleGlobalErrors` catch middleware.
- Added the login endpoint [/auth/login]
- Added helper functions to help hash password and compare them
- Added the login schema
- Replaced the hardcoded password hashing with the new helper function
- Added a clean logic to check if email and username exists before registration

## July 11
### Added
- Google Auth registration - thought the endpoint hasn't been tested and not fully functional, what's needed is the google client id
- Forgot-password endpoint [/auth/forgor-password]
- added the zod schema for both the google auth and forgot-password

## July 13
### Added
- OTP verification endpoint supporting validation actions [`POST /auth/verify-otp`].
- Added transactional context-driven OTP generation and dispatch module [`POST /auth/resend-otp`].
- Created the core mailing framework using `nodemailer` and Brevo SMTP relay transport systems [`Mailer.ts`].
- Implemented Zod schema parameters for the unified resend and verify tokens.

