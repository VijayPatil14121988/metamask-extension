# Real Storage Integration - Dependencies Analysis

**Epic 4: Real Storage Implementation**
**Date**: November 5, 2025

---

## Overview: 4 Storage Locations

| Storage | Current Mock | Real Implementation | Complexity |
|---------|-------------|---------------------|------------|
| **SIM Shard** | localStorage | Binary SMS via Twilio | 🔴 HIGH |
| **YubiKey Shard** | IndexedDB | FIDO2 WebAuthn largeBlob | 🟡 MEDIUM |
| **Custodial Shard** | localStorage | AWS DynamoDB + API Gateway | 🟢 LOW |
| **Escrow Shard** | localStorage | AWS QLDB + API Gateway | 🟡 MEDIUM |

---

## 1. SIM Storage (Binary SMS) 🔴 HIGH COMPLEXITY

### External Services Required
1. **Twilio Account**
   - Account SID
   - Auth Token
   - Programmable SMS service
   - Phone number ($1-15/month per number)
   - SMS costs: ~$0.0075/message (inbound + outbound)

### Infrastructure Dependencies
```yaml
Services:
  - Twilio Programmable SMS
  - Webhook endpoint (for receiving SMS)
  - Backend service to handle SMS routing

Cost Estimate:
  - Phone number: $1-15/month
  - SMS messages: $0.0075 per SMS (150 KB data = ~3-4 SMS)
  - Monthly (100 users): ~$50-100
```

### Technical Requirements
- **Binary SMS Encoding**: Convert Uint8Array to binary SMS format
  - PDU (Protocol Data Unit) encoding
  - UCS2 encoding for binary data
  - Message concatenation (shards > 140 bytes need multiple SMS)

- **SMS Gateway Integration**:
  ```javascript
  // Required: Twilio Node.js SDK
  npm install twilio

  // Example: Send binary SMS
  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);

  await client.messages.create({
    body: encodedBinaryShard,
    from: twilioPhoneNumber,
    to: userPhoneNumber
  });
  ```

- **Webhook Endpoint**: Receive SMS
  ```javascript
  // Backend endpoint to receive SMS
  POST /api/sms/receive
  - Parse Twilio webhook payload
  - Decode binary SMS
  - Store shard temporarily
  - Return TwiML response
  ```

### Implementation Steps
1. ✅ Set up Twilio account
2. ✅ Purchase phone number
3. ⏳ Implement binary SMS encoder/decoder
4. ⏳ Create webhook endpoint (Express/Lambda)
5. ⏳ Implement SIMStorage adapter
6. ⏳ Test with real SMS messages

### Risks & Challenges
- ❌ **SMS Delivery**: Not guaranteed, can be delayed
- ❌ **Cost**: Higher than other options
- ❌ **User Experience**: Requires phone number, SMS permissions
- ❌ **Privacy**: SMS passes through carrier networks
- ✅ **Benefit**: Works offline, phone-based recovery

### Alternative Options
**Option A**: Use SIM Toolkit (STK) for true SIM card storage
- Requires carrier partnership
- More complex but more secure
- Not feasible for MVP

**Option B**: Use SMS but with simpler text encoding
- Base64 encode shard
- Easier to implement
- Less efficient (more messages)

---

## 2. YubiKey Storage (FIDO2 WebAuthn) 🟡 MEDIUM COMPLEXITY

### External Services Required
**NONE** - Client-side only! ✅

### Hardware Requirements
- **YubiKey 5 Series** ($45-70 per key)
  - Supports FIDO2
  - Has `largeBlob` extension (up to 2KB storage)
  - USB-A, USB-C, NFC variants available

### Browser Requirements
```yaml
Browser Support:
  Chrome: ✅ 87+ (largeBlob support)
  Firefox: ✅ 84+
  Safari: ✅ 14+
  Edge: ✅ 87+

MetaMask: ✅ Runs in browser context, can access WebAuthn API
```

### Technical Requirements
- **WebAuthn API**: Native browser API (no external library needed)
  ```javascript
  // Registration: Store shard
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge,
      rp: { name: "Shard Wallet" },
      user: {
        id: userIdBytes,
        name: walletAddress,
        displayName: walletAddress,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform",
        residentKey: "required",
      },
      extensions: {
        largeBlob: {
          support: "required",
          read: false,
          write: shardBytes, // Store shard here
        },
      },
    },
  });
  ```

- **Retrieval**: Get shard back
  ```javascript
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge,
      extensions: {
        largeBlob: {
          read: true,
        },
      },
    },
  });

  const shard = assertion.getClientExtensionResults().largeBlob.blob;
  ```

### Implementation Steps
1. ✅ Check WebAuthn browser support
2. ⏳ Implement WebAuthn registration flow
3. ⏳ Implement largeBlob read/write
4. ⏳ Handle YubiKey user prompts (touch required)
5. ⏳ Implement YubiKeyStorage adapter
6. ⏳ Test with physical YubiKey

### Risks & Challenges
- ✅ **No Backend**: Pure client-side, very secure
- ⚠️ **User Experience**: Requires physical YubiKey + touch
- ⚠️ **Cost**: Users must buy YubiKey ($45-70)
- ⚠️ **Size Limit**: 2KB max (our shards are ~32-48 bytes, so OK)
- ✅ **Security**: Best security option (hardware-backed)

### Cost Estimate
```yaml
Development:
  - YubiKey for testing: $50 one-time
  - No recurring costs

User:
  - YubiKey purchase: $45-70 one-time
  - No recurring costs
```

---

## 3. Custodial Storage (AWS DynamoDB) 🟢 LOW COMPLEXITY

### AWS Services Required
1. **DynamoDB** - NoSQL database
2. **API Gateway** - REST API
3. **Lambda** - Serverless functions
4. **Cognito** (optional) - User authentication
5. **IAM** - Permissions

### Infrastructure Setup
```yaml
DynamoDB Table:
  Name: shard-custodial-storage
  Primary Key: walletAddress (String)
  Sort Key: shardId (String)
  Attributes:
    - shardData (Binary)
    - timestamp (Number)
    - metadata (Map)
  Billing: On-Demand or Provisioned
  Encryption: AWS KMS (enabled by default)

API Gateway:
  Type: REST API
  Endpoints:
    - POST /shards - Store shard
    - GET /shards/{walletAddress} - Retrieve shard
    - DELETE /shards/{walletAddress}/{shardId} - Delete shard
  Auth: API Key or AWS IAM

Lambda Functions:
  - storeShardFunction (Node.js 20.x)
  - retrieveShardFunction
  - deleteShardFunction
  Runtime: Node.js 20.x
  Memory: 256 MB
  Timeout: 10 seconds
```

### Cost Estimate
```yaml
Monthly Costs (100 users, 10 operations/user):
  DynamoDB:
    - Write requests: $0.00125 per 1000 writes
    - Read requests: $0.00025 per 1000 reads
    - Storage: $0.25 per GB
    - Estimate: ~$5-10/month

  Lambda:
    - 1M requests/month free
    - $0.20 per 1M requests after
    - Estimate: ~$1-2/month

  API Gateway:
    - $3.50 per million calls
    - Estimate: ~$1-2/month

  Total: ~$7-15/month for 100 users
```

### Technical Requirements
```javascript
// AWS SDK v3
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

// Lambda function example
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);

  await docClient.send(new PutCommand({
    TableName: "shard-custodial-storage",
    Item: {
      walletAddress: event.walletAddress,
      shardId: event.shardId,
      shardData: event.shardData, // Binary
      timestamp: Date.now(),
      metadata: event.metadata,
    },
  }));

  return { statusCode: 200, body: "Shard stored" };
};
```

### Implementation Steps
1. ⏳ Create AWS account
2. ⏳ Set up DynamoDB table (Terraform/CloudFormation)
3. ⏳ Create Lambda functions
4. ⏳ Deploy API Gateway
5. ⏳ Configure IAM roles
6. ⏳ Implement CustodialStorage adapter (calls API)
7. ⏳ Test with real AWS environment

### Risks & Challenges
- ✅ **Easiest to implement** - Standard AWS patterns
- ✅ **Scalable** - Handles millions of requests
- ✅ **Reliable** - AWS SLA 99.99%
- ⚠️ **Cost** - Recurring monthly costs
- ⚠️ **Vendor Lock-in** - AWS-specific

---

## 4. Escrow Storage (AWS QLDB) 🟡 MEDIUM COMPLEXITY

### AWS Services Required
1. **QLDB** (Quantum Ledger Database) - Immutable ledger
2. **API Gateway** - REST API
3. **Lambda** - Serverless functions
4. **IAM** - Permissions

### Infrastructure Setup
```yaml
QLDB Ledger:
  Name: shard-escrow-ledger
  Permissions Mode: STANDARD
  Deletion Protection: ENABLED
  Tables:
    - ShardEscrow
      - walletAddress (String)
      - shardId (String)
      - shardData (Blob)
      - timestamp (Timestamp)
      - metadata (Document)

  Features:
    - Immutable history (all changes logged)
    - Cryptographic verification
    - PartiQL query language (SQL-like)

API Gateway:
  Type: REST API
  Endpoints:
    - POST /escrow/shards - Store shard (append-only)
    - GET /escrow/shards/{walletAddress} - Retrieve latest
    - GET /escrow/history/{walletAddress} - Get full history
  Auth: API Key + AWS Signature v4

Lambda Functions:
  - storeEscrowShardFunction
  - retrieveEscrowShardFunction
  - getEscrowHistoryFunction
```

### Cost Estimate
```yaml
Monthly Costs (100 users):
  QLDB:
    - Write I/O: $0.4334 per 1M writes
    - Read I/O: $0.1735 per 1M reads
    - Storage: $0.1386 per GB-month
    - Journal storage: $0.0695 per GB-month
    - Estimate: ~$10-20/month

  Lambda + API Gateway: ~$2-3/month

  Total: ~$12-25/month for 100 users
```

### Technical Requirements
```javascript
// AWS SDK v3
npm install @aws-sdk/client-qldb @aws-sdk/client-qldb-session amazon-qldb-driver-nodejs

// Lambda function example
import { QldbDriver } from 'amazon-qldb-driver-nodejs';

const qldbDriver = new QldbDriver('shard-escrow-ledger');

export const handler = async (event) => {
  const result = await qldbDriver.executeLambda(async (txn) => {
    return await txn.execute(
      'INSERT INTO ShardEscrow VALUE ?',
      {
        walletAddress: event.walletAddress,
        shardId: event.shardId,
        shardData: event.shardData,
        timestamp: new Date().toISOString(),
        metadata: event.metadata,
      }
    );
  });

  return { statusCode: 200, body: "Shard escrowed" };
};
```

### Implementation Steps
1. ⏳ Create QLDB ledger
2. ⏳ Create tables using PartiQL
3. ⏳ Set up Lambda functions with QLDB driver
4. ⏳ Deploy API Gateway
5. ⏳ Configure IAM roles
6. ⏳ Implement EscrowStorage adapter
7. ⏳ Test immutability features

### Risks & Challenges
- ⚠️ **Complexity** - QLDB is more complex than DynamoDB
- ✅ **Immutability** - Perfect for escrow (audit trail)
- ✅ **Cryptographic Proof** - Can verify history integrity
- ⚠️ **Cost** - Slightly more expensive than DynamoDB
- ⚠️ **Learning Curve** - PartiQL, transaction model

---

## Summary: Dependencies Checklist

### ✅ No External Dependencies (Can Start Now)
- **YubiKey Storage** - Only needs browser WebAuthn API + physical YubiKey for testing

### 🟡 AWS Account Required
- **Custodial Storage (DynamoDB)** - AWS account + ~$10/month
- **Escrow Storage (QLDB)** - AWS account + ~$15/month

### 🔴 Third-Party Service Required
- **SIM Storage (Twilio)** - Twilio account + phone number + ~$50-100/month

---

## Recommended Implementation Order

### Phase 1: Easy Wins (Week 1-2)
1. **YubiKey Storage** 🟢
   - No backend needed
   - Pure client-side
   - Test with $50 YubiKey
   - **Effort**: 2-3 days

2. **Custodial Storage (DynamoDB)** 🟢
   - Standard AWS pattern
   - Well-documented
   - Low cost
   - **Effort**: 3-5 days

### Phase 2: Medium Complexity (Week 3)
3. **Escrow Storage (QLDB)** 🟡
   - Similar to DynamoDB
   - Adds immutability
   - **Effort**: 3-5 days

### Phase 3: Complex (Week 4+)
4. **SIM Storage (Twilio SMS)** 🔴
   - Most complex
   - Requires backend webhook
   - Higher cost
   - **Effort**: 5-7 days
   - **Alternative**: Could skip for MVP, use 3-of-3 instead of 2-of-4

---

## Cost Comparison: MVP vs Production

### MVP (First 3 Months, 10 Beta Users)
```yaml
YubiKey: $50 (one-time for testing)
AWS DynamoDB: $2/month
AWS QLDB: $3/month
Twilio SMS: Skip for MVP (use 3-of-3 without SMS)
Total: $55 setup + $5/month
```

### Production (1,000 Active Users)
```yaml
YubiKey: $0 (users buy their own)
AWS DynamoDB: $50/month
AWS QLDB: $80/month
Twilio SMS: $500/month (if enabled)
Total: $130/month (without SMS) or $630/month (with SMS)
```

---

## Alternative: Simplified MVP Approach

### Option: Skip SMS Storage for MVP
**Use 3-storage-locations instead of 4**:
- ✅ YubiKey (hardware)
- ✅ Custodial (DynamoDB)
- ✅ Escrow (QLDB)
- ❌ SIM (skip for now)

**Threshold**: 2-of-3 instead of 2-of-4

**Benefits**:
- 50% cost reduction ($130 vs $630/month)
- Faster implementation (skip most complex part)
- Still secure (2-of-3 is standard)
- Can add SMS storage later

**Trade-offs**:
- Less redundancy (lose 1 more shard = cannot recover)
- No phone-based recovery option

---

## Next Steps: Choose Your Path

### Path A: Full Implementation (All 4 Storage)
**Timeline**: 4 weeks
**Cost**: ~$630/month at scale
**Complexity**: HIGH
**Best For**: Production-ready system

### Path B: MVP (3 Storage, Skip SMS)
**Timeline**: 2 weeks
**Cost**: ~$130/month at scale
**Complexity**: MEDIUM
**Best For**: Beta testing, faster market

### Path C: Start with Easiest (YubiKey only)
**Timeline**: 3 days
**Cost**: $50 one-time
**Complexity**: LOW
**Best For**: Quick validation

---

## My Recommendation: **Path B (MVP)**

**Why**:
1. ✅ Skip the most complex part (SMS)
2. ✅ Still highly secure (2-of-3 threshold)
3. ✅ 75% cost reduction
4. ✅ Can launch 2 weeks faster
5. ✅ Add SMS storage in v2 if needed

**Implementation Order**:
Week 1: YubiKey Storage → Test with real hardware
Week 2: AWS Setup → DynamoDB + QLDB + Lambda + API Gateway
Week 3: Integration Testing → Full securitization/recovery flow
Week 4: Buffer for issues

---

What would you like to do? Start with:
1. **YubiKey** (easiest, no backend)
2. **AWS DynamoDB** (if you have AWS account)
3. **Full dependency setup** (all services at once)
4. **MVP path** (skip SMS, do 3-of-3)
