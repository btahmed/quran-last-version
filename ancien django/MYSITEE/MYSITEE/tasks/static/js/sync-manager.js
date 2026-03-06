/**
 * Sync Manager
 * Handles global synchronization and real-time updates across all views
 */

class SyncManager {
    constructor() {
        this.subscribers = new Map();
        this.pollInterval = 5000; // 5 seconds
        this.pollTimer = null;
        this.lastSyncTimestamp = null;
        this.localCache = new Map();
        this.isPolling = false;
        
        this.init();
    }
    
    init() {
        console.log('🔄 Initializing SyncManager...');
        this.startPolling();
        
        // Listen for visibility changes to pause/resume polling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopPolling();
            } else {
                this.startPolling();
            }
        });
    }
    
    /**
     * Subscribe to sync events
     * @param {string} viewName - Name of the view (admin, teacher, student)
     * @param {Function} callback - Function to call when sync occurs
     */
    subscribe(viewName, callback) {
        if (!this.subscribers.has(viewName)) {
            this.subscribers.set(viewName, []);
        }
        
        this.subscribers.get(viewName).push(callback);
        console.log(`📡 ${viewName} subscribed to sync events`);
    }
    
    /**
     * Unsubscribe from sync events
     */
    unsubscribe(viewName, callback) {
        if (this.subscribers.has(viewName)) {
            const callbacks = this.subscribers.get(viewName);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * Notify subscribers of changes
     */
    notify(changeType, data) {
        console.log(`🔔 Notifying subscribers of ${changeType}`, data);
        
        // Determine which views are affected
        const affectedViews = this.getAffectedViews(changeType);
        
        affectedViews.forEach(viewName => {
            if (this.subscribers.has(viewName)) {
                this.subscribers.get(viewName).forEach(callback => {
                    try {
                        callback(changeType, data);
                    } catch (error) {
                        console.error(`Error in ${viewName} callback:`, error);
                    }
                });
            }
        });
    }
    
    /**
     * Determine which views are affected by a change type
     */
    getAffectedViews(changeType) {
        const viewMap = {
            'group_created': ['admin', 'teacher'],
            'group_updated': ['admin', 'teacher'],
            'group_deleted': ['admin', 'teacher'],
            'student_assigned': ['admin', 'teacher', 'student'],
            'student_profile_updated': ['admin', 'teacher', 'student'],
            'teacher_assigned': ['admin', 'teacher'],
            'teacher_removed': ['admin', 'teacher']
        };
        
        return viewMap[changeType] || ['admin'];
    }
    
    /**
     * Start polling for updates
     */
    startPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        console.log('▶️ Starting sync polling...');
        
        this.pollForUpdates();
        this.pollTimer = setInterval(() => {
            this.pollForUpdates();
        }, this.pollInterval);
    }
    
    /**
     * Stop polling
     */
    stopPolling() {
        if (!this.isPolling) return;
        
        this.isPolling = false;
        console.log('⏸️ Stopping sync polling...');
        
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
    
    /**
     * Poll for updates from server
     */
    async pollForUpdates() {
        try {
            const params = new URLSearchParams();
            if (this.lastSyncTimestamp) {
                params.append('since', this.lastSyncTimestamp);
            }
            
            const response = await fetch(`/api/admin/sync-updates/?${params}`, {
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                console.warn('Sync poll failed:', response.status);
                return;
            }
            
            const data = await response.json();
            
            if (data.updates && data.updates.length > 0) {
                console.log(`📥 Received ${data.updates.length} updates`);
                
                data.updates.forEach(update => {
                    this.notify(update.change_type, update.data);
                    this.invalidateCache(update.affected_caches);
                });
                
                this.lastSyncTimestamp = data.timestamp;
            }
            
        } catch (error) {
            console.error('Error polling for updates:', error);
        }
    }
    
    /**
     * Invalidate local cache
     */
    invalidateCache(cacheKeys) {
        if (!cacheKeys || !Array.isArray(cacheKeys)) return;
        
        cacheKeys.forEach(key => {
            if (this.localCache.has(key)) {
                console.log(`🗑️ Invalidating cache: ${key}`);
                this.localCache.delete(key);
            }
        });
    }
    
    /**
     * Get cached data
     */
    getCached(key) {
        const cached = this.localCache.get(key);
        if (!cached) return null;
        
        // Check if cache is still valid (5 minutes TTL)
        const now = Date.now();
        if (now - cached.timestamp > 300000) {
            this.localCache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    /**
     * Set cached data
     */
    setCached(key, data) {
        this.localCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Clear all cache
     */
    clearCache() {
        console.log('🧹 Clearing all cache');
        this.localCache.clear();
    }
    
    /**
     * Show sync indicator
     */
    showSyncIndicator() {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.style.display = 'block';
            indicator.textContent = '🔄 Synchronisation...';
        }
    }
    
    /**
     * Hide sync indicator
     */
    hideSyncIndicator() {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 1000);
        }
    }
    
    /**
     * Utility: Get CSRF token
     */
    getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
}

// Global instance
const syncManager = new SyncManager();

// Expose globally
window.syncManager = syncManager;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncManager;
}
