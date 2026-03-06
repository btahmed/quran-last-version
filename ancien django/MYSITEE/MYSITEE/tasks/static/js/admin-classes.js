/**
 * Admin Classes Management Controller
 * Handles all functionality for the Classes & Professeurs admin page
 */

class ClassManagementController {
    constructor() {
        this.apiBaseUrl = '/api/admin';
        this.currentGroupId = null;
        this.currentClassData = null;
        this.teachersList = [];
        this.classesList = [];
        this.studentsList = [];
        
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing ClassManagementController...');
        this.loadClassesAndTeachers();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.querySelector('[onclick="refreshData()"]');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadClassesAndTeachers();
        }
    }
    
    /**
     * Load all classes and teachers data from API
     */
    async loadClassesAndTeachers() {
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/classes-teachers/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 Loaded data:', data);
            
            this.teachersList = data.teachers || [];
            this.classesList = data.all_classes || [];
            
            this.renderClassesView();
            this.updateStatistics();
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showToast('Erreur lors du chargement des données', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Render the complete classes view
     */
    renderClassesView() {
        console.log('🎨 Rendering classes view...');
        
        // Group classes by timeslot
        const classesByTimeslot = this.groupClassesByTimeslot();
        
        // Render 8h45 timeslot
        this.renderTimeslotClasses('8h45', classesByTimeslot['8h45'] || []);
        
        // Render 10h45 timeslot
        this.renderTimeslotClasses('10h45', classesByTimeslot['10h45'] || []);
        
        // Render teachers list
        this.renderTeachersList();
        
        // Render unassigned classes
        this.renderUnassignedClasses();
        
        // Update filter dropdowns
        this.updateFilterDropdowns();
    }
    
    /**
     * Group classes by timeslot
     */
    groupClassesByTimeslot() {
        const grouped = {
            '8h45': [],
            '10h45': [],
            'unassigned': []
        };
        
        this.classesList.forEach(cls => {
            const timeslot = cls.time_slot || 'unassigned';
            if (grouped[timeslot]) {
                grouped[timeslot].push(cls);
            } else {
                grouped['unassigned'].push(cls);
            }
        });
        
        return grouped;
    }
    
    /**
     * Render classes for a specific timeslot
     */
    renderTimeslotClasses(timeslot, classes) {
        const container = document.getElementById(`classes-${timeslot}`);
        if (!container) return;
        
        if (classes.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucune classe pour ce créneau</p>';
            return;
        }
        
        container.innerHTML = classes.map(cls => this.createClassCard(cls)).join('');
    }
    
    /**
     * Create HTML for a class card
     */
    createClassCard(cls) {
        const teacherName = cls.teacher_name || 'Non assigné';
        const studentCount = cls.student_count || 0;
        
        return `
            <div class="class-card" onclick="classManager.showClassDetails(${cls.id})">
                <div class="class-card-header">
                    <div class="class-name">📚 ${cls.name}</div>
                    <div class="class-actions">
                        <button onclick="event.stopPropagation(); classManager.editGroup(${cls.id})" title="Modifier">
                            ✏️
                        </button>
                        <button onclick="event.stopPropagation(); classManager.deleteGroup(${cls.id})" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="class-info-item">
                    <span>👨‍🏫</span>
                    <span>${teacherName}</span>
                </div>
                <div class="class-info-item">
                    <span>🕐</span>
                    <span>${cls.time_slot || '-'}</span>
                </div>
                <div class="class-info-item">
                    <span>👥</span>
                    <span>${studentCount} élèves</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render teachers list
     */
    renderTeachersList() {
        const container = document.getElementById('teachers-list');
        if (!container) return;
        
        if (this.teachersList.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun professeur</p>';
            return;
        }
        
        container.innerHTML = this.teachersList.map(teacher => `
            <div class="teacher-card">
                <div class="teacher-name">👨‍🏫 ${teacher.full_name}</div>
                <div class="teacher-classes">
                    ${teacher.class_count || 0} classe(s)
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render unassigned classes
     */
    renderUnassignedClasses() {
        const container = document.getElementById('unassigned-classes');
        if (!container) return;
        
        const unassigned = this.classesList.filter(cls => !cls.teacher_id);
        
        if (unassigned.length === 0) {
            container.innerHTML = '<p class="empty-state">Toutes les classes ont un professeur</p>';
            return;
        }
        
        container.innerHTML = unassigned.map(cls => this.createClassCard(cls)).join('');
    }
    
    /**
     * Update statistics dashboard
     */
    updateStatistics() {
        const teacherCount = this.teachersList.length;
        const classCount = this.classesList.length;
        const studentCount = this.classesList.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
        
        document.getElementById('stat-teachers').textContent = teacherCount;
        document.getElementById('stat-classes').textContent = classCount;
        document.getElementById('stat-students').textContent = studentCount;
    }
    
    /**
     * Update filter dropdowns
     */
    updateFilterDropdowns() {
        const teacherFilter = document.getElementById('filter-teacher');
        if (teacherFilter) {
            teacherFilter.innerHTML = '<option value="all">Tous / الكل</option>' +
                this.teachersList.map(t => `<option value="${t.id}">${t.full_name}</option>`).join('');
        }
    }
    
    /**
     * Show class details modal
     */
    async showClassDetails(classId) {
        console.log('📋 Showing details for class:', classId);
        
        const cls = this.classesList.find(c => c.id === classId);
        if (!cls) return;
        
        this.currentClassData = cls;
        
        // Update modal content
        document.getElementById('modal-class-title').textContent = `📚 ${cls.name}`;
        document.getElementById('class-teacher-name').textContent = cls.teacher_name || 'Non assigné';
        document.getElementById('class-timeslot').textContent = cls.time_slot || '-';
        document.getElementById('class-student-count').textContent = cls.student_count || 0;
        
        // Load students list
        await this.loadClassStudents(classId);
        
        // Show modal
        this.showModal('modal-class-details');
    }
    
    /**
     * Load students for a class
     */
    async loadClassStudents(classId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/groups/${classId}/`, {
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) throw new Error('Failed to load students');
            
            const data = await response.json();
            const students = data.members || [];
            
            const container = document.getElementById('class-students-list');
            if (students.length === 0) {
                container.innerHTML = '<p class="empty-state">Aucun élève dans cette classe</p>';
            } else {
                container.innerHTML = students.map(student => `
                    <div class="student-item">
                        <span>👤 ${student.full_name}</span>
                        <button class="btn btn-sm btn-danger" onclick="classManager.removeStudentFromClass(${student.id})">
                            ❌ Retirer
                        </button>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showToast('Erreur lors du chargement des élèves', 'error');
        }
    }
    
    /**
     * Create new group
     */
    async createGroup() {
        const name = document.getElementById('group-name').value.trim();
        const timeslot = document.getElementById('group-timeslot').value;
        const teacherId = document.getElementById('group-teacher').value;
        const description = document.getElementById('group-description').value.trim();
        
        if (!name || !timeslot) {
            this.showToast('Veuillez remplir tous les champs obligatoires', 'warning');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/groups/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    name,
                    time_slot: timeslot,
                    teacher_id: teacherId || null,
                    description
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la création');
            }
            
            this.showToast('✅ Classe créée avec succès', 'success');
            this.closeModal('modal-group');
            await this.loadClassesAndTeachers();
            
        } catch (error) {
            console.error('Error creating group:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Edit group
     */
    async editGroup(groupId) {
        const cls = this.classesList.find(c => c.id === groupId);
        if (!cls) return;
        
        this.currentGroupId = groupId;
        
        // Populate form
        document.getElementById('modal-group-title').textContent = '✏️ Modifier la classe';
        document.getElementById('group-name').value = cls.name;
        document.getElementById('group-timeslot').value = cls.time_slot || '';
        document.getElementById('group-teacher').value = cls.teacher_id || '';
        document.getElementById('group-description').value = cls.description || '';
        
        this.showModal('modal-group');
    }
    
    /**
     * Delete group
     */
    async deleteGroup(groupId) {
        const cls = this.classesList.find(c => c.id === groupId);
        if (!cls) return;
        
        this.currentGroupId = groupId;
        
        document.getElementById('delete-confirm-message').textContent = 
            `Êtes-vous sûr de vouloir supprimer la classe "${cls.name}" ?`;
        
        this.showModal('modal-delete-confirm');
    }
    
    /**
     * Confirm delete
     */
    async confirmDelete() {
        if (!this.currentGroupId) return;
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/groups/${this.currentGroupId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la suppression');
            }
            
            this.showToast('✅ Classe supprimée avec succès', 'success');
            this.closeModal('modal-delete-confirm');
            await this.loadClassesAndTeachers();
            
        } catch (error) {
            console.error('Error deleting group:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
            this.currentGroupId = null;
        }
    }
    
    /**
     * Assign student to group
     */
    async assignStudentToGroup(studentId, groupId) {
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/student-group-assignment/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    student_id: studentId,
                    group_id: groupId
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de l\'assignation');
            }
            
            this.showToast('✅ Élève assigné avec succès', 'success');
            this.closeModal('modal-add-student');
            await this.loadClassStudents(groupId);
            
        } catch (error) {
            console.error('Error assigning student:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Remove student from class
     */
    async removeStudentFromClass(studentId) {
        if (!this.currentClassData) return;
        
        if (!confirm('Retirer cet élève de la classe ?')) return;
        
        // Implementation would call API to remove student
        this.showToast('Fonctionnalité en cours de développement', 'warning');
    }
    
    /**
     * Search students
     */
    async searchStudents() {
        const query = document.getElementById('student-search').value.trim();
        if (query.length < 2) return;
        
        // Implementation would call API to search students
        console.log('Searching for:', query);
    }
    
    /**
     * Filter by timeslot
     */
    filterByTimeslot() {
        const timeslot = document.getElementById('filter-timeslot').value;
        console.log('Filter by timeslot:', timeslot);
        
        // Show/hide timeslot sections
        document.querySelectorAll('.timeslot-section').forEach(section => {
            if (timeslot === 'all') {
                section.style.display = 'block';
            } else {
                section.style.display = section.dataset.timeslot === timeslot ? 'block' : 'none';
            }
        });
    }
    
    /**
     * Filter by teacher
     */
    filterByTeacher() {
        const teacherId = document.getElementById('filter-teacher').value;
        console.log('Filter by teacher:', teacherId);
        
        // Implementation would filter classes by teacher
    }
    
    /**
     * Utility: Show/hide modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Reset form if it's the group modal
        if (modalId === 'modal-group') {
            document.getElementById('form-group').reset();
            this.currentGroupId = null;
        }
    }
    
    /**
     * Utility: Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    /**
     * Utility: Show/hide loading spinner
     */
    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }
    
    /**
     * Utility: Get CSRF token
     */
    getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
}

// Global functions for onclick handlers
let classManager;

function openCreateGroupModal() {
    document.getElementById('modal-group-title').textContent = '➕ Créer une classe / إنشاء فصل';
    document.getElementById('form-group').reset();
    classManager.currentGroupId = null;
    classManager.showModal('modal-group');
}

function saveGroup() {
    if (classManager.currentGroupId) {
        // Update existing group
        classManager.updateGroup();
    } else {
        // Create new group
        classManager.createGroup();
    }
}

function refreshData() {
    classManager.loadClassesAndTeachers();
}

function closeModal(modalId) {
    classManager.closeModal(modalId);
}

function confirmDelete() {
    classManager.confirmDelete();
}

function filterByTimeslot() {
    classManager.filterByTimeslot();
}

function filterByTeacher() {
    classManager.filterByTeacher();
}

function openAddStudentModal() {
    classManager.showModal('modal-add-student');
}

function searchStudents() {
    classManager.searchStudents();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    classManager = new ClassManagementController();
});
