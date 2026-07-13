# Manual Test Checklist

Use this checklist to manually test all features of the Compliance Document Management Portal.

## Authentication Tests

- [ ] Admin can log in with valid credentials
- [ ] Org Admin can log in with valid credentials
- [ ] Site Manager can log in with valid credentials
- [ ] Invalid credentials are rejected with error message
- [ ] Password reset functionality works (if implemented)
- [ ] Session persists after page refresh
- [ ] Logout clears session and redirects to login

## Authorization Tests

### Site Manager Role
- [ ] Site Manager can only see their assigned sites in the sites list
- [ ] Site Manager cannot access other sites' documents
- [ ] Site Manager cannot upload documents to unassigned sites
- [ ] Site Manager can upload documents to their assigned sites
- [ ] Site Manager can view documents for their assigned sites
- [ ] Site Manager can download documents from their assigned sites
- [ ] Site Manager can delete documents from their assigned sites

### Organization Admin Role
- [ ] Org Admin can see all sites in their organization
- [ ] Org Admin cannot see sites from other organizations
- [ ] Org Admin can view documents for all sites in their org
- [ ] Org Admin can upload documents to sites in their org
- [ ] Org Admin cannot access other organizations' data

### Admin Role
- [ ] Admin can see all organizations
- [ ] Admin can see all sites across all organizations
- [ ] Admin can view all documents in the system
- [ ] Admin can access all sites' document libraries
- [ ] Admin can view user management (if implemented)

## Document Upload Tests

### File Validation
- [ ] Valid PDF files are accepted
- [ ] Valid DOC files are accepted
- [ ] Valid DOCX files are accepted
- [ ] Valid XLS files are accepted
- [ ] Valid XLSX files are accepted
- [ ] Valid JPG images are accepted
- [ ] Valid PNG images are accepted
- [ ] Invalid file types (EXE, BAT, SH) are rejected with error message
- [ ] Files under 10MB are accepted
- [ ] Files over 10MB are rejected with error message
- [ ] Files exactly at 10MB are accepted

### Upload Process
- [ ] File names with special characters are sanitized
- [ ] Drag and drop file upload works
- [ ] Click to browse file upload works
- [ ] Site selection is required
- [ ] Category selection is optional
- [ ] Expiry date is optional
- [ ] Notes field is optional
- [ ] Upload button is disabled during upload
- [ ] Success message appears after successful upload
- [ ] Document appears in the list after upload
- [ ] Upload creates audit log entry

### Error Handling
- [ ] Network errors are handled gracefully
- [ ] Invalid site selection shows error
- [ ] Missing file shows error
- [ ] Upload failure shows error message

## Document Download Tests

- [ ] Download button generates signed URL
- [ ] Signed URLs expire after 15 minutes
- [ ] Users can only download documents they have access to
- [ ] Download creates audit log entry
- [ ] File downloads with correct filename
- [ ] Download works for all file types (PDF, DOC, images, etc.)

## Document Management Tests

- [ ] Document list shows all accessible documents
- [ ] Document list filters by site correctly
- [ ] Document list filters by category correctly
- [ ] Search functionality works (searches filename, site, category)
- [ ] Document deletion requires confirmation
- [ ] Deleted documents are removed from list
- [ ] Deletion creates audit log entry
- [ ] Expired documents are marked correctly
- [ ] Expiring documents (within 30 days) are marked with warning
- [ ] Documents with no expiry show "No expiry" badge

## Dashboard Tests

### Statistics
- [ ] Total documents count is accurate
- [ ] Expiring soon count is accurate
- [ ] Uploaded today count is accurate
- [ ] Total sites count is accurate
- [ ] Statistics respect user role permissions

### Expiring Documents
- [ ] 30-day filter shows documents expiring in next 30 days
- [ ] 60-day filter shows documents expiring in next 60 days
- [ ] 90-day filter shows documents expiring in next 90 days
- [ ] Expiring documents table shows correct site names
- [ ] Expiring documents table shows correct document names
- [ ] Days until expiry is calculated correctly
- [ ] Documents expiring within 7 days are highlighted in red
- [ ] Documents expiring within 30 days are highlighted in orange
- [ ] "View" link navigates to document details

### Missing Required Documents
- [ ] Missing required documents are identified per site
- [ ] Sites with all required documents don't appear in list
- [ ] Missing documents list shows correct site names
- [ ] Missing documents list shows correct organization names
- [ ] Missing documents are listed correctly
- [ ] "View Site" button navigates to site detail page

## Sites Page Tests

- [ ] Sites list shows all accessible sites
- [ ] Site cards display site name
- [ ] Site cards display organization name (if applicable)
- [ ] Site cards display address (if available)
- [ ] Clicking site card navigates to site detail page
- [ ] Sites are filtered by user role correctly

## Site Detail Page Tests

- [ ] Site name is displayed correctly
- [ ] Organization name is displayed (if applicable)
- [ ] Site address is displayed (if available)
- [ ] Documents list shows all documents for the site
- [ ] Missing required documents warning appears if applicable
- [ ] Upload document button opens upload modal
- [ ] Document table shows correct information
- [ ] Download and delete buttons work correctly

## Security Tests

### Row Level Security (RLS)
- [ ] Site Manager cannot query documents from other sites (test via direct DB query)
- [ ] Org Admin cannot query sites from other organizations
- [ ] Admin can query all data
- [ ] RLS policies prevent unauthorized data access

### File Security
- [ ] File paths are not exposed to frontend
- [ ] Direct storage URLs are not accessible without signed URL
- [ ] Signed URLs expire after 15 minutes
- [ ] File uploads are validated before storage

### Access Control
- [ ] JWT tokens are validated on every request
- [ ] Unauthenticated users are redirected to login
- [ ] Users cannot access pages outside their role permissions
- [ ] API routes validate user authentication

### Data Protection
- [ ] SQL injection attempts are blocked (test with malicious input)
- [ ] XSS attempts are sanitized (test with script tags)
- [ ] File names are sanitized before storage
- [ ] Audit logs capture all sensitive operations

## Performance Tests

- [ ] Dashboard loads within 2 seconds
- [ ] Document list loads within 2 seconds
- [ ] File uploads complete within reasonable time
- [ ] Large file lists (100+ documents) are paginated or performant
- [ ] No memory leaks during extended use

## Responsive Design Tests

### Desktop (1280px+)
- [ ] Full sidebar is visible
- [ ] 4-column grid for stat cards
- [ ] Tables display all columns

### Laptop (1024px - 1279px)
- [ ] Sidebar is visible (may be narrower)
- [ ] 3-column grid for stat cards
- [ ] Tables are scrollable if needed

### Tablet (768px - 1023px)
- [ ] Sidebar is collapsible
- [ ] 2-column grid for stat cards
- [ ] Tables are simplified or scrollable

### Mobile (< 768px)
- [ ] Sidebar is hidden (hamburger menu)
- [ ] Stat cards stack vertically
- [ ] Document list uses card layout
- [ ] Touch targets are at least 48x48px

## Browser Compatibility Tests

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Accessibility Tests

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Screen reader can navigate the interface
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced to screen readers

## Edge Cases

- [ ] Uploading document with very long filename
- [ ] Uploading document with special characters in name
- [ ] Uploading multiple documents rapidly
- [ ] Accessing site detail page for non-existent site
- [ ] Downloading document that was deleted
- [ ] Viewing dashboard with no documents
- [ ] Viewing dashboard with no sites
- [ ] User with no assigned sites (Site Manager)
- [ ] Organization with no sites (Org Admin)

## Notes

- Test with different user roles in separate browser sessions
- Use browser DevTools to verify network requests and responses
- Check Supabase dashboard to verify RLS policies are working
- Verify audit logs are being created correctly
- Test with various file sizes and types

