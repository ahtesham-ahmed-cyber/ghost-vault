/**
 * ============================================================
 *  VAULT MANAGER
 *  Handles localStorage operations for Ghost Vault
 *  Dual vault system: Real Vault & Decoy Vault
 *  Pure Vanilla JS - No external dependencies.
 * ============================================================
 */

const VaultManager = (function () {
    'use strict';

    // ---- CONSTANTS ----
    var STORAGE_KEYS = {
        REAL_HASH: 'ghost_vault_real_hash',
        DECOY_HASH: 'ghost_vault_decoy_hash',
        REAL_DATA: 'ghost_vault_real_data',
        DECOY_DATA: 'ghost_vault_decoy_data',
        SETUP_COMPLETE: 'ghost_vault_setup_complete'
    };

    var DEFAULT_DECOY_ENTRIES = [
        { id: 'decoy_1', service: 'OldTwitter', username: 'testuser', password: '1234' },
        { id: 'decoy_2', service: 'TestAccount', username: 'demo', password: 'abc123' }
    ];

    // ---- PRIVATE HELPERS ----

    /**
     * Generate SHA-256 hash of a string (for password verification)
     * @param {string} text - Text to hash
     * @returns {Promise<string>}
     */
    async function _hashPassword(text) {
        var encoder = new TextEncoder();
        var data = encoder.encode(text);
        var hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    /**
     * Generate a unique ID for entries
     * @returns {string}
     */
    function _generateId() {
        return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    }

    /**
     * Get data from localStorage and decrypt
     * @param {string} key - Storage key
     * @param {string} password - Password for decryption
     * @returns {Promise<Array>}
     */
    async function _getDecryptedData(key, password) {
        var encrypted = localStorage.getItem(key);
        if (!encrypted) {
            return [];
        }

        try {
            // Parse encrypted data (IV + Salt + EncryptedData)
            var payload = JSON.parse(encrypted);
            var ivBuffer = _base64ToArrayBuffer(payload.iv);
            var saltBuffer = _base64ToArrayBuffer(payload.salt);
            var encryptedBuffer = _base64ToArrayBuffer(payload.data);

            // Decrypt
            var decryptedBuffer = await CryptoEngine.decrypt(
                encryptedBuffer,
                password,
                ivBuffer,
                saltBuffer
            );

            var decryptedText = new TextDecoder().decode(decryptedBuffer);
            return JSON.parse(decryptedText);
        } catch (_) {
            // If decryption fails, return empty array (wrong password or corrupted)
            return [];
        }
    }

    /**
     * Encrypt and save data to localStorage
     * @param {string} key - Storage key
     * @param {Array} data - Data to save
     * @param {string} password - Password for encryption
     * @returns {Promise<boolean>}
     */
    async function _setEncryptedData(key, data, password) {
        try {
            var jsonString = JSON.stringify(data);
            var encoder = new TextEncoder();
            var dataBuffer = encoder.encode(jsonString);

            // Encrypt
            var result = await CryptoEngine.encrypt(dataBuffer, password);

            // Build payload
            var payload = {
                iv: _arrayBufferToBase64(result.iv),
                salt: _arrayBufferToBase64(result.salt),
                data: _arrayBufferToBase64(result.encryptedData)
            };

            localStorage.setItem(key, JSON.stringify(payload));
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Convert ArrayBuffer to Base64
     * @param {ArrayBuffer} buffer
     * @returns {string}
     */
    function _arrayBufferToBase64(buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = '';
        var chunkSize = 8192;
        for (var i = 0; i < bytes.length; i += chunkSize) {
            var chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 to ArrayBuffer
     * @param {string} base64
     * @returns {ArrayBuffer}
     */
    function _base64ToArrayBuffer(base64) {
        var binary = atob(base64);
        var buffer = new ArrayBuffer(binary.length);
        var bytes = new Uint8Array(buffer);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return buffer;
    }

    // ---- PUBLIC API ----

    return {

        /**
         * Check if vault is set up (has real password)
         * @returns {boolean}
         */
        isSetupComplete: function () {
            return localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE) === 'true';
        },

        /**
         * Initialize the vault (first time setup)
         * @param {string} realPassword - Real vault password
         * @param {string} decoyPassword - Decoy vault password
         * @returns {Promise<Object>} { success: boolean, message: string }
         */
        initVault: async function (realPassword, decoyPassword) {
            if (!realPassword || realPassword.length < 4) {
                return { success: false, message: 'Real password must be at least 4 characters.' };
            }
            if (!decoyPassword || decoyPassword.length < 4) {
                return { success: false, message: 'Decoy password must be at least 4 characters.' };
            }
            if (realPassword === decoyPassword) {
                return { success: false, message: 'Real and decoy passwords must be different.' };
            }

            try {
                // Hash passwords for verification
                var realHash = await _hashPassword(realPassword);
                var decoyHash = await _hashPassword(decoyPassword);

                // Store hashes
                localStorage.setItem(STORAGE_KEYS.REAL_HASH, realHash);
                localStorage.setItem(STORAGE_KEYS.DECOY_HASH, decoyHash);

                // Initialize empty real vault
                await _setEncryptedData(STORAGE_KEYS.REAL_DATA, [], realPassword);

                // Initialize decoy vault with default entries
                await _setEncryptedData(STORAGE_KEYS.DECOY_DATA, DEFAULT_DECOY_ENTRIES, decoyPassword);

                // Mark setup as complete
                localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');

                return { success: true, message: 'Vault initialized successfully!' };
            } catch (_) {
                return { success: false, message: 'Failed to initialize vault. Please try again.' };
            }
        },

        /**
         * Verify a password against stored hash
         * @param {string} password - Password to verify
         * @param {string} type - 'real' or 'decoy'
         * @returns {Promise<boolean>}
         */
        verifyPassword: async function (password, type) {
            var hashKey = type === 'real' ? STORAGE_KEYS.REAL_HASH : STORAGE_KEYS.DECOY_HASH;
            var storedHash = localStorage.getItem(hashKey);

            if (!storedHash) {
                return false;
            }

            var inputHash = await _hashPassword(password);
            return inputHash === storedHash;
        },

        /**
         * Unlock a vault and return its entries
         * @param {string} password - Password for the vault
         * @param {string} type - 'real' or 'decoy'
         * @returns {Promise<Array>} Array of entries
         */
        unlockVault: async function (password, type) {
            var dataKey = type === 'real' ? STORAGE_KEYS.REAL_DATA : STORAGE_KEYS.DECOY_DATA;
            var entries = await _getDecryptedData(dataKey, password);

            // If decoy vault and empty, return default entries
            if (type === 'decoy' && entries.length === 0) {
                // Try to save default entries
                await _setEncryptedData(dataKey, DEFAULT_DECOY_ENTRIES, password);
                return DEFAULT_DECOY_ENTRIES;
            }

            return entries;
        },

        /**
         * Add a new entry to a vault
         * @param {string} password - Vault password
         * @param {string} type - 'real' or 'decoy'
         * @param {Object} entry - { service, username, password: string }
         * @returns {Promise<Object>} { success: boolean, message: string, entries: Array }
         */
        addEntry: async function (password, type, entry) {
            if (!entry.service || entry.service.trim() === '') {
                return { success: false, message: 'Service name is required.' };
            }
            if (!entry.username || entry.username.trim() === '') {
                return { success: false, message: 'Username is required.' };
            }
            if (!entry.password || entry.password.trim() === '') {
                return { success: false, message: 'Password is required.' };
            }

            try {
                var dataKey = type === 'real' ? STORAGE_KEYS.REAL_DATA : STORAGE_KEYS.DECOY_DATA;
                var entries = await _getDecryptedData(dataKey, password);

                var newEntry = {
                    id: _generateId(),
                    service: entry.service.trim(),
                    username: entry.username.trim(),
                    password: entry.password.trim()
                };

                entries.push(newEntry);
                var saved = await _setEncryptedData(dataKey, entries, password);

                if (saved) {
                    return { success: true, message: 'Entry added successfully!', entries: entries };
                } else {
                    return { success: false, message: 'Failed to save entry. Please try again.' };
                }
            } catch (_) {
                return { success: false, message: 'Failed to add entry. Wrong password or corrupted data.' };
            }
        },

        /**
         * Edit an existing entry in a vault
         * @param {string} password - Vault password
         * @param {string} type - 'real' or 'decoy'
         * @param {string} entryId - ID of entry to edit
         * @param {Object} updatedData - { service, username, password }
         * @returns {Promise<Object>} { success: boolean, message: string, entries: Array }
         */
        editEntry: async function (password, type, entryId, updatedData) {
            if (!entryId) {
                return { success: false, message: 'Entry ID is required.' };
            }
            if (!updatedData.service || updatedData.service.trim() === '') {
                return { success: false, message: 'Service name is required.' };
            }
            if (!updatedData.username || updatedData.username.trim() === '') {
                return { success: false, message: 'Username is required.' };
            }
            if (!updatedData.password || updatedData.password.trim() === '') {
                return { success: false, message: 'Password is required.' };
            }

            try {
                var dataKey = type === 'real' ? STORAGE_KEYS.REAL_DATA : STORAGE_KEYS.DECOY_DATA;
                var entries = await _getDecryptedData(dataKey, password);

                var foundIndex = -1;
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].id === entryId) {
                        foundIndex = i;
                        break;
                    }
                }

                if (foundIndex === -1) {
                    return { success: false, message: 'Entry not found.' };
                }

                entries[foundIndex] = {
                    id: entryId,
                    service: updatedData.service.trim(),
                    username: updatedData.username.trim(),
                    password: updatedData.password.trim()
                };

                var saved = await _setEncryptedData(dataKey, entries, password);

                if (saved) {
                    return { success: true, message: 'Entry updated successfully!', entries: entries };
                } else {
                    return { success: false, message: 'Failed to save entry. Please try again.' };
                }
            } catch (_) {
                return { success: false, message: 'Failed to update entry. Wrong password or corrupted data.' };
            }
        },

        /**
         * Delete an entry from a vault
         * @param {string} password - Vault password
         * @param {string} type - 'real' or 'decoy'
         * @param {string} entryId - ID of entry to delete
         * @returns {Promise<Object>} { success: boolean, message: string, entries: Array }
         */
        deleteEntry: async function (password, type, entryId) {
            if (!entryId) {
                return { success: false, message: 'Entry ID is required.' };
            }

            try {
                var dataKey = type === 'real' ? STORAGE_KEYS.REAL_DATA : STORAGE_KEYS.DECOY_DATA;
                var entries = await _getDecryptedData(dataKey, password);

                var filtered = entries.filter(function (entry) {
                    return entry.id !== entryId;
                });

                if (filtered.length === entries.length) {
                    return { success: false, message: 'Entry not found.' };
                }

                var saved = await _setEncryptedData(dataKey, filtered, password);

                if (saved) {
                    return { success: true, message: 'Entry deleted successfully!', entries: filtered };
                } else {
                    return { success: false, message: 'Failed to delete entry. Please try again.' };
                }
            } catch (_) {
                return { success: false, message: 'Failed to delete entry. Wrong password or corrupted data.' };
            }
        },

        /**
         * Export vault data as encrypted JSON
         * @param {string} password - Vault password
         * @param {string} type - 'real' or 'decoy'
         * @returns {Promise<Object>} { success: boolean, data: string, message: string }
         */
        exportVault: async function (password, type) {
            try {
                var dataKey = type === 'real' ? STORAGE_KEYS.REAL_DATA : STORAGE_KEYS.DECOY_DATA;
                var encrypted = localStorage.getItem(dataKey);

                if (!encrypted) {
                    return { success: false, message: 'No data found to export.' };
                }

                var payload = JSON.parse(encrypted);
                // Re-encrypt with a one-time export password? No, just return the encrypted payload.
                // The user can decrypt it later with the same password.
                return {
                    success: true,
                    data: JSON.stringify(payload, null, 2),
                    message: 'Vault exported successfully!'
                };
            } catch (_) {
                return { success: false, message: 'Failed to export vault.' };
            }
        },

        /**
         * Import vault data from encrypted JSON
         * @param {string} password - Vault password
         * @param {string} type - 'real' or 'decoy'
         * @param {string} jsonData - Encrypted JSON string
         * @returns {Promise<Object>} { success: boolean, message: string, entries: Array }
         */
        importVault: async function (password, type, jsonData) {
            if (!jsonData || jsonData.trim() === '') {
                return { success: false, message: 'No data provided to import.' };
            }

            try {
                // Validate that the data is valid JSON
                var payload = JSON.parse(jsonData);
                if (!payload.iv || !payload.salt || !payload.data) {
                    return { success: false, message: 'Invalid data format. Missing IV, salt, or data.' };
                }

                var dataKey = type === 'real' ? STORAGE_KEYS.REAL_DATA : STORAGE_KEYS.DECOY_DATA;

                // Try to decrypt to validate the password
                var ivBuffer = _base64ToArrayBuffer(payload.iv);
                var saltBuffer = _base64ToArrayBuffer(payload.salt);
                var encryptedBuffer = _base64ToArrayBuffer(payload.data);

                await CryptoEngine.decrypt(encryptedBuffer, password, ivBuffer, saltBuffer);

                // If decryption succeeded, save the data
                localStorage.setItem(dataKey, jsonData);

                // Get decrypted entries to return
                var entries = await _getDecryptedData(dataKey, password);

                return {
                    success: true,
                    message: 'Vault imported successfully!',
                    entries: entries
                };
            } catch (_) {
                return { success: false, message: 'Failed to import vault. Invalid password or corrupted data.' };
            }
        },

        /**
         * Get the ID of the current vault (for display)
         * @param {string} type - 'real' or 'decoy'
         * @returns {string}
         */
        getVaultId: function (type) {
            var hashKey = type === 'real' ? STORAGE_KEYS.REAL_HASH : STORAGE_KEYS.DECOY_HASH;
            var hash = localStorage.getItem(hashKey);
            if (!hash) {
                return '—';
            }
            return hash.substring(0, 8);
        },

        /**
         * Clear all vault data (factory reset)
         * @returns {boolean}
         */
        clearAllData: function () {
            try {
                localStorage.removeItem(STORAGE_KEYS.REAL_HASH);
                localStorage.removeItem(STORAGE_KEYS.DECOY_HASH);
                localStorage.removeItem(STORAGE_KEYS.REAL_DATA);
                localStorage.removeItem(STORAGE_KEYS.DECOY_DATA);
                localStorage.removeItem(STORAGE_KEYS.SETUP_COMPLETE);
                return true;
            } catch (_) {
                return false;
            }
        },

        /**
         * Get decoy default entries (for reference)
         * @returns {Array}
         */
        getDefaultDecoyEntries: function () {
            return DEFAULT_DECOY_ENTRIES;
        }
    };
})();

// Make VaultManager globally accessible
window.VaultManager = VaultManager;