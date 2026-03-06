# 🚀 Admin Quick Start Guide - Advanced Management Features

**Version**: 1.0  
**Date**: February 20, 2026  
**For**: Administrators of QuranReview System

---

## 📚 Table of Contents

1. [Accessing the Admin Interface](#accessing-the-admin-interface)
2. [Managing Classes](#managing-classes)
3. [Editing Student Profiles](#editing-student-profiles)
4. [Understanding Synchronization](#understanding-synchronization)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## 🔐 Accessing the Admin Interface

### Login
1. Navigate to: `http://localhost:8000/login/`
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard

### Admin Menu
Look for these menu items:
- 📋 **قائمة المستخدمين** (User List)
- 📚 **Classes & Professeurs** (NEW!)
- 📊 **Dashboard**
- ⚙️ **Settings**

---

## 📚 Managing Classes

### Viewing Classes
1. Click **"📚 Classes & Professeurs"** in the admin menu
2. You'll see:
   - **Statistics**: Total teachers, classes, students
   - **8h45 Section**: All morning classes
   - **10h45 Section**: All afternoon classes

### Creating a New Class
1. Click **"➕ Créer une classe"** button
2. Fill in the form:
   - **Nom de la classe**: e.g., "Classe_8h45_Prof_Ahmed"
   - **Créneau**: Select 8h45 or 10h45
   - **Professeur**: Select a teacher (optional)
   - **Description**: Add notes (optional)
3. Click **"💾 Enregistrer"**
4. Success! The class appears immediately

### Editing a Class
1. Find the class card
2. Click the **✏️** (edit) icon
3. Modify the fields
4. Click **"💾 Enregistrer"**

### Deleting a Class
1. Find the class card
2. Click the **🗑️** (delete) icon
3. Confirm the deletion
4. If the class has students, you'll be asked to confirm force deletion

### Viewing Class Details
1. Click on any class card
2. A modal opens showing:
   - Teacher name
   - Time slot
   - Number of students
   - List of all students in the class
3. From here you can:
   - Add students to the class
   - Remove students from the class
   - View student profiles

---

## 👤 Editing Student Profiles

### Opening a Student Profile
**Method 1**: From User List
1. Go to **"📋 قائمة المستخدمين"**
2. Find the student
3. Click **"📋 Modifier profil"** button

**Method 2**: From Class Details
1. Open a class (see above)
2. Click on a student name
3. Profile modal opens

### Profile Editor Layout
The modal has two columns:

**Left Column - Editable Fields**:
- Prénom (First Name)
- Nom (Last Name)
- Email
- Téléphone (Phone)
- Groupe (Group) - Read-only, shows current group
- Niveau (Level) - e.g., "Juz 15"
- Statut (Status) - Active/Inactive/Graduated
- Notes - Internal notes
- Objectifs (Objectives) - Student goals
- Restrictions - Any special restrictions
- Cas spécial (Special Case) - JSON format

**Right Column - History**:
- **Changements de groupe**: All group changes with dates
- **Modifications du profil**: All field changes with before/after values

### Editing a Profile
1. Click in any field to edit
2. Modified fields turn **orange** (highlighted)
3. Invalid fields turn **red** with error message
4. Click **"💾 Enregistrer"** to save
5. Click **"Annuler"** to cancel

### Validation Rules
- **Email**: Must be valid format (user@domain.com)
- **Phone**: Numbers, spaces, dashes, parentheses only
- **Special Case**: Must be valid JSON

### Saving Changes
- Only modified fields are sent to the server
- Changes are saved atomically (all or nothing)
- Success: Green toast notification appears
- Error: Red toast notification with error message
- Profile automatically refreshes after save

---

## 🔄 Understanding Synchronization

### What is Synchronization?
The system automatically keeps all views up-to-date in real-time. When you make a change, all other admins and teachers see it within 5 seconds.

### Sync Indicator
Look for the **blue indicator** in the bottom-right corner:
- **🔄 Synchronisation...**: System is syncing
- **Hidden**: No sync in progress

### What Gets Synchronized?
- Student group assignments
- Profile modifications
- Class creations/deletions
- Teacher assignments
- All admin actions

### How It Works
1. You make a change (e.g., assign student to class)
2. Change is saved to database
3. Audit log is created
4. Every 5 seconds, all connected users check for updates
5. If updates found, views refresh automatically
6. You see the latest data without manual refresh

### Manual Refresh
If you want to force a refresh:
- Click **"🔄 Actualiser"** button on any page

---

## ✅ Common Tasks

### Task 1: Assign Student to a Class
1. Go to **Classes & Professeurs**
2. Click on the target class
3. Click **"➕ Ajouter un élève"**
4. Search for the student by name
5. Click on the student to assign
6. Done! Student is now in the class

**Note**: Students can only be in ONE main class (8h45 OR 10h45)

### Task 2: Change Student's Group
1. Open the student's profile (see above)
2. Note the current group (read-only field)
3. Close the profile modal
4. Go to **Classes & Professeurs**
5. Open the NEW class you want
6. Add the student (see Task 1)
7. Student is automatically removed from old class

### Task 3: Update Student Contact Info
1. Open student profile
2. Edit **Email** and/or **Téléphone**
3. Watch for validation (green = valid, red = invalid)
4. Click **"💾 Enregistrer"**
5. Check history to confirm change

### Task 4: Add Notes to Student
1. Open student profile
2. Scroll to **Notes** field
3. Type your notes (supports multiple lines)
4. Click **"💾 Enregistrer"**
5. Notes are saved and visible to all admins

### Task 5: View Student History
1. Open student profile
2. Look at right column
3. **Changements de groupe**: See all past group changes
4. **Modifications du profil**: See all field changes
5. Each entry shows:
   - Date and time
   - Admin who made the change
   - What changed (before → after)

### Task 6: Filter Classes
1. Go to **Classes & Professeurs**
2. Use filter dropdowns at top:
   - **Créneau**: Show only 8h45 or 10h45
   - **Professeur**: Show only classes for specific teacher
3. View updates automatically

### Task 7: Assign Teacher to Class
1. Go to **Classes & Professeurs**
2. Click **✏️** on the class
3. Select teacher from **Professeur** dropdown
4. Click **"💾 Enregistrer"**
5. Teacher is now assigned

---

## 🔧 Troubleshooting

### Problem: Changes Not Appearing
**Solution**:
1. Wait 5 seconds for auto-sync
2. Click **"🔄 Actualiser"** to force refresh
3. Check your internet connection
4. Verify you're logged in as admin

### Problem: Can't Save Profile
**Possible Causes**:
- Invalid email format → Fix the email
- Invalid phone format → Use only numbers/dashes
- Invalid JSON in special case → Check JSON syntax
- Network error → Check connection

**Solution**:
1. Look for red error messages under fields
2. Fix the invalid fields
3. Try saving again

### Problem: Student in Wrong Class
**Solution**:
1. Open the CORRECT class
2. Add the student to it
3. Student is automatically removed from old class
4. Verify in student profile history

### Problem: Can't Delete Class
**Possible Cause**: Class has students

**Solution**:
1. Either remove all students first
2. Or confirm force deletion (students moved to default group)

### Problem: Sync Indicator Stuck
**Solution**:
1. Refresh the page (F5)
2. Check browser console for errors (F12)
3. Verify Redis server is running
4. Contact technical support

### Problem: Profile Modal Won't Open
**Solution**:
1. Refresh the page
2. Clear browser cache
3. Try different browser
4. Check browser console for JavaScript errors

---

## 💡 Tips & Best Practices

### 1. Use Descriptive Class Names
✅ Good: "Classe_8h45_Prof_Ahmed_Groupe_A"  
❌ Bad: "Class1"

### 2. Always Add Notes
When making changes, add notes explaining why:
- "Student requested time change"
- "Parent called to update phone"
- "Moved to advanced group"

### 3. Check History Before Changes
Before modifying a student, check their history to understand past changes.

### 4. Use Filters Effectively
When managing many classes, use filters to focus on specific timeslots or teachers.

### 5. Verify After Changes
After making changes, check:
- Success toast appeared
- Change appears in history
- Student is in correct class

### 6. Regular Backups
Although the system has audit logs, regular database backups are recommended.

---

## 📊 Understanding the Dashboard

### Statistics Cards
- **👨‍🏫 Professeurs**: Total number of teachers
- **📚 Classes**: Total number of classes
- **👥 Élèves**: Total number of students

### Class Cards
Each card shows:
- **📚 Class Name**
- **👨‍🏫 Teacher Name** (or "Non assigné")
- **🕐 Time Slot** (8h45 or 10h45)
- **👥 Student Count**

### Color Coding
- **Blue**: Primary actions (create, save)
- **Green**: Success messages
- **Red**: Errors or delete actions
- **Orange**: Modified fields
- **Gray**: Secondary actions (cancel)

---

## 🌐 Bilingual Interface

The interface supports both French and Arabic:
- **French**: Left-aligned, left-to-right
- **Arabic**: Right-aligned, right-to-left (RTL)

All labels show both languages:
- "Classes & Professeurs / الفصول والأساتذة"
- "Créer une classe / إنشاء فصل"
- "Enregistrer / حفظ"

---

## 📞 Getting Help

### In-App Help
- Hover over buttons to see tooltips
- Error messages explain what's wrong
- Success messages confirm actions

### Technical Support
If you encounter issues:
1. Note the exact error message
2. Check what you were doing when error occurred
3. Try the troubleshooting steps above
4. Contact technical support with details

### Training
For additional training:
- Request a live demo session
- Review this guide regularly
- Practice with test data first

---

## 🎓 Quick Reference Card

### Keyboard Shortcuts
- **Esc**: Close modal
- **F5**: Refresh page
- **Ctrl+S**: Save (in some browsers)

### Common Actions
| Action | Location | Button |
|--------|----------|--------|
| Create Class | Classes page | ➕ Créer une classe |
| Edit Class | Class card | ✏️ |
| Delete Class | Class card | 🗑️ |
| View Details | Class card | Click anywhere |
| Edit Profile | User list | 📋 Modifier profil |
| Save Changes | Any modal | 💾 Enregistrer |
| Cancel | Any modal | Annuler |
| Refresh | Any page | 🔄 Actualiser |

### Status Indicators
| Indicator | Meaning |
|-----------|---------|
| 🔄 Blue indicator | Syncing in progress |
| ✅ Green toast | Success |
| ❌ Red toast | Error |
| ⚠️ Orange field | Modified |
| 🔴 Red field | Invalid |

---

## 📝 Changelog

### Version 1.0 (February 20, 2026)
- Initial release
- Classes & Professeurs page
- Student profile editor
- Global synchronization
- Bilingual support
- Complete audit logging

---

**End of Quick Start Guide**

For technical documentation, see `PHASE8-10_IMPLEMENTATION_SUMMARY.md`
