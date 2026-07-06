/**
 * ============================================================
 *  CRYPTO ENGINE
 *  Handles all encryption/decryption using Web Crypto API
 *  Algorithm: AES-GCM 256-bit with PBKDF2 key derivation
 *  Pure Vanilla JS - No external libraries.
 * ============================================================
 */

const CryptoEngine = (function () {
    'use strict';

    // ---- CONSTANTS ----
    const ITERATIONS = 100000;
    const KEY_LENGTH = 256;
    const HASH_ALGO = 'SHA-256';
    const ENCRYPTION_ALGO = 'AES-GCM';
    const SALT_LENGTH = 16;      // bytes
    const IV_LENGTH = 12;        // bytes (recommended for GCM)

    // ---- PRIVATE HELPERS ----

    /**
     * Generate random bytes
     */
    function _randomBytes(length) {
        var bytes = new Uint8Array(length);
        window.crypto.getRandomValues(bytes);
        return bytes;
    }

    /**
     * Import raw key material from password using PBKDF2
     */
    async function _deriveKey(password, salt) {
        var encoder = new TextEncoder();
        var keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        var derivedKey = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: ITERATIONS,
                hash: HASH_ALGO
            },
            keyMaterial,
            {
                name: ENCRYPTION_ALGO,
                length: KEY_LENGTH
            },
            false,
            ['encrypt', 'decrypt']
        );

        return derivedKey;
    }

    // ---- PUBLIC API ----

    return {

        /**
         * Encrypt data using AES-GCM with password-derived key
         * @param {ArrayBuffer} dataBuffer - The data to encrypt
         * @param {string} password - User's passphrase
         * @returns {Promise<Object>} { iv, salt, encryptedData } all as ArrayBuffer
         */
        encrypt: async function (dataBuffer, password) {
            if (!dataBuffer) {
                throw new Error('No data provided for encryption');
            }
            if (!password || password.length === 0) {
                throw new Error('Password cannot be empty');
            }

            try {
                // Generate random salt and IV
                var salt = _randomBytes(SALT_LENGTH);
                var iv = _randomBytes(IV_LENGTH);

                // Derive key from password + salt
                var key = await _deriveKey(password, salt);

                // Encrypt
                var encryptedData = await window.crypto.subtle.encrypt(
                    {
                        name: ENCRYPTION_ALGO,
                        iv: iv
                    },
                    key,
                    dataBuffer
                );

                return {
                    iv: iv.buffer,
                    salt: salt.buffer,
                    encryptedData: encryptedData
                };
            } catch (error) {
                throw new Error('Encryption failed: ' + error.message);
            }
        },

        /**
         * Decrypt data using AES-GCM with password-derived key
         * @param {ArrayBuffer} encryptedBuffer - The encrypted data
         * @param {string} password - User's passphrase
         * @param {ArrayBuffer} ivBuffer - The IV used during encryption
         * @param {ArrayBuffer} saltBuffer - The salt used during key derivation
         * @returns {Promise<ArrayBuffer>} Decrypted data
         */
        decrypt: async function (encryptedBuffer, password, ivBuffer, saltBuffer) {
            if (!encryptedBuffer) {
                throw new Error('No encrypted data provided');
            }
            if (!password || password.length === 0) {
                throw new Error('Password cannot be empty');
            }
            if (!ivBuffer || ivBuffer.byteLength !== IV_LENGTH) {
                throw new Error('Invalid IV (must be ' + IV_LENGTH + ' bytes)');
            }
            if (!saltBuffer || saltBuffer.byteLength !== SALT_LENGTH) {
                throw new Error('Invalid salt (must be ' + SALT_LENGTH + ' bytes)');
            }

            try {
                var iv = new Uint8Array(ivBuffer);
                var salt = new Uint8Array(saltBuffer);

                // Derive key from password + salt
                var key = await _deriveKey(password, salt);

                // Decrypt
                var decryptedData = await window.crypto.subtle.decrypt(
                    {
                        name: ENCRYPTION_ALGO,
                        iv: iv
                    },
                    key,
                    encryptedBuffer
                );

                return decryptedData;
            } catch (error) {
                // Common error: wrong password or corrupted data
                throw new Error('Decryption failed. Wrong password or corrupted file.');
            }
        },

        /**
         * Helper: Generate a random salt (for manual use if needed)
         * @returns {Uint8Array}
         */
        generateSalt: function () {
            return _randomBytes(SALT_LENGTH);
        },

        /**
         * Helper: Generate a random IV (for manual use if needed)
         * @returns {Uint8Array}
         */
        generateIV: function () {
            return _randomBytes(IV_LENGTH);
        },

        /**
         * Get algorithm info (for display purposes)
         * @returns {Object}
         */
        getAlgorithmInfo: function () {
            return {
                encryption: ENCRYPTION_ALGO + '-' + KEY_LENGTH,
                keyDerivation: 'PBKDF2-HMAC-' + HASH_ALGO,
                iterations: ITERATIONS,
                ivLength: IV_LENGTH,
                saltLength: SALT_LENGTH
            };
        }
    };
})();

// Make CryptoEngine globally accessible
window.CryptoEngine = CryptoEngine;