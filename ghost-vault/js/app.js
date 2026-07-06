/**
 * ============================================================
 *  APP - MAIN CONTROLLER
 *  Connects UI, VaultManager, and CryptoEngine together.
 *  Handles unlock, lock, CRUD operations, export, and setup.
 *  Pure Vanilla JS - No external dependencies.
 * ============================================================
 */

(function () {
    'use strict';

    // ---- DOM REFERENCES ----
    var unlockBtn = document.getElementById('unlockBtn');
    var lockBtn = document.getElementById('lockBtn');
    var addEntryBtn = document.getElementById('addEntryBtn');
    var saveEntryBtn = document.getElementById('saveEntryBtn');
    var exportBtn = document.getElementById('exportBtn');
    var confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    var entriesList = document.getElementById('entriesList');

    // ---- PRIVATE STATE ----
    var currentEntries = [];
    var currentVaultType = null; // 'real' or 'decoy'
    var currentPassword = '';

    // ---- HELPERS ----

    /**
     * Load entries into UI
     * @param {Array} entries - Array of entry objects
     */
    function _loadEntries(entries) {
        currentEntries = entries || [];
        UI.updateEntries(currentEntries);
    }

    /**
     * Unlock a specific vault
     * @param {string} password - Vault password
     * @param {string} type - 'real' or 'decoy'
     */
    async function _unlockVault(password, type) {
        try {
            UI.showProgress();
            UI.updateProgress(10);
            UI.updateStatus('// unlocking ' + type + ' vault ...', 'info');

            var entries = await VaultManager.unlockVault(password, type);

            UI.updateProgress(60);
            currentPassword = password;
            currentVaultType = type;
            _loadEntries(entries);

            UI.updateProgress(100);
            UI.showDashboard(type);
            UI.setButtonsEnabled(true);
            UI.hideProgress();
            UI.updateStatus('// vault unlocked: ' + entries.length + ' entries loaded', 'success');
        } catch (error) {
            UI.hideProgress();
            UI.showError('Failed to unlock vault: ' + error.message);
            UI.updateStatus('ERROR: ' + error.message, 'error');
            UI.setButtonsEnabled(false);
            throw error;
        }
    }

    /**
     * Handle unlock button click
     */
    async function _handleUnlock() {
        var password = UI.getPassword();
        if (!password || password.length < 4) {
            UI.updateStatus('ERROR: Password must be at least 4 characters.', 'error');
            UI.showError('Password must be at least 4 characters.');
            return;
        }

        // Disable button to prevent double-click
        if (unlockBtn) {
            unlockBtn.disabled = true;
        }

        try {
            // First, check if setup is complete
            if (!VaultManager.isSetupComplete()) {
                UI.updateStatus('// first-time setup required ...', 'info');
                var realPass = prompt('🔐 First-time setup!\n\nEnter REAL VAULT password (min 4 chars):');
                if (!realPass || realPass.length < 4) {
                    UI.updateStatus('ERROR: Real password must be at least 4 characters.', 'error');
                    if (unlockBtn) unlockBtn.disabled = false;
                    return;
                }

                var decoyPass = prompt('🎭 Enter DECOY VAULT password (min 4 chars, different from real):');
                if (!decoyPass || decoyPass.length < 4) {
                    UI.updateStatus('ERROR: Decoy password must be at least 4 characters.', 'error');
                    if (unlockBtn) unlockBtn.disabled = false;
                    return;
                }

                if (realPass === decoyPass) {
                    UI.updateStatus('ERROR: Real and decoy passwords must be different.', 'error');
                    UI.showError('Real and decoy passwords must be different.');
                    if (unlockBtn) unlockBtn.disabled = false;
                    return;
                }

                var initResult = await VaultManager.initVault(realPass, decoyPass);
                if (!initResult.success) {
                    UI.updateStatus('ERROR: ' + initResult.message, 'error');
                    UI.showError(initResult.message);
                    if (unlockBtn) unlockBtn.disabled = false;
                    return;
                }

                UI.updateStatus('// vault initialized! Please login with your real password.', 'success');
                UI.showSuccess('Vault initialized! Now login with your Real Password.');
                UI.clearPassword();
                if (unlockBtn) unlockBtn.disabled = false;
                return;
            }

            // Check against real vault
            var isReal = await VaultManager.verifyPassword(password, 'real');
            if (isReal) {
                await _unlockVault(password, 'real');
                if (unlockBtn) unlockBtn.disabled = false;
                return;
            }

            // Check against decoy vault
            var isDecoy = await VaultManager.verifyPassword(password, 'decoy');
            if (isDecoy) {
                await _unlockVault(password, 'decoy');
                if (unlockBtn) unlockBtn.disabled = false;
                return;
            }

            // If neither matches
            UI.updateStatus('ERROR: Invalid password.', 'error');
            UI.showError('Invalid password. Please try again.');
            UI.clearPassword();
            if (unlockBtn) unlockBtn.disabled = false;

        } catch (error) {
            UI.updateStatus('ERROR: ' + error.message, 'error');
            UI.showError('Unlock failed: ' + error.message);
            if (unlockBtn) unlockBtn.disabled = false;
        }
    }

    /**
     * Handle lock button click
     */
    function _handleLock() {
        currentEntries = [];
        currentVaultType = null;
        currentPassword = '';
        UI.resetUI();
        UI.updateStatus('// vault locked', 'info');
        UI.clearPassword();
        if (unlockBtn) {
            unlockBtn.disabled = false;
        }
    }

    /**
     * Handle add entry button click
     */
    function _handleAddEntry() {
        if (!currentVaultType) {
            UI.showError('Vault is not unlocked.');
            return;
        }
        UI.showAddModal();
        UI.updateStatus('// adding new entry ...', 'info');
    }

    /**
     * Handle save entry (add or edit)
     */
    async function _handleSaveEntry() {
        var formData = UI.getEntryFormData();
        var editingId = UI.getEditingEntryId();

        if (!formData.service || !formData.username || !formData.password) {
            UI.showError('All fields are required.');
            UI.updateStatus('ERROR: All fields are required.', 'error');
            return;
        }

        if (!currentVaultType || !currentPassword) {
            UI.showError('Vault is not unlocked.');
            UI.hideEntryModal();
            return;
        }

        try {
            UI.showProgress();
            UI.updateProgress(20);
            UI.updateStatus('// saving entry ...', 'info');

            var result;
            if (editingId) {
                // Edit existing entry
                result = await VaultManager.editEntry(
                    currentPassword,
                    currentVaultType,
                    editingId,
                    formData
                );
            } else {
                // Add new entry
                result = await VaultManager.addEntry(
                    currentPassword,
                    currentVaultType,
                    formData
                );
            }

            UI.updateProgress(80);

            if (result.success) {
                _loadEntries(result.entries);
                UI.hideEntryModal();
                UI.updateProgress(100);
                UI.updateStatus('// entry ' + (editingId ? 'updated' : 'added') + ' successfully!', 'success');
                UI.hideProgress();
            } else {
                UI.hideProgress();
                UI.showError(result.message);
                UI.updateStatus('ERROR: ' + result.message, 'error');
            }
        } catch (error) {
            UI.hideProgress();
            UI.showError('Failed to save entry: ' + error.message);
            UI.updateStatus('ERROR: ' + error.message, 'error');
        }
    }

    /**
     * Handle edit entry (delegated from entries list)
     * @param {string} entryId - ID of entry to edit
     */
    async function _handleEditEntry(entryId) {
        if (!currentVaultType || !currentPassword) {
            UI.showError('Vault is not unlocked.');
            return;
        }

        // Find the entry in currentEntries
        var entry = null;
        for (var i = 0; i < currentEntries.length; i++) {
            if (currentEntries[i].id === entryId) {
                entry = currentEntries[i];
                break;
            }
        }

        if (!entry) {
            UI.showError('Entry not found.');
            return;
        }

        UI.showEditModal(entry);
        UI.updateStatus('// editing entry: ' + entry.service, 'info');
    }

    /**
     * Handle delete entry (delegated from entries list)
     * @param {string} entryId - ID of entry to delete
     */
    function _handleDeleteEntry(entryId) {
        if (!currentVaultType || !currentPassword) {
            UI.showError('Vault is not unlocked.');
            return;
        }

        // Find the entry name for confirmation
        var entryName = 'this entry';
        for (var i = 0; i < currentEntries.length; i++) {
            if (currentEntries[i].id === entryId) {
                entryName = currentEntries[i].service;
                break;
            }
        }

        UI.showConfirmDelete(entryName, entryId);
        UI.updateStatus('// confirm delete: ' + entryName, 'info');
    }

    /**
     * Handle confirm delete
     */
    async function _handleConfirmDelete() {
        var entryId = UI.getDeleteEntryId();
        if (!entryId) {
            UI.showError('No entry selected for deletion.');
            UI.hideConfirmDelete();
            return;
        }

        if (!currentVaultType || !currentPassword) {
            UI.showError('Vault is not unlocked.');
            UI.hideConfirmDelete();
            return;
        }

        try {
            UI.showProgress();
            UI.updateProgress(20);
            UI.updateStatus('// deleting entry ...', 'info');

            var result = await VaultManager.deleteEntry(
                currentPassword,
                currentVaultType,
                entryId
            );

            UI.updateProgress(80);

            if (result.success) {
                _loadEntries(result.entries);
                UI.hideConfirmDelete();
                UI.updateProgress(100);
                UI.updateStatus('// entry deleted successfully!', 'success');
                UI.hideProgress();
            } else {
                UI.hideProgress();
                UI.showError(result.message);
                UI.updateStatus('ERROR: ' + result.message, 'error');
                UI.hideConfirmDelete();
            }
        } catch (error) {
            UI.hideProgress();
            UI.showError('Failed to delete entry: ' + error.message);
            UI.updateStatus('ERROR: ' + error.message, 'error');
            UI.hideConfirmDelete();
        }
    }

    /**
     * Handle export button click
     */
    async function _handleExport() {
        if (!currentVaultType || !currentPassword) {
            UI.showError('Vault is not unlocked.');
            return;
        }

        try {
            UI.showProgress();
            UI.updateProgress(20);
            UI.updateStatus('// exporting vault ...', 'info');

            var result = await VaultManager.exportVault(currentPassword, currentVaultType);

            UI.updateProgress(80);

            if (result.success) {
                // Create a blob and download
                var blob = new Blob([result.data], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.href = url;
                link.download = 'ghost_vault_' + currentVaultType + '_' + Date.now() + '.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(function () {
                    URL.revokeObjectURL(url);
                }, 5000);

                UI.updateProgress(100);
                UI.updateStatus('// vault exported successfully!', 'success');
                UI.hideProgress();
            } else {
                UI.hideProgress();
                UI.showError(result.message);
                UI.updateStatus('ERROR: ' + result.message, 'error');
            }
        } catch (error) {
            UI.hideProgress();
            UI.showError('Failed to export: ' + error.message);
            UI.updateStatus('ERROR: ' + error.message, 'error');
        }
    }

    /**
     * Handle clicks on entries list (delegated for edit/delete)
     * @param {Event} event
     */
    function _handleEntriesClick(event) {
        var target = event.target;
        // Check if click is on an action icon
        if (target.classList.contains('action-icon')) {
            var entryId = target.getAttribute('data-id');
            if (!entryId) return;

            if (target.classList.contains('edit')) {
                _handleEditEntry(entryId);
            } else if (target.classList.contains('delete')) {
                _handleDeleteEntry(entryId);
            }
        }
    }

    // ---- EVENT LISTENERS ----

    // 1. Unlock button
    if (unlockBtn) {
        unlockBtn.addEventListener('click', _handleUnlock);
    }

    // 2. Lock button
    if (lockBtn) {
        lockBtn.addEventListener('click', _handleLock);
    }

    // 3. Add entry button
    if (addEntryBtn) {
        addEntryBtn.addEventListener('click', _handleAddEntry);
    }

    // 4. Save entry button
    if (saveEntryBtn) {
        saveEntryBtn.addEventListener('click', _handleSaveEntry);
    }

    // 5. Confirm delete button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', _handleConfirmDelete);
    }

    // 6. Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', _handleExport);
    }

    // 7. Entries list (event delegation for edit/delete)
    if (entriesList) {
        entriesList.addEventListener('click', _handleEntriesClick);
    }

    // 8. Enter key on password input (already handled in UI.init, but we keep it here too)
    var passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (unlockBtn && !unlockBtn.disabled) {
                    unlockBtn.click();
                }
            }
        });
    }

    // ---- INITIALIZATION ----

    /**
     * Initialize the app
     */
    function init() {
        // Initialize UI
        UI.init();

        // Check if vault is set up
        if (VaultManager.isSetupComplete()) {
            UI.updateStatus('// vault ready. enter your passphrase.', 'info');
            if (unlockBtn) {
                unlockBtn.disabled = false;
            }
            if (passwordInput) {
                passwordInput.focus();
            }
        } else {
            UI.updateStatus('// first-time setup required. enter any password to initialize.', 'info');
            if (unlockBtn) {
                unlockBtn.disabled = false;
            }
            if (passwordInput) {
                passwordInput.focus();
            }
        }

        console.log('✅ Ghost Vault v1.0 initialized successfully.');
    }

    // Run init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();