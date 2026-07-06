/**
 * ============================================================
 *  UI CONTROLLER
 *  Handles all DOM updates, modals, and UI state management
 *  For Ghost Vault - Plausible Deniability Password Manager
 *  Pure Vanilla JS - No external dependencies.
 * ============================================================
 */

const UI = (function () {
    'use strict';

    // ---- CACHE DOM ELEMENTS ----
    var elements = {
        // Lock Screen
        lockScreen: document.getElementById('lockScreen'),
        passwordInput: document.getElementById('passwordInput'),
        togglePass: document.getElementById('togglePass'),
        unlockBtn: document.getElementById('unlockBtn'),
        statusOutput: document.getElementById('statusOutput'),

        // Dashboard
        vaultDashboard: document.getElementById('vaultDashboard'),
        realBadge: document.getElementById('realBadge'),
        decoyBadge: document.getElementById('decoyBadge'),
        entriesList: document.getElementById('entriesList'),
        entryCount: document.getElementById('entryCount'),
        vaultId: document.getElementById('vaultId'),
        addEntryBtn: document.getElementById('addEntryBtn'),
        exportBtn: document.getElementById('exportBtn'),
        lockBtn: document.getElementById('lockBtn'),
        emptyState: document.getElementById('emptyState'),

        // Entry Modal
        entryModal: document.getElementById('entryModal'),
        entryModalTitle: document.getElementById('entryModalTitle'),
        entryService: document.getElementById('entryService'),
        entryUsername: document.getElementById('entryUsername'),
        entryPassword: document.getElementById('entryPassword'),
        toggleEntryPass: document.getElementById('toggleEntryPass'),
        saveEntryBtn: document.getElementById('saveEntryBtn'),
        cancelEntryBtn: document.getElementById('cancelEntryBtn'),
        closeEntryModal: document.getElementById('closeEntryModal'),

        // Confirm Delete Modal
        confirmModal: document.getElementById('confirmModal'),
        deleteEntryName: document.getElementById('deleteEntryName'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
        cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),

        // Progress
        progressContainer: document.getElementById('progressContainer'),
        progressBar: document.getElementById('progressBar'),
        progressText: document.getElementById('progressText')
    };

    // ---- PRIVATE STATE ----
    var _editingEntryId = null;

    // ---- PRIVATE HELPERS ----

    /**
     * Escape HTML to prevent XSS
     * @param {string} text
     * @returns {string}
     */
    function _escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render entries in the list
     * @param {Array} entries - Array of entry objects
     */
    function _renderEntries(entries) {
        if (!elements.entriesList) return;

        if (!entries || entries.length === 0) {
            if (elements.emptyState) {
                elements.emptyState.style.display = 'flex';
            }
            elements.entriesList.innerHTML = '';
            return;
        }

        if (elements.emptyState) {
            elements.emptyState.style.display = 'none';
        }

        var html = '';
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var displayPass = '•'.repeat(Math.min(entry.password.length, 8));
            html += '<div class="entry-row" data-id="' + _escapeHtml(entry.id) + '">';
            html += '<span class="col-service">' + _escapeHtml(entry.service) + '</span>';
            html += '<span class="col-username">' + _escapeHtml(entry.username) + '</span>';
            html += '<span class="col-password">' + _escapeHtml(displayPass) + '</span>';
            html += '<span class="col-actions">';
            html += '<button type="button" class="action-icon edit" data-id="' + _escapeHtml(entry.id) + '" aria-label="Edit entry">✎</button>';
            html += '<button type="button" class="action-icon delete" data-id="' + _escapeHtml(entry.id) + '" aria-label="Delete entry">✕</button>';
            html += '</span>';
            html += '</div>';
        }

        elements.entriesList.innerHTML = html;
    }

    /**
     * Show/hide elements based on lock state
     * @param {boolean} isLocked - True if locked
     */
    function _setLockState(isLocked) {
        if (isLocked) {
            if (elements.lockScreen) {
                elements.lockScreen.style.display = 'flex';
            }
            if (elements.vaultDashboard) {
                elements.vaultDashboard.classList.add('hidden');
            }
        } else {
            if (elements.lockScreen) {
                elements.lockScreen.style.display = 'none';
            }
            if (elements.vaultDashboard) {
                elements.vaultDashboard.classList.remove('hidden');
            }
        }
    }

    // ---- PUBLIC API ----

    return {

        // ============================================================
        // LOCK SCREEN
        // ============================================================

        /**
         * Show the lock screen
         */
        showLockScreen: function () {
            _setLockState(true);
            if (elements.passwordInput) {
                elements.passwordInput.value = '';
                elements.passwordInput.focus();
            }
            if (elements.statusOutput) {
                UI.updateStatus('// awaiting authentication ...', 'info');
            }
        },

        /**
         * Show the dashboard (vault unlocked)
         * @param {string} vaultType - 'real' or 'decoy'
         */
        showDashboard: function (vaultType) {
            _setLockState(false);

            // Show correct badge
            if (vaultType === 'real') {
                if (elements.realBadge) {
                    elements.realBadge.style.display = 'inline-block';
                }
                if (elements.decoyBadge) {
                    elements.decoyBadge.classList.add('hidden');
                }
            } else {
                if (elements.realBadge) {
                    elements.realBadge.style.display = 'none';
                }
                if (elements.decoyBadge) {
                    elements.decoyBadge.classList.remove('hidden');
                }
            }

            // Update vault ID
            if (elements.vaultId) {
                elements.vaultId.textContent = VaultManager.getVaultId(vaultType);
            }

            UI.updateStatus('// vault unlocked: ' + vaultType.toUpperCase() + ' vault active', 'success');
        },

        /**
         * Get the password from input
         * @returns {string}
         */
        getPassword: function () {
            return elements.passwordInput ? elements.passwordInput.value : '';
        },

        /**
         * Toggle password visibility
         */
        togglePasswordVisibility: function () {
            if (!elements.passwordInput || !elements.togglePass) return;
            if (elements.passwordInput.type === 'password') {
                elements.passwordInput.type = 'text';
                elements.togglePass.textContent = 'HIDE';
            } else {
                elements.passwordInput.type = 'password';
                elements.togglePass.textContent = 'SHOW';
            }
        },

        /**
         * Clear password input
         */
        clearPassword: function () {
            if (elements.passwordInput) {
                elements.passwordInput.value = '';
                elements.passwordInput.type = 'password';
            }
            if (elements.togglePass) {
                elements.togglePass.textContent = 'SHOW';
            }
        },

        // ============================================================
        // ENTRIES
        // ============================================================

        /**
         * Update the entries list
         * @param {Array} entries - Array of entry objects
         */
        updateEntries: function (entries) {
            _renderEntries(entries);
            if (elements.entryCount) {
                var count = entries ? entries.length : 0;
                elements.entryCount.textContent = count + ' entry' + (count !== 1 ? 's' : '');
            }
        },

        /**
         * Get entry data from modal inputs
         * @returns {Object} { service, username, password }
         */
        getEntryFormData: function () {
            return {
                service: elements.entryService ? elements.entryService.value : '',
                username: elements.entryUsername ? elements.entryUsername.value : '',
                password: elements.entryPassword ? elements.entryPassword.value : ''
            };
        },

        /**
         * Set entry form data (for editing)
         * @param {Object} entry - { service, username, password }
         */
        setEntryFormData: function (entry) {
            if (elements.entryService) {
                elements.entryService.value = entry.service || '';
            }
            if (elements.entryUsername) {
                elements.entryUsername.value = entry.username || '';
            }
            if (elements.entryPassword) {
                elements.entryPassword.value = entry.password || '';
            }
        },

        /**
         * Clear entry form
         */
        clearEntryForm: function () {
            if (elements.entryService) {
                elements.entryService.value = '';
            }
            if (elements.entryUsername) {
                elements.entryUsername.value = '';
            }
            if (elements.entryPassword) {
                elements.entryPassword.value = '';
            }
            if (elements.entryPassword) {
                elements.entryPassword.type = 'password';
            }
            if (elements.toggleEntryPass) {
                elements.toggleEntryPass.textContent = 'SHOW';
            }
            _editingEntryId = null;
        },

        /**
         * Set editing mode for entry modal
         * @param {string} entryId - ID of entry being edited
         */
        setEditingEntryId: function (entryId) {
            _editingEntryId = entryId;
        },

        /**
         * Get editing entry ID
         * @returns {string|null}
         */
        getEditingEntryId: function () {
            return _editingEntryId;
        },

        /**
         * Show entry modal for adding
         */
        showAddModal: function () {
            this.clearEntryForm();
            if (elements.entryModalTitle) {
                elements.entryModalTitle.textContent = 'ADD ENTRY';
            }
            if (elements.saveEntryBtn) {
                elements.saveEntryBtn.textContent = 'SAVE ENTRY';
            }
            if (elements.entryModal) {
                elements.entryModal.classList.remove('hidden');
            }
            setTimeout(function () {
                if (elements.entryService) {
                    elements.entryService.focus();
                }
            }, 100);
        },

        /**
         * Show entry modal for editing
         * @param {Object} entry - Entry data to edit
         */
        showEditModal: function (entry) {
            this.setEntryFormData(entry);
            this.setEditingEntryId(entry.id);
            if (elements.entryModalTitle) {
                elements.entryModalTitle.textContent = 'EDIT ENTRY';
            }
            if (elements.saveEntryBtn) {
                elements.saveEntryBtn.textContent = 'UPDATE ENTRY';
            }
            if (elements.entryModal) {
                elements.entryModal.classList.remove('hidden');
            }
            setTimeout(function () {
                if (elements.entryService) {
                    elements.entryService.focus();
                }
            }, 100);
        },

        /**
         * Hide entry modal
         */
        hideEntryModal: function () {
            if (elements.entryModal) {
                elements.entryModal.classList.add('hidden');
            }
            this.clearEntryForm();
            _editingEntryId = null;
        },

        /**
         * Toggle entry password visibility
         */
        toggleEntryPasswordVisibility: function () {
            if (!elements.entryPassword || !elements.toggleEntryPass) return;
            if (elements.entryPassword.type === 'password') {
                elements.entryPassword.type = 'text';
                elements.toggleEntryPass.textContent = 'HIDE';
            } else {
                elements.entryPassword.type = 'password';
                elements.toggleEntryPass.textContent = 'SHOW';
            }
        },

        // ============================================================
        // CONFIRM DELETE MODAL
        // ============================================================

        /**
         * Show confirm delete modal
         * @param {string} entryName - Name of the entry to delete
         * @param {string} entryId - ID of the entry to delete
         */
        showConfirmDelete: function (entryName, entryId) {
            if (elements.deleteEntryName) {
                elements.deleteEntryName.textContent = entryName || 'this entry';
            }
            if (elements.confirmModal) {
                elements.confirmModal.classList.remove('hidden');
            }
            // Store the entry ID to delete on confirmation
            if (elements.confirmDeleteBtn) {
                elements.confirmDeleteBtn.setAttribute('data-id', entryId);
            }
        },

        /**
         * Hide confirm delete modal
         */
        hideConfirmDelete: function () {
            if (elements.confirmModal) {
                elements.confirmModal.classList.add('hidden');
            }
            if (elements.confirmDeleteBtn) {
                elements.confirmDeleteBtn.removeAttribute('data-id');
            }
        },

        /**
         * Get the entry ID to delete from confirm button
         * @returns {string|null}
         */
        getDeleteEntryId: function () {
            if (elements.confirmDeleteBtn) {
                return elements.confirmDeleteBtn.getAttribute('data-id');
            }
            return null;
        },

        // ============================================================
        // STATUS / TERMINAL
        // ============================================================

        /**
         * Update the terminal status line
         * @param {string} message - The message to display
         * @param {string} type - 'info', 'success', or 'error'
         */
        updateStatus: function (message, type) {
            if (!elements.statusOutput) return;
            var prompt = '<span class="prompt">root@ghost:~$</span>';
            var cmd = '<span class="cmd">./vault --status</span>';
            var responseClass = 'response';
            if (type === 'success') {
                responseClass += ' success';
            } else if (type === 'error') {
                responseClass += ' error';
            }
            var response = '<span class="' + responseClass + '">' + _escapeHtml(message) + '</span>';
            elements.statusOutput.innerHTML = prompt + ' ' + cmd + ' ' + response;
        },

        // ============================================================
        // PROGRESS BAR
        // ============================================================

        /**
         * Show progress bar
         */
        showProgress: function () {
            if (elements.progressContainer) {
                elements.progressContainer.classList.remove('hidden');
            }
            this.updateProgress(0);
        },

        /**
         * Hide progress bar
         */
        hideProgress: function () {
            if (elements.progressContainer) {
                elements.progressContainer.classList.add('hidden');
            }
            this.updateProgress(0);
        },

        /**
         * Update progress percentage
         * @param {number} percent - 0 to 100
         */
        updateProgress: function (percent) {
            var clamped = Math.min(100, Math.max(0, percent));
            if (elements.progressBar) {
                elements.progressBar.style.width = clamped + '%';
            }
            if (elements.progressText) {
                elements.progressText.textContent = Math.round(clamped) + '%';
            }
        },

        // ============================================================
        // BUTTON STATE
        // ============================================================

        /**
         * Enable or disable action buttons
         * @param {boolean} enabled - Enable all dashboard buttons
         */
        setButtonsEnabled: function (enabled) {
            if (elements.addEntryBtn) {
                elements.addEntryBtn.disabled = !enabled;
            }
            if (elements.exportBtn) {
                elements.exportBtn.disabled = !enabled;
            }
            if (elements.lockBtn) {
                elements.lockBtn.disabled = !enabled;
            }
        },

        /**
         * Show error modal
         * @param {string} message - Error message
         */
        showError: function (message) {
            // Use simple alert for now, or a custom modal
            alert('❌ ' + message);
        },

        /**
         * Show success message
         * @param {string} message - Success message
         */
        showSuccess: function (message) {
            // Use simple alert for now, or a custom modal
            alert('✅ ' + message);
        },

        // ============================================================
        // INIT / RESET
        // ============================================================

        /**
         * Reset UI to idle state
         */
        resetUI: function () {
            this.showLockScreen();
            this.hideEntryModal();
            this.hideConfirmDelete();
            this.hideProgress();
            this.setButtonsEnabled(false);
            if (elements.entriesList) {
                elements.entriesList.innerHTML = '';
            }
            if (elements.entryCount) {
                elements.entryCount.textContent = '0 entries';
            }
            if (elements.vaultId) {
                elements.vaultId.textContent = '—';
            }
            if (elements.realBadge) {
                elements.realBadge.style.display = 'none';
            }
            if (elements.decoyBadge) {
                elements.decoyBadge.classList.add('hidden');
            }
            this.clearPassword();
            this.updateStatus('// awaiting authentication ...', 'info');
        },

        /**
         * Initialize all event listeners
         */
        init: function () {
            // Toggle password visibility (lock screen)
            if (elements.togglePass) {
                elements.togglePass.addEventListener('click', this.togglePasswordVisibility.bind(this));
            }

            // Toggle password visibility (entry modal)
            if (elements.toggleEntryPass) {
                elements.toggleEntryPass.addEventListener('click', this.toggleEntryPasswordVisibility.bind(this));
            }

            // Close entry modal
            if (elements.closeEntryModal) {
                elements.closeEntryModal.addEventListener('click', this.hideEntryModal.bind(this));
            }

            if (elements.cancelEntryBtn) {
                elements.cancelEntryBtn.addEventListener('click', this.hideEntryModal.bind(this));
            }

            // Close confirm delete modal
            if (elements.cancelDeleteBtn) {
                elements.cancelDeleteBtn.addEventListener('click', this.hideConfirmDelete.bind(this));
            }

            // Click on overlay closes entry modal
            if (elements.entryModal) {
                elements.entryModal.addEventListener('click', function (e) {
                    if (e.target === elements.entryModal) {
                        UI.hideEntryModal();
                    }
                });
            }

            // Click on overlay closes confirm modal
            if (elements.confirmModal) {
                elements.confirmModal.addEventListener('click', function (e) {
                    if (e.target === elements.confirmModal) {
                        UI.hideConfirmDelete();
                    }
                });
            }

            // Enter key on password input triggers unlock
            if (elements.passwordInput) {
                elements.passwordInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (elements.unlockBtn && !elements.unlockBtn.disabled) {
                            elements.unlockBtn.click();
                        }
                    }
                });
            }

            // Set initial state
            this.resetUI();

            console.log('✅ UI Controller initialized.');
        }
    };
})();

// Make UI globally accessible
window.UI = UI;