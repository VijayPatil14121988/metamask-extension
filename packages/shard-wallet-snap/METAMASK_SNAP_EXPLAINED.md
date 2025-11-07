# MetaMask & Snaps: Architecture & User Experience Guide

## Table of Contents
1. [What is MetaMask?](#what-is-metamask)
2. [What is a Snap?](#what-is-a-snap)
3. [Relationship Between MetaMask & Snaps](#relationship-between-metamask--snaps)
4. [How We're Using Snaps](#how-were-using-snaps)
5. [Private Key Sources & Security Model](#private-key-sources--security-model)
6. [Our End Product Architecture](#our-end-product-architecture)
7. [User Experience Flows](#user-experience-flows)
8. [Security & Privacy Considerations](#security--privacy-considerations)

---

## What is MetaMask?

**MetaMask** is a cryptocurrency wallet that exists as a browser extension (Chrome, Firefox, Edge, Brave) and mobile app.

### Key Features:
- **Web3 Gateway**: Allows websites to interact with blockchain networks (Ethereum, Polygon, etc.)
- **Private Key Management**: Stores and manages users' private keys securely
- **Transaction Signing**: Signs transactions without exposing private keys to websites
- **Multi-Chain Support**: Works with Ethereum and EVM-compatible chains
- **Browser Extension**: Runs in a sandboxed environment for security

### Architecture Overview

```mermaid
graph TB
    subgraph "User's Browser"
        Website[Web3 Website/DApp]
        MM[MetaMask Extension]
        Vault[(Encrypted Vault<br/>Private Keys)]
    end

    subgraph "Blockchain Network"
        ETH[Ethereum Network]
        POL[Polygon Network]
        BSC[BSC Network]
    end

    Website -->|"Request Transaction"| MM
    MM -->|"User Approval"| Website
    MM <-->|"Read Vault"| Vault
    MM -->|"Broadcast Tx"| ETH
    MM -->|"Broadcast Tx"| POL
    MM -->|"Broadcast Tx"| BSC
```

### How MetaMask Stores Keys (Traditional)

```mermaid
graph LR
    User[User Password] -->|"Encrypts"| Vault
    Vault[(Encrypted Vault)] -->|"Contains"| PK1[Private Key 1]
    Vault -->|"Contains"| PK2[Private Key 2]
    Vault -->|"Contains"| PK3[Private Key N...]

    style Vault fill:#f96,stroke:#333,stroke-width:2px
    style User fill:#9f6,stroke:#333,stroke-width:2px
```

**Problem**: If user loses password or vault is compromised, **all funds are lost**.

---

## What is a Snap?

**MetaMask Snaps** is a plugin system that allows developers to extend MetaMask's functionality with custom features.

### Key Characteristics:

```mermaid
graph TB
    subgraph "MetaMask Extension"
        Core[MetaMask Core]
        SnapAPI[Snaps API]

        subgraph "Secure Execution Environment (SES)"
            Snap1[Shard Wallet Snap]
            Snap2[Other Snaps]
        end
    end

    Core -->|"Provides APIs"| SnapAPI
    SnapAPI -->|"Sandboxed"| Snap1
    SnapAPI -->|"Sandboxed"| Snap2

    Snap1 -->|"Cannot Access"| Core
    Snap1 -.->|"Limited APIs Only"| SnapAPI
```

### Snap Capabilities & Restrictions

| **Capability** | **Allowed** | **Not Allowed** |
|----------------|-------------|-----------------|
| Custom RPC methods | ✅ Yes | ❌ Access MetaMask keys |
| Store encrypted data | ✅ Yes (via State API) | ❌ Access browser localStorage |
| Show custom UI dialogs | ✅ Yes | ❌ Access DOM directly |
| Schedule cron jobs | ✅ Yes | ❌ Make arbitrary network calls |
| Pure JavaScript code | ✅ Yes | ❌ WebAssembly (not yet supported) |

### Security Model

```mermaid
graph TB
    subgraph "Browser Sandbox"
        subgraph "MetaMask Extension Sandbox"
            subgraph "Snap SES (Secure EcmaScript) Sandbox"
                Snap[Shard Wallet Snap]
            end
            MM[MetaMask Core]
        end
        Website[Website]
    end

    Website -.->|"No Direct Access"| Snap
    Website -->|"Via MetaMask"| MM
    MM -->|"Permission Required"| Snap

    style Snap fill:#9f6,stroke:#333,stroke-width:3px
```

**Triple Sandboxing**:
1. Browser sandbox (extension isolation)
2. MetaMask sandbox (extension security)
3. SES sandbox (Snap isolation)

---

## Relationship Between MetaMask & Snaps

### Analogy: Smartphone & Apps

```mermaid
graph LR
    subgraph "Smartphone Analogy"
        Phone[iPhone/Android] -->|"App Store"| Apps[Apps]
        Apps -->|"Use Phone APIs"| Phone
    end

    subgraph "MetaMask Analogy"
        MM[MetaMask] -->|"Snaps Store"| Snaps[Snaps]
        Snaps -->|"Use MetaMask APIs"| MM
    end
```

| **Smartphone** | **MetaMask** |
|----------------|--------------|
| Operating System | MetaMask Core |
| App Store | Snaps Marketplace |
| Apps (Instagram, WhatsApp) | Snaps (Shard Wallet, others) |
| Phone APIs (Camera, GPS) | MetaMask APIs (State, Notify, RPC) |
| App Permissions | Snap Permissions |

### How They Communicate

```mermaid
sequenceDiagram
    participant Website
    participant MetaMask
    participant ShardSnap
    participant SnapState

    Website->>MetaMask: Request "shard_securitize"
    MetaMask->>ShardSnap: Forward request
    ShardSnap->>ShardSnap: Split key into 4 shards
    ShardSnap->>SnapState: Store shards
    SnapState-->>ShardSnap: Stored
    ShardSnap-->>MetaMask: Success + Health Status
    MetaMask-->>Website: Display result to user
```

---

## How We're Using Snaps

### Our Implementation: Shard Wallet Snap

```mermaid
graph TB
    subgraph "Shard Wallet Snap Architecture"
        Input[User's Private Key] -->|"Step 1"| Gen[Generate Random<br/>Encryption Key K]
        Gen -->|"Step 2"| Split[Split K into 4 Shards<br/>2-of-4 Threshold SSS]
        Gen -->|"Step 3"| Encrypt[Encrypt Private Key<br/>with K using AES-256-GCM]

        Split --> Shard1[Shard 1<br/>SIM Storage]
        Split --> Shard2[Shard 2<br/>YubiKey Storage]
        Split --> Shard3[Shard 3<br/>Cloud Storage]
        Split --> Shard4[Shard 4<br/>Escrow Storage]

        Encrypt --> ES[Encrypted Secret]
        ES -->|"Stored in"| SnapState[(MetaMask<br/>Snap State)]
    end

    style Input fill:#f96,stroke:#333,stroke-width:2px
    style Gen fill:#9cf,stroke:#333,stroke-width:2px
    style ES fill:#9f6,stroke:#333,stroke-width:2px
```

### Technology Stack

```mermaid
graph LR
    subgraph "Pure JavaScript Crypto"
        SSS[Shamir Secret Sharing<br/>secrets.js]
        AES[AES-256-GCM<br/>@noble/ciphers]
        Random[Secure Random<br/>crypto.getRandomValues]
    end

    subgraph "Storage"
        State[MetaMask Snap State API<br/>snap_manageState]
    end

    subgraph "MetaMask APIs Used"
        RPC[endowment:rpc<br/>Custom Methods]
        Notify[snap_notify<br/>User Notifications]
        Lifecycle[endowment:lifecycle-hooks<br/>onInstall, onUpdate]
        Cron[endowment:cronjob<br/>Daily Health Checks]
    end

    SSS --> Snap[Shard Wallet Snap]
    AES --> Snap
    Random --> Snap
    Snap --> State
    Snap --> RPC
    Snap --> Notify
    Snap --> Lifecycle
    Snap --> Cron
```

### Why We Chose Snaps

| **Requirement** | **Why MetaMask Snaps?** |
|-----------------|-------------------------|
| No separate app installation | ✅ Works inside existing MetaMask extension |
| Users already trust MetaMask | ✅ 30+ million existing users |
| Secure execution environment | ✅ Triple-sandboxed (Browser + MetaMask + SES) |
| Access to wallet context | ✅ Can interact with user's wallet without accessing keys |
| Built-in permission system | ✅ User controls what Snap can do |
| Cross-platform | ✅ Works on Chrome, Firefox, Edge, Brave, Mobile (future) |

---

## Private Key Sources & Security Model

### Critical Question: Where Does The Private Key Come From?

**Short Answer**: The private key **NEVER** goes to our website's backend. It flows through 3 possible paths:

```mermaid
graph TB
    subgraph "Option 1: Snap Generates (RECOMMENDED)"
        U1[User] -->|"Click Generate"| W1[Website]
        W1 -->|"Call shard_generateWallet"| S1[Snap]
        S1 -->|"crypto.getRandomValues"| S1
        S1 -->|"Auto-securitize"| S1
        S1 -->|"Return address + key"| W1
        W1 -->|"Display to user"| U1
        U1 -->|"Import to MetaMask"| MM1[MetaMask]

        style S1 fill:#9f6,stroke:#333,stroke-width:3px
        style W1 fill:#9cf,stroke:#333,stroke-width:2px
    end
```

```mermaid
graph TB
    subgraph "Option 2: User Exports from MetaMask"
        U2[User] -->|"Export private key"| MM2[MetaMask]
        MM2 -->|"Shows key with warning"| U2
        U2 -->|"Copy key"| U2
        U2 -->|"Paste into form"| W2[Website]
        W2 -->|"Pass to Snap immediately"| S2[Snap]
        S2 -->|"Securitize"| S2
        S2 -->|"Success"| W2
        W2 -->|"Clear from memory"| W2

        style S2 fill:#9f6,stroke:#333,stroke-width:3px
        style W2 fill:#ff9,stroke:#333,stroke-width:2px
    end
```

```mermaid
graph TB
    subgraph "Option 3: Website Generates (NOT RECOMMENDED)"
        U3[User] -->|"Click Generate"| W3[Website]
        W3 -->|"crypto.getRandomValues"| W3
        W3 -.->|"⚠️ Key in memory"| W3
        W3 -->|"Pass to Snap"| S3[Snap]
        S3 -->|"Securitize"| S3
        S3 -->|"Success"| W3
        W3 -->|"Clear from memory"| W3

        style S3 fill:#9f6,stroke:#333,stroke-width:3px
        style W3 fill:#f96,stroke:#333,stroke-width:2px
    end
```

### Detailed Flow Analysis

#### **Option 1: Snap Generates Wallet (RECOMMENDED ✅)**

```mermaid
sequenceDiagram
    participant User
    participant Website
    participant Snap
    participant CryptoAPI

    User->>Website: Click "Create New Secured Wallet"
    Website->>Snap: Call shard_generateWallet()

    Note over Snap: Private key NEVER leaves Snap

    Snap->>CryptoAPI: crypto.getRandomValues(32 bytes)
    CryptoAPI-->>Snap: Random private key
    Snap->>Snap: Derive Ethereum address
    Snap->>Snap: Split key into 4 shards
    Snap->>Snap: Encrypt & store shards

    Snap-->>Website: {address, privateKey, healthStatus}
    Website-->>User: Display address & key

    User->>User: Copy private key (shown once)
    User->>MetaMask: Import Account → Paste key
    MetaMask-->>User: ✅ Account imported!

    Note over User: User can delete the copied key<br/>It's already secured in shards
```

**Advantages:**
- ✅ **Most Secure**: Private key generated inside Snap's sandbox
- ✅ **Zero Trust**: Website never has the key in memory
- ✅ **Auto-Securitized**: Key is split immediately after generation
- ✅ **One-Click UX**: Single action generates + secures wallet

**Implementation:**
```javascript
// Website code
const result = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'local:http://localhost:9000',
    request: {
      method: 'shard_generateWallet',
      params: {}  // No parameters needed
    }
  }
});

// User sees:
// Address: 0x742d...
// Private Key: 0x1234... (shown once for import to MetaMask)
// ✅ Wallet secured! 4/4 shards healthy
```

---

#### **Option 2: User Exports from Existing MetaMask Wallet**

```mermaid
sequenceDiagram
    participant User
    participant MetaMask
    participant Website
    participant Snap

    Note over User,MetaMask: User has existing wallet in MetaMask

    User->>MetaMask: Account Details → Export Private Key
    MetaMask->>MetaMask: Require password confirmation
    MetaMask->>User: ⚠️ Warning: Never share this!
    MetaMask-->>User: Shows private key

    User->>User: Copy private key to clipboard
    User->>Website: Navigate to Shard Wallet
    User->>Website: Paste key into "Secure Existing Wallet" form

    Note over Website: Key is in website's JavaScript context<br/>but ONLY in memory, never sent to backend

    Website->>Snap: shard_securitize(privateKey, address)

    Note over Snap: Key is now in Snap's secure sandbox

    Snap->>Snap: Split key into 4 shards
    Snap->>Snap: Encrypt & store shards
    Snap-->>Website: Success + health status

    Website->>Website: Clear privateKey from memory
    Website-->>User: ✅ Wallet secured! 4/4 shards healthy

    User->>User: Clear clipboard

    Note over User: Original wallet in MetaMask unchanged<br/>Now has backup via shards
```

**Advantages:**
- ✅ Works with existing wallets
- ✅ No new wallet needed
- ✅ User controls the key export

**Security Considerations:**
- ⚠️ Private key briefly exists in website's JavaScript memory
- ⚠️ Could be intercepted by malicious browser extensions
- ⚠️ User must trust the website frontend code
- ⚠️ Risk of phishing (fake website could steal key)

**Mitigations:**
```javascript
// Website code - good practices
const securitizeExistingWallet = async (privateKey, address) => {
  try {
    // 1. Pass to Snap immediately (don't store in variables)
    const result = await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'local:http://localhost:9000',
        request: {
          method: 'shard_securitize',
          params: { privateKey, address }
        }
      }
    });

    return result;
  } finally {
    // 2. Clear from memory immediately after
    privateKey = null;

    // 3. Force garbage collection (hint to browser)
    if (global.gc) global.gc();
  }
};
```

---

#### **Option 3: Website Generates Wallet (NOT RECOMMENDED ⚠️)**

```mermaid
sequenceDiagram
    participant User
    participant Website
    participant WebCrypto
    participant Snap

    User->>Website: Click "Create New Wallet"
    Website->>WebCrypto: crypto.getRandomValues(32)
    WebCrypto-->>Website: Random 32 bytes

    Note over Website: ⚠️ Private key exists in website's memory

    Website->>Website: Convert to hex format
    Website->>Website: Derive Ethereum address
    Website->>Snap: shard_securitize(privateKey, address)

    Snap->>Snap: Securitize key
    Snap-->>Website: Success

    Website->>Website: Clear from memory
    Website-->>User: Show address + key
```

**Why NOT Recommended:**
- ❌ Private key exists in website's JavaScript context
- ❌ Vulnerable to XSS attacks
- ❌ Could be logged by debugging tools
- ❌ Requires users to trust website code
- ❌ Risk of malicious code injection
- ❌ Browser extensions could intercept

**When It Might Be Acceptable:**
- ✅ Open-source website (users can verify code)
- ✅ Running locally (localhost, no remote code)
- ✅ Audited codebase
- ✅ Used in development/testing only

---

### Security Comparison Table

| **Aspect** | **Snap Generates** | **User Exports** | **Website Generates** |
|-----------|-------------------|------------------|----------------------|
| **Private key in website memory** | ❌ Never | ⚠️ Briefly | ⚠️ Yes |
| **Vulnerable to XSS** | ❌ No | ⚠️ Low risk | ❌ Yes |
| **Trust required** | ✅ Only Snap | ⚠️ Website frontend | ❌ Website fully |
| **Phishing risk** | ✅ Low | ⚠️ Medium | ❌ High |
| **Browser extension intercept** | ❌ Cannot | ⚠️ Possible | ❌ Possible |
| **Backend ever sees key** | ✅ Never | ✅ Never | ✅ Never |
| **User Experience** | ✅ Excellent | ⚠️ Manual steps | ✅ Good |
| **Use Case** | New wallets | Existing wallets | Not recommended |

---

### Data Flow: Where Key Travels

```mermaid
graph LR
    subgraph "Option 1: Snap Generates (Recommended)"
        CryptoAPI1[crypto.getRandomValues] -->|Random bytes| Snap1[Snap Sandbox]
        Snap1 -->|Encrypted shards| Storage1[4 Storage Locations]
        Snap1 -.->|Display once| User1[User copies to import]

        style Snap1 fill:#9f6,stroke:#333,stroke-width:3px
    end

    subgraph "Option 2: User Exports"
        MM[MetaMask] -->|User exports| User2[User clipboard]
        User2 -->|Paste| Website[Website memory]
        Website -->|Immediate pass| Snap2[Snap Sandbox]
        Snap2 -->|Encrypted shards| Storage2[4 Storage Locations]
        Website -.->|Clear| Null[null]

        style Website fill:#ff9,stroke:#333,stroke-width:2px
        style Snap2 fill:#9f6,stroke:#333,stroke-width:3px
    end
```

---

### Important: What Website NEVER Does

```mermaid
graph TB
    Website[Website/Frontend]

    Website -.->|❌ NEVER| Backend[Send to Backend Server]
    Website -.->|❌ NEVER| DB[Store in Database]
    Website -.->|❌ NEVER| Log[Log to Console/Analytics]
    Website -.->|❌ NEVER| LocalStorage[Store in localStorage]
    Website -.->|❌ NEVER| Cookie[Store in Cookies]
    Website -.->|❌ NEVER| SessionStorage[Store in sessionStorage]

    style Website fill:#9cf,stroke:#333,stroke-width:2px
    style Backend fill:#f96,stroke:#333,stroke-width:2px
    style DB fill:#f96,stroke:#333,stroke-width:2px
    style Log fill:#f96,stroke:#333,stroke-width:2px
```

**Website's ONLY role:**
1. Display UI to user
2. Call Snap methods
3. Display results from Snap
4. Clear any sensitive data from memory immediately

---

### Recommended Implementation Strategy

```mermaid
flowchart TD
    Start([User lands on<br/>shard-wallet.com]) --> Choice{What do you<br/>want to do?}

    Choice -->|Create New Wallet| Generate[Use shard_generateWallet]
    Choice -->|Secure Existing| Export[User exports from MetaMask]

    Generate --> SnapGen[Snap generates key<br/>in secure sandbox]
    SnapGen --> AutoSecure[Auto-securitize immediately]
    AutoSecure --> ShowKey[Show key ONCE to user]
    ShowKey --> ImportMM[User imports to MetaMask]

    Export --> UserExport[User manually exports<br/>from MetaMask]
    UserExport --> Paste[User pastes into form]
    Paste --> PassThrough[Website passes to Snap<br/>immediately]
    PassThrough --> Secure[Snap securitizes]
    Secure --> Clear[Website clears memory]

    ImportMM --> Done([✅ Wallet secured])
    Clear --> Done

    style Generate fill:#9f6,stroke:#333,stroke-width:3px
    style SnapGen fill:#9f6,stroke:#333,stroke-width:2px
    style PassThrough fill:#ff9,stroke:#333,stroke-width:2px
```

---

### Code Example: Secure Implementation

**Recommended: Snap Generates**
```javascript
// Website code
async function createNewSecuredWallet() {
  try {
    const result = await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'local:http://localhost:9000',
        request: {
          method: 'shard_generateWallet',
          params: {}
        }
      }
    });

    // Result contains:
    // - walletAddress: "0x742d..."
    // - privateKey: "0x1234..." (for import to MetaMask)
    // - healthStatus: { sim: "healthy", ... }

    return result;
  } catch (error) {
    console.error('Failed to generate wallet:', error);
    throw error;
  }
}
```

**Alternative: Secure Existing Wallet**
```javascript
// Website code
async function securitizeExistingWallet(privateKey, address) {
  try {
    // Validate inputs client-side first
    if (!privateKey.match(/^0x[0-9a-fA-F]{64}$/)) {
      throw new Error('Invalid private key format');
    }

    // Pass to Snap immediately - don't store anywhere
    const result = await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'local:http://localhost:9000',
        request: {
          method: 'shard_securitize',
          params: { privateKey, address }
        }
      }
    });

    return result;

  } finally {
    // Clear from memory (JavaScript can't truly delete, but helps)
    privateKey = '0'.repeat(66);
    address = '';
  }
}
```

---

## Our End Product Architecture

### Complete System Overview

```mermaid
graph TB
    subgraph "User's Browser"
        Website[Your Web3 App<br/>shard-wallet.com]
        MM[MetaMask Extension]
        ShardSnap[Shard Wallet Snap]
    end

    subgraph "Storage Locations"
        SIM[SIM Card Storage<br/>Binary SMS via SMPP]
        YubiKey[YubiKey<br/>FIDO2 largeBlob]
        Cloud[Cloud Storage<br/>AWS DynamoDB]
        Escrow[Escrow Service<br/>AWS QLDB]
    end

    subgraph "Blockchain"
        ETH[Ethereum Network]
    end

    Website -->|"1. Request Securitize"| MM
    MM -->|"2. Forward to Snap"| ShardSnap
    ShardSnap -->|"3. Split Key"| ShardSnap
    ShardSnap -.->|"4. Store Shard 1"| SIM
    ShardSnap -.->|"4. Store Shard 2"| YubiKey
    ShardSnap -.->|"4. Store Shard 3"| Cloud
    ShardSnap -.->|"4. Store Shard 4"| Escrow

    ShardSnap -->|"5. Success"| MM
    MM -->|"6. Display UI"| Website

    Website -->|"7. User Signs Tx"| MM
    MM -->|"8. Broadcast"| ETH

    style ShardSnap fill:#9f6,stroke:#333,stroke-width:3px
    style SIM fill:#ff9,stroke:#333,stroke-width:2px
    style YubiKey fill:#ff9,stroke:#333,stroke-width:2px
    style Cloud fill:#ff9,stroke:#333,stroke-width:2px
    style Escrow fill:#ff9,stroke:#333,stroke-width:2px
```

### Product Features

```mermaid
graph LR
    subgraph "Core Features"
        Securitize[Wallet Securitization<br/>Split key into 4 shards]
        Recover[Wallet Recovery<br/>Reconstruct from any 2 shards]
        Health[Health Monitoring<br/>Daily shard availability checks]
        Migrate[Key Migration<br/>Move to new storage locations]
    end

    subgraph "Advanced Features (Future)"
        MultiSig[Multi-Signature<br/>Require 2+ approvers]
        Inheritance[Inheritance<br/>Time-locked recovery]
        SocialRecovery[Social Recovery<br/>Trusted contacts]
    end
```

### Data Flow: Securitization

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant MetaMask
    participant Snap
    participant Storage1
    participant Storage2
    participant Storage3
    participant Storage4

    User->>WebApp: Click "Secure My Wallet"
    WebApp->>MetaMask: Request shard_securitize
    MetaMask->>User: Show permission dialog
    User->>MetaMask: Approve
    MetaMask->>Snap: Execute securitize(privateKey, address)

    Note over Snap: Generate random key K
    Note over Snap: Split K into 4 shards (2-of-4)
    Note over Snap: Encrypt private key with K

    par Store in parallel
        Snap->>Storage1: Store Shard 1
        Snap->>Storage2: Store Shard 2
        Snap->>Storage3: Store Shard 3
        Snap->>Storage4: Store Shard 4
    end

    Storage1-->>Snap: Stored
    Storage2-->>Snap: Stored
    Storage3-->>Snap: Stored
    Storage4-->>Snap: Stored

    Snap-->>MetaMask: Success + Health Status
    MetaMask-->>WebApp: Display result
    WebApp-->>User: ✅ Wallet Secured!<br/>4/4 shards healthy
```

### Data Flow: Recovery

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant MetaMask
    participant Snap
    participant Storage1
    participant Storage2

    User->>WebApp: Click "Recover My Wallet"
    WebApp->>MetaMask: Request shard_recover
    MetaMask->>Snap: Execute recover(address)

    par Retrieve shards
        Snap->>Storage1: Get Shard 1
        Snap->>Storage2: Get Shard 2
    end

    Storage1-->>Snap: Shard 1 data
    Storage2-->>Snap: Shard 2 data

    Note over Snap: Reconstruct key K from 2 shards
    Note over Snap: Decrypt private key with K

    Snap-->>MetaMask: Private key recovered
    MetaMask-->>WebApp: Return private key
    WebApp-->>User: ✅ Wallet Recovered!<br/>Import to MetaMask?
```

---

## User Experience Flows

### New User Journey

```mermaid
journey
    title New User Experience
    section Discovery
      Visit shard-wallet.com: 5: User
      Learn about security: 4: User
      Click "Get Started": 5: User
    section Setup
      Install MetaMask (if needed): 3: User
      Create MetaMask wallet: 4: User
      Install Shard Wallet Snap: 4: User
      Approve permissions: 3: User
    section Securitization
      Click "Secure My Wallet": 5: User
      Confirm transaction: 4: User
      Wait for shards to store: 3: User
      See success message: 5: User
    section Usage
      Use wallet normally: 5: User
      Receive health notifications: 4: User
      Sleep peacefully: 5: User
```

### Step-by-Step: New User

```mermaid
graph TD
    Start([New User Visits<br/>shard-wallet.com]) --> HasMM{Has MetaMask?}

    HasMM -->|No| InstallMM[Install MetaMask<br/>Extension]
    InstallMM --> CreateWallet[Create New Wallet<br/>in MetaMask]

    HasMM -->|Yes| ConnectSite[Click Connect Wallet]
    CreateWallet --> ConnectSite

    ConnectSite --> MMApprove[MetaMask: Approve<br/>site connection]
    MMApprove --> ShowDashboard[See Shard Wallet<br/>Dashboard]

    ShowDashboard --> InstallSnap[Click Enable<br/>Shard Protection]
    InstallSnap --> SnapPermissions[MetaMask: Review<br/>Snap Permissions]

    SnapPermissions --> PermList[✓ Store data<br/>✓ Send notifications<br/>✓ Daily health checks]
    PermList --> ApproveSnap[Click Approve]

    ApproveSnap --> SnapInstalled[✅ Snap Installed]
    SnapInstalled --> Choice{New or<br/>Existing?}

    Choice -->|New Wallet| Generate[Click Generate<br/>New Secured Wallet]
    Choice -->|Existing Wallet| Export[Export key from MetaMask<br/>and paste into form]

    Generate --> SnapGenerates[Snap generates key<br/>in secure sandbox]
    SnapGenerates --> AutoSecure[Auto-securitize]

    Export --> UserPastes[User pastes key]
    UserPastes --> Securitize[Click Securitize]

    Securitize --> Processing[⏳ Splitting key...<br/>⏳ Storing shards...]
    AutoSecure --> Processing

    Processing --> Success[✅ Wallet Secured!<br/>4/4 shards healthy]
    Success --> UseWallet[Use wallet normally]

    style Success fill:#9f6,stroke:#333,stroke-width:3px
    style SnapInstalled fill:#9cf,stroke:#333,stroke-width:2px
    style Generate fill:#9f6,stroke:#333,stroke-width:2px
```

### Existing MetaMask User Journey

```mermaid
journey
    title Existing MetaMask User Experience
    section Discovery
      See Shard Wallet announcement: 4: User
      Visit shard-wallet.com: 5: User
      Connect existing wallet: 5: User
    section Installation
      Click "Install Snap": 5: User
      Review permissions: 4: User
      Approve in 1 click: 5: User
    section Securitization
      Select wallet to secure: 4: User
      Confirm securitization: 4: User
      See shards distribute: 3: User
      Get confirmation: 5: User
    section Daily Use
      Use wallet as normal: 5: User
      No extra steps needed: 5: User
      Peace of mind: 5: User
```

### Comparison: Traditional vs Shard Wallet

| **Scenario** | **Traditional MetaMask** | **With Shard Wallet Snap** |
|--------------|--------------------------|----------------------------|
| Forgot password | 🔴 Lose all funds (unless seed phrase saved) | 🟢 Recover from 2 shards |
| Lost seed phrase | 🔴 Lose all funds | 🟢 Recover from 2 shards |
| Computer hacked | 🔴 Attacker gets password = all funds stolen | 🟢 Attacker needs 2 shards from different locations |
| Phone stolen | 🔴 If unlocked, funds at risk | 🟢 Still need 1+ more shard |
| Setup complexity | 🟢 Simple: password + seed phrase | 🟡 Moderate: + Snap installation |
| Daily usage | 🟢 No difference | 🟢 No difference |

---

## User Experience: Detailed Mockups

### Installation Flow

```
┌─────────────────────────────────────────────┐
│  Shard Wallet - Get Started                 │
├─────────────────────────────────────────────┤
│                                             │
│  🔐 Secure Your Crypto Wallet               │
│                                             │
│  Split your private key into 4 shards.      │
│  Store them in different locations.         │
│  Recover with any 2 shards.                 │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  [Install Shard Wallet Snap]        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Already have MetaMask? ✅                  │
│  Don't have MetaMask? [Install MetaMask]    │
│                                             │
└─────────────────────────────────────────────┘

            ↓ User clicks "Install Shard Wallet Snap"

┌─────────────────────────────────────────────┐
│  MetaMask - Install Snap                     │
├─────────────────────────────────────────────┤
│                                             │
│  📦 Shard Wallet Snap                       │
│  By: Shard Team                             │
│                                             │
│  This Snap wants permission to:             │
│                                             │
│  ✓ Store encrypted data                    │
│  ✓ Send you notifications                  │
│  ✓ Run daily health checks                 │
│  ✓ Communicate with your dapp              │
│                                             │
│  ⚠️  This Snap cannot access your          │
│      MetaMask private keys                  │
│                                             │
│  [Cancel]              [Install]            │
│                                             │
└─────────────────────────────────────────────┘

            ↓ User clicks "Install"

┌─────────────────────────────────────────────┐
│  Shard Wallet - Dashboard                   │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ Snap installed successfully!            │
│                                             │
│  Your Wallets:                              │
│  ┌───────────────────────────────────────┐ │
│  │ 0x742d...4438f44e              🔓     │ │
│  │ Not Secured                           │ │
│  │ [Secure This Wallet]                  │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### Securitization Flow

```
            ↓ User clicks "Secure This Wallet"

┌─────────────────────────────────────────────┐
│  Shard Wallet - Securitize                  │
├─────────────────────────────────────────────┤
│                                             │
│  🔐 Secure Wallet 0x742d...4438f44e         │
│                                             │
│  This will:                                 │
│  1. Split your encryption key into 4 shards │
│  2. Store shards in 4 different locations:  │
│     • SIM Card (Binary SMS)                 │
│     • YubiKey (FIDO2)                       │
│     • Cloud Storage (AWS)                   │
│     • Escrow Service (AWS QLDB)             │
│                                             │
│  You can recover with any 2 shards.         │
│                                             │
│  [Cancel]              [Securitize]         │
│                                             │
└─────────────────────────────────────────────┘

            ↓ User clicks "Securitize"

┌─────────────────────────────────────────────┐
│  Shard Wallet - Processing                  │
├─────────────────────────────────────────────┤
│                                             │
│  ⏳ Securing your wallet...                 │
│                                             │
│  ✓ Generated encryption key                │
│  ✓ Split into 4 shards                     │
│  ⏳ Storing Shard 1 (SIM) ...              │
│  ⏳ Storing Shard 2 (YubiKey) ...          │
│  ⏳ Storing Shard 3 (Cloud) ...            │
│  ⏳ Storing Shard 4 (Escrow) ...           │
│                                             │
│  Please wait...                             │
│                                             │
└─────────────────────────────────────────────┘

            ↓ After ~5 seconds

┌─────────────────────────────────────────────┐
│  Shard Wallet - Success!                    │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ Wallet Secured Successfully!            │
│                                             │
│  Your Wallets:                              │
│  ┌───────────────────────────────────────┐ │
│  │ 0x742d...4438f44e              🔐     │ │
│  │ Secured ✓                             │ │
│  │                                       │ │
│  │ Shard Health:                         │ │
│  │ ✅ SIM Card        Healthy            │ │
│  │ ✅ YubiKey         Healthy            │ │
│  │ ✅ Cloud Storage   Healthy            │ │
│  │ ✅ Escrow Service  Healthy            │ │
│  │                                       │ │
│  │ Overall Status: 🟢 Healthy (4/4)      │ │
│  │                                       │ │
│  │ [Check Health]  [Recover]  [Migrate]  │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### Recovery Flow

```
            ↓ User clicks "Recover"

┌─────────────────────────────────────────────┐
│  Shard Wallet - Recover                     │
├─────────────────────────────────────────────┤
│                                             │
│  🔓 Recover Wallet 0x742d...4438f44e        │
│                                             │
│  This will retrieve your private key from   │
│  the stored shards.                         │
│                                             │
│  ⚠️  Warning:                               │
│  Your private key will be displayed.        │
│  Make sure you're in a private location.    │
│                                             │
│  [Cancel]              [Recover]            │
│                                             │
└─────────────────────────────────────────────┘

            ↓ User clicks "Recover"

┌─────────────────────────────────────────────┐
│  Shard Wallet - Processing                  │
├─────────────────────────────────────────────┤
│                                             │
│  ⏳ Recovering your wallet...               │
│                                             │
│  ✓ Retrieved Shard 1 (SIM)                 │
│  ✓ Retrieved Shard 2 (YubiKey)             │
│  ✓ Reconstructed encryption key             │
│  ⏳ Decrypting private key...               │
│                                             │
│  Please wait...                             │
│                                             │
└─────────────────────────────────────────────┘

            ↓ After ~2 seconds

┌─────────────────────────────────────────────┐
│  Shard Wallet - Recovered                   │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ Wallet Recovered Successfully!          │
│                                             │
│  Your Private Key:                          │
│  ┌───────────────────────────────────────┐ │
│  │ 0x1234567890abcdef1234567890abcdef... │ │
│  │                                       │ │
│  │ [Copy]  [Show QR]  [Hide]             │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ⚠️  Keep this private key safe!            │
│  Anyone with this key can access your funds.│
│                                             │
│  [Import to MetaMask]      [Done]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Security & Privacy Considerations

### What MetaMask CAN Access

```mermaid
graph LR
    subgraph "MetaMask CAN Access"
        A1[Your wallet addresses]
        A2[Transaction history]
        A3[Account balances]
        A4[Networks you connect to]
        A5[Websites you visit with MM]
    end
```

### What Our Snap CAN Access

```mermaid
graph LR
    subgraph "Shard Snap CAN Access"
        B1[Data you explicitly provide<br/>Private key for securitization]
        B2[Its own state storage<br/>Encrypted shards only]
        B3[Trigger notifications<br/>Health check results]
    end
```

### What Our Snap CANNOT Access

```mermaid
graph LR
    subgraph "Shard Snap CANNOT Access"
        C1[❌ Your MetaMask private keys]
        C2[❌ Other Snaps' data]
        C3[❌ Browser localStorage]
        C4[❌ IndexedDB directly]
        C5[❌ Arbitrary network calls]
        C6[❌ DOM/Cookies]
    end
```

### Trust Model

```mermaid
graph TB
    User[User]
    MM[MetaMask<br/>Open Source ✓]
    Snap[Shard Wallet Snap<br/>Open Source ✓]
    Crypto[Noble Crypto Libraries<br/>Open Source ✓<br/>Audited ✓]

    User -->|"Trusts"| MM
    MM -->|"Sandboxes"| Snap
    Snap -->|"Uses"| Crypto

    User -.->|"Can Verify<br/>Source Code"| Snap
    User -.->|"Can Audit<br/>Cryptography"| Crypto

    style MM fill:#9f6,stroke:#333,stroke-width:2px
    style Snap fill:#9cf,stroke:#333,stroke-width:2px
    style Crypto fill:#ff9,stroke:#333,stroke-width:2px
```

### Privacy Guarantees

| **Data** | **Where Stored** | **Who Can Access** |
|----------|------------------|-------------------|
| Private key (original) | User provides, not stored | User only (during recovery) |
| Encryption key shards | 4 different locations | User can reconstruct from any 2 |
| Encrypted secret | MetaMask Snap State | Only the Snap (encrypted) |
| Wallet address | Snap State | Only the Snap |
| Health check results | Snap State | Only the Snap |
| Transaction data | Blockchain (public) | Anyone (this is normal for blockchain) |

---

## Summary: Why This Approach?

### ✅ Advantages

```mermaid
mindmap
  root((Shard Wallet<br/>via MetaMask Snap))
    Security
      Triple sandboxing
      No single point of failure
      2-of-4 threshold recovery
      Open source cryptography
    User Experience
      No separate app install
      Works with existing MetaMask
      One-click installation
      Familiar MetaMask UI
    Trust
      30M+ MetaMask users
      Open source everything
      Auditable code
      No custody of keys
    Cost
      No app store fees
      No backend infrastructure needed initially
      Leverages MetaMask infrastructure
    Compatibility
      Works on Chrome Firefox Edge Brave
      Future mobile support
      Cross-platform
```

### 🟡 Trade-offs

| **Consideration** | **Impact** | **Mitigation** |
|-------------------|-----------|----------------|
| Requires MetaMask installed | Some users may not have it | 30M+ users already have it |
| Snap approval process | Takes time to get listed | Start with developer mode, apply for listing |
| No WebAssembly support yet | Had to use pure JS crypto | Noble crypto is fast enough, WASM coming |
| Limited to browser extension | No standalone app | Most crypto users use browser anyway |

---

## Conclusion

**MetaMask Snaps** provides the perfect platform for Shard Wallet because:

1. ✅ **Security**: Triple-sandboxed execution environment
2. ✅ **Trust**: Users already trust MetaMask
3. ✅ **UX**: Seamless integration with existing workflow
4. ✅ **Distribution**: 30M+ potential users without app stores
5. ✅ **Development**: Rich APIs for crypto operations
6. ✅ **Future-proof**: MetaMask is evolving, Snaps ecosystem growing

**Our end product** is not a separate app, but an **enhancement** to the wallet users already love and trust.

---

## Next Steps

1. **Current (MVP)**: Basic securitization/recovery with mock storage
2. **Phase 2**: Integrate real storage (SIM, YubiKey, AWS)
3. **Phase 3**: Advanced features (social recovery, inheritance)
4. **Phase 4**: Mobile MetaMask support
5. **Phase 5**: Multi-chain support (Polygon, BSC, etc.)

---

**Questions?** See [MetaMask Snaps Documentation](https://docs.metamask.io/snaps/)
