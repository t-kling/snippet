# Future Features Roadmap

Features planned for future releases, roughly in order of priority.

## Authentication & Account Management

### Password Reset
- Forgot password flow
- Email-based reset token system
- Email service integration (Resend, SendGrid, or Nodemailer)
- Secure token expiration

**Implementation Notes:**
- Add reset_token and reset_token_expires to users table
- Create POST /api/auth/forgot-password endpoint
- Create POST /api/auth/reset-password endpoint
- Integration with email service for sending reset links

### OAuth Authentication
- Google OAuth
- GitHub OAuth
- Support for multiple auth providers per account
- Seamless integration with existing JWT system

**Implementation Notes:**
- Add oauth_provider and oauth_id columns to users table
- Make password_hash nullable
- OAuth routes: /api/auth/google, /api/auth/github
- Same JWT issuance after OAuth success

## Rich Content Features

### Text Highlighting
- Highlight text in various colors
- Default yellow highlight with keyboard shortcut
- Store highlight data as ranges in content
- Render highlights in review mode

### Image Support
- Upload images to snippets
- Image storage (Supabase Storage or similar)
- Auto-generate titles for image-only cards ("Image 5")
- Display images in review interface
- Auto-compress large images for storage

### MathJax/LaTeX Rendering
- Render mathematical equations
- Support for inline and block equations
- Cloze deletions within equations
- LaTeX syntax highlighting in editor

### Image Cloze Deletions
- Draw colorful squares to hide parts of images
- Resize and delete image clozes
- Reveal image sections in review mode
- Useful for diagrams, maps, anatomy, etc.

## Import/Export Features

### Library Export
- Download entire snippet library
- Export formats: JSON, Markdown, CSV
- Include all metadata and scheduling data
- Useful for backups and data portability

### Markdown/Plaintext Import
- Auto-generate snippets from markdown files
- Obsidian integration
- Batch import from folders
- Preserve headers as titles, content as cards
- Parse existing tags/topics

### Browser Extension
- Quick-save snippets from any webpage
- Automatic source URL capture
- Selected text becomes snippet content
- Chrome, Firefox, Safari support
- Direct save to user account

### iPhone App
- Native iOS app
- Share menu integration
- Save snippets from any app
- Sync with web version
- Offline review capability

## Advanced Study Features

### Custom Scheduling
- Adjust SM-2 parameters per user
- Manual interval override
- Suspend/unsuspend cards
- Reschedule bulk cards

### Statistics Dashboard
- Review streak tracking
- Cards reviewed per day
- Retention rates by topic
- Time spent studying
- Forecast of upcoming reviews

### Study Sessions
- Pomodoro timer integration
- Session goals (number of cards)
- Study streaks and achievements
- Daily review limits

## Organization Improvements

### Hierarchical Topics
- Nested topic structure
- Topic hierarchies (e.g., Math > Calculus > Derivatives)
- Filter by topic and subtopics

### Snippet Linking
- Link snippets to each other
- Backlinks view
- Knowledge graph visualization
- Related snippets suggestions

### Custom Fields
- User-defined metadata fields
- Custom sorting by fields
- Advanced filtering

## Collaboration Features (Low Priority)

### Shared Decks
- Share snippet collections with others
- Public/private deck visibility
- Clone others' decks

### Study Groups
- Collaborative snippet creation
- Group review sessions
- Shared statistics

## Technical Improvements

### Performance
- Lazy loading for large libraries
- Virtual scrolling for lists
- Image lazy loading
- Database query optimization

### Mobile App
- Progressive Web App (PWA)
- Offline support with service workers
- Mobile-optimized review interface
- Push notifications for reviews

### Accessibility
- Keyboard navigation throughout
- Screen reader support
- High contrast mode
- Customizable fonts and sizes

## Notes on Implementation

- **MVP Completeness**: Current implementation covers core spaced repetition functionality
- **Incremental Development**: Features should be added one at a time with thorough testing
- **User Feedback**: Priority may shift based on actual usage patterns
- **Free Tier Constraints**: Image features will require paid storage plans or aggressive compression
- **OAuth Integration**: Can be added without modifying existing auth flow
- **Email Services**: Consider starting with Resend (modern, generous free tier)

## Getting Involved

If you'd like to contribute to any of these features:
1. Open an issue to discuss the approach
2. Check if the feature aligns with the minimalist philosophy
3. Submit a PR with tests and documentation
