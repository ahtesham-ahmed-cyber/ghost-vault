Bilkul! Yeh raha **Ghost Vault** ke liye professional README.md — bilkul pehle projects ki tarah, lekin iski apni alag identity ke saath.

---

### File: `/home/the-secure-script/Desktop/DATA/MyProjects/ghost-vault/README.md`

```markdown
# 👻 Ghost Vault — Plausible Deniability Password Manager

**Two vaults. Two realities. One password decides.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Made with Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![AES-256](https://img.shields.io/badge/Encryption-AES--256--GCM-brightgreen.svg)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-brightgreen.svg)](https://vercel.com/)

Ghost Vault is a **client-side password manager** with a unique security feature: **Plausible Deniability**. It creates two separate vaults — a **Real Vault** and a **Decoy Vault** — each unlocked by a different password. If you're ever forced to reveal your password, you can provide the decoy password and only the fake data will be exposed, keeping your real credentials safe.

🔐 **AES-256-GCM encryption** ensures your data is secure, even if the browser's local storage is compromised.

---

## ✨ Features

- 🎭 **Plausible Deniability** — Two vaults (Real + Decoy) with different passwords
- 🔐 **AES-256-GCM Encryption** — Military-grade encryption (Web Crypto API)
- 🔑 **PBKDF2 Key Derivation** — 100,000 iterations for strong password protection
- 📝 **Full CRUD Operations** — Add, Edit, Delete, and View entries
- 📤 **Export / Import** — Encrypted JSON backup for each vault
- 🖱️ **Intuitive UI** — Clean, premium design with Golden/Navy theme
- 📱 **Fully Responsive** — Works on desktop, tablet, and mobile
- 🔒 **100% Client-Side** — No data ever leaves your browser
- 💾 **Local Storage** — Data persists in the browser, no server required

---

## 🚀 Live Demo

**[👉 Click here to try Ghost Vault](https://your-demo-url.vercel.app)**  
*(Replace with your actual Vercel URL after deployment)*

---

## 🧠 How It Works

### The Dual Vault System

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GHOST VAULT                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    LOCK SCREEN                              │   │
│   │  ┌──────────────────────────────────────────────────────┐   │   │
│   │  │  ENTER PASSPHRASE                                   │   │   │
│   │  │  [ • • • • • • • • ]         [ UNLOCK VAULT ]      │   │   │
│   │  └──────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│              ┌───────────────┴───────────────┐                     │
│              ▼                               ▼                      │
│   ┌────────────────────┐       ┌────────────────────┐             │
│   │   REAL VAULT       │       │   DECOY VAULT      │             │
│   │   (Real Password)  │       │   (Decoy Password)  │             │
│   ├────────────────────┤       ├────────────────────┤             │
│   │  Gmail: john.doe   │       │  OldTwitter: 1234  │             │
│   │  GitHub: johndoe   │       │  TestAccount: abc  │             │
│   │  Bank: jdoe123     │       │  DummySite: demo   │             │
│   └────────────────────┘       └────────────────────┘             │
│                                                                     │
│   👤 If someone forces you to reveal your password...              │
│   You give them the DECOY password → They only see fake data!     │
│   Your REAL data stays safe. ✨                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Security Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Password │ ──▶ │   PBKDF2         │ ──▶ │   AES-256 Key   │
│   (Real/Decoy)  │     │   100k iterations│     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Entries (JSON)│ ──▶ │   AES-256-GCM    │ ──▶ │   Encrypted     │
│   { service,    │     │   Encrypt        │     │   Payload       │
│     username,   │     │                  │     │   { iv, salt,   │
│     password }  │     │                  │     │     data }      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │   localStorage  │
                                                  │   (Browser)     │
                                                  └─────────────────┘
```

### Data Flow

1. **Setup:** User sets Real Password and Decoy Password (different)
2. **Unlock:** Enter password → System checks against both hashes
   - Matches Real → **Real Vault** (shows real credentials)
   - Matches Decoy → **Decoy Vault** (shows fake credentials)
   - No match → Access denied
3. **CRUD:** Add/Edit/Delete entries → Re-encrypt → Save to localStorage
4. **Export:** Encrypted JSON backup for each vault
5. **Lock:** Clears session, returns to lock screen

---

## 📸 Screenshots

### Lock Screen
```
┌─────────────────────────────────────────────────────────────────────┐
│  🔐 GHOST VAULT  v1.0                                               │
│  // Plausible Deniability · Offline                                 │
│                                                                     │
│              🔒                                                     │
│            VAULT LOCKED                                             │
│                                                                     │
│  ◆ ENTER PASSPHRASE                    secure                      │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │  • • • • • • • •                        [SHOW]          │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                     │
│  [ ✓ UNLOCK VAULT ]                                                │
│                                                                     │
│  // Two vaults. Two realities. One password decides.               │
│                                                                     │
│  root@ghost:~$ ./vault --status                                    │
│  // awaiting authentication ...                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Dashboard — Real Vault
```
┌─────────────────────────────────────────────────────────────────────┐
│  🔐 GHOST VAULT  v1.0                                               │
│                                                                     │
│                    🔐 REAL VAULT                                    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  [+ ADD ENTRY]   [📤 EXPORT]   [🔒 LOCK VAULT]          │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌─────────────┬──────────────┬──────────┬─────────────────┐      │
│  │  SERVICE    │  USERNAME    │ PASSWORD │  ACTIONS        │      │
│  ├─────────────┼──────────────┼──────────┼─────────────────┤      │
│  │  Gmail      │ john.doe     │ •••••••• │ [✎] [✕]        │      │
│  │  GitHub     │ johndoe      │ •••••••• │ [✎] [✕]        │      │
│  │  Bank       │ jdoe123      │ •••••••• │ [✎] [✕]        │      │
│  └─────────────┴──────────────┴──────────┴─────────────────┘      │
│                                                                     │
│  3 entries  // vault: a1b2c3d4                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Cryptography** | Web Crypto API — AES-256-GCM + PBKDF2 |
| **Storage** | localStorage (Browser) |
| **Styling** | CSS3 — Golden/Navy luxury theme, Glassmorphism |
| **Fonts** | Inter + Playfair Display + JetBrains Mono |
| **Deployment** | Vercel / Netlify (Static Hosting) |

---

## 📁 Project Structure

```
ghost-vault/
│
├── index.html                 # Main application
├── README.md                  # This file
├── LICENSE                    # MIT License
├── vercel.json                # Vercel deployment config
│
├── css/
│   └── style.css              # Main stylesheet (Golden/Navy theme)
│
├── js/
│   ├── app.js                 # Main controller
│   ├── cryptoEngine.js        # AES-256-GCM encryption
│   ├── vaultManager.js        # localStorage CRUD operations
│   └── uiController.js        # DOM updates & UI state
│
├── assets/
│   └── icons/                 # SVG icons
│
└── .vscode/
    └── settings.json          # VS Code settings
```

---

## 🚦 Installation & Usage

### Option 1: Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/ghost-vault.git
cd ghost-vault

# Open with Live Server (VS Code)
# Right-click on index.html → "Open with Live Server"
# OR open directly in browser via file:// protocol
```

### Option 2: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd ghost-vault
vercel --prod
```

### Option 3: Deploy to Netlify

```bash
# Drag and drop the ghost-vault folder to Netlify
# Or use Netlify CLI
npm install -g netlify-cli
netlify deploy --prod
```

---

## 🎯 Usage Guide

### First-Time Setup

1. Open the tool in your browser
2. Enter **any password** (min 4 characters) — setup will automatically start
3. Enter **REAL VAULT password** (min 4 characters)
4. Enter **DECOY VAULT password** (min 4 characters, different from real)
5. Click "UNLOCK VAULT" → You're now logged into the Real Vault!

### Using the Real Vault

1. Enter your Real Password → Click "UNLOCK VAULT"
2. You'll see the **🔐 REAL VAULT** badge
3. **Add Entry:** Click "ADD ENTRY" → Fill in service, username, password
4. **Edit Entry:** Click the ✎ icon next to any entry → Update fields → Save
5. **Delete Entry:** Click the ✕ icon → Confirm deletion
6. **Export:** Click "EXPORT" → Download encrypted JSON backup
7. **Lock:** Click "LOCK VAULT" → Return to lock screen

### Using the Decoy Vault

1. Enter your Decoy Password → Click "UNLOCK VAULT"
2. You'll see the **🎭 DECOY VAULT** badge
3. All CRUD operations work the same as the Real Vault
4. The Decoy Vault comes pre-populated with fake entries

### Plausible Deniability Scenario

1. Someone forces you to reveal your vault password
2. You provide the **DECOY PASSWORD**
3. They see only fake credentials (OldTwitter, TestAccount, etc.)
4. Your **REAL credentials** (Gmail, Bank, GitHub) remain hidden

---

## 🔐 Security

| Feature | Specification |
|---------|---------------|
| **Encryption Algorithm** | AES-256-GCM |
| **Key Derivation** | PBKDF2 — 100,000 iterations |
| **Hash Function** | SHA-256 |
| **IV Length** | 12 bytes (GCM standard) |
| **Salt Length** | 16 bytes |
| **Storage** | localStorage (encrypted) |
| **Data Format** | JSON: { iv: base64, salt: base64, data: base64 } |

### Password Storage

```
Real Password → SHA-256 Hash → Stored in localStorage
Decoy Password → SHA-256 Hash → Stored in localStorage

⚠️ Passwords are NEVER stored in plain text. Only hashes are stored.
⚠️ Encryption key is derived from the password each time, never stored.
```

---

## ⚠️ Limitations

| Limitation | Details |
|------------|---------|
| **Storage** | Limited to ~5MB (browser localStorage limit) |
| **Browser Support** | Requires Web Crypto API (Chrome 37+, Firefox 34+, Safari 11+) |
| **Password Recovery** | No password recovery — lost password = lost data |
| **Offline Only** | No cloud sync — data is local to the browser |
| **Export/Import** | Manual process — no automatic backup |

---

## 🧪 Testing

Tested on:
- ✅ Google Chrome 120+
- ✅ Mozilla Firefox 119+
- ✅ Microsoft Edge 120+
- ✅ Safari 17+

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

**MIT License** — See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Google Fonts — Inter, Playfair Display, JetBrains Mono](https://fonts.google.com/)
- [Vercel](https://vercel.com/) — Deployment platform

---

## 📞 Contact

**Your Name** — [your.email@example.com](mailto:your.email@example.com)  
**GitHub:** [@yourusername](https://github.com/yourusername)  
**LinkedIn:** [Your Profile](https://linkedin.com/in/yourprofile)

---

## ⭐ Star This Repo

If you find this project useful, please give it a star on GitHub! ⭐

---

## 🔗 Related Projects

- [File Encryption Suite](https://github.com/yourusername/file-encryption-tool) — Fake HTML wrapper + AES encryption
- [Pixel Weaver](https://github.com/yourusername/pixel-weaver) — LSB Steganography Tool

---

**Built with ❤️ and Vanilla JS**
```

---

### Must-Change Placeholders (Before Public Repo)

| Placeholder | Replace With |
|-------------|--------------|
| `https://your-demo-url.vercel.app` | Your actual Vercel URL |
| `https://github.com/yourusername/ghost-vault.git` | Your GitHub repo URL |
| `your.email@example.com` | Your email |
| `@yourusername` | Your GitHub username |
| `Your Name` | Your real name |
| `[Your Profile](https://linkedin.com/in/yourprofile)` | Your LinkedIn URL |

---