## 2024-08-01 - Add loading states for bulk assignment

**Learning:** Operations that loop over users and do network requests (like creating tasks for an entire class) can take a few seconds and cause users to multi-click if they don't get immediate feedback.
**Action:** Always add visual loading indicators ('btn-loading') and disable submit buttons for asynchronous operations, especially those that trigger bulk inserts or push notifications.
