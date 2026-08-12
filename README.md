# GEOCHAIN

GEOCHAIN is a full-stack geospatial data portal that helps users discover, publish, inspect, and verify GeoJSON datasets.

It combines:

- GIS visualization with interactive Leaflet maps.
- MongoDB persistence for users, datasets, metadata, and provenance.
- SHA-256 hashing for tamper detection.
- JWT authentication and role-based authorization.
- MetaMask and an EVM smart contract for on-chain dataset registration.
- Optional IPFS storage integration.

The goal is to make geospatial data easier to explore and more trustworthy by connecting the uploaded file, its database record, its provider, and its blockchain fingerprint.

## Contents

- [Problem statement](#problem-statement)
- [What the project does](#what-the-project-does)
- [Features](#features)
- [Technology stack](#technology-stack)
- [System architecture](#system-architecture)
- [Project structure](#project-structure)
- [User roles](#user-roles)
- [Application flow](#application-flow)
- [Dataset lifecycle](#dataset-lifecycle)
- [Authentication flow](#authentication-flow)
- [Routes](#routes)
- [API reference](#api-reference)
- [Database design](#database-design)
- [Smart contract](#smart-contract)
- [Environment configuration](#environment-configuration)
- [Installation and usage](#installation-and-usage)
- [Sepolia deployment](#sepolia-deployment)
- [Testing](#testing)
- [Sample data](#sample-data)
- [Security](#security)
- [Limitations and future work](#limitations-and-future-work)

## Problem statement

Geospatial data is commonly shared as a file without enough information about its origin or integrity. A user may not know:

- Who uploaded the file.
- Whether the file was modified after publication.
- Which version is the trusted version.
- When it was approved or registered.
- Whether the downloaded file is the same file that was originally published.

GEOCHAIN solves this by validating the GeoJSON file, extracting its metadata, calculating a SHA-256 fingerprint, saving the dataset record in MongoDB, and optionally recording the fingerprint and provenance on-chain.

## What the project does

### For explorers

Users can:

1. Create a normal account.
2. Sign in through the dedicated login route.
3. Search datasets by title, description, or filename.
4. Open a dataset detail route.
5. View the actual uploaded geometry on a Leaflet map.
6. Inspect feature count, geometry, CRS, file size, and hash.
7. Download the source GeoJSON file.
8. Verify a downloaded file against the stored hash.

### For providers

Providers can:

1. Register as a provider.
2. Wait for administrator approval.
3. Open the provider workspace.
4. Upload or drag and drop a GeoJSON file.
5. See the generated metadata and fingerprint.
6. Register the dataset through MetaMask on Sepolia.
7. Delete their own pending datasets.
8. Add versions through the version API.

### For administrators

Administrators can:

1. Sign in using the admin account.
2. See platform dataset statistics.
3. Review pending provider applications.
4. Approve provider accounts.
5. Access the role-specific admin dashboard.

## Features

### Frontend features

- Responsive GEOCHAIN landing page.
- Separate `/login`, `/register`, `/pending-approval`, `/dashboard`, `/about`, and dataset detail routes.
- Protected routes redirect unauthenticated users to `/login`.
- Provider dashboard with drag-and-drop upload UI.
- Admin dashboard with provider approvals and dataset statistics.
- Explorer dashboard for normal users.
- Searchable dataset catalog.
- Dataset cards that open `/datasets/:id`.
- Leaflet map rendering from the actual uploaded GeoJSON.
- Automatic map fitting to uploaded coordinates.
- Dataset metadata and provenance presentation.
- Download, verify, register, and pending-delete actions.
- Profile dropdown with current user name, role, email, dashboard, logout, and account actions.
- Lucide chevron icon in the profile menu.
- Automatic session expiration handling.
- Responsive green/white GEOCHAIN design system.

### Backend features

- Express REST API.
- MongoDB/Mongoose persistence.
- Strict MongoDB mode when `MONGODB_URI` is configured.
- No silent local JSON fallback when MongoDB is configured but unavailable.
- User registration with duplicate-email protection.
- Bcrypt password hashing.
- JWT authentication with one-hour expiry.
- Database-backed role refresh on authenticated requests.
- Provider approval state.
- Account deletion.
- Provider dataset ownership checks.
- GeoJSON file validation.
- Metadata extraction.
- SHA-256 hashing.
- Managed GeoJSON file storage.
- Dataset download endpoint.
- Dataset search endpoint.
- Dataset deletion and deactivation support.
- Dataset version support.
- Blockchain receipt confirmation.
- Optional IPFS adapter.
- Startup storage reconciliation for managed files.

### Blockchain features

- Solidity `GeoDataRegistry` contract.
- Provider role access control.
- Dataset registration by dataset ID and hash.
- Dataset version events.
- Dataset deactivation.
- Provider grants.
- MetaMask transaction flow.
- Sepolia network validation.
- Backend transaction receipt verification.
- Dataset changes to `VERIFIED` only after a successful receipt.

## Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 | User interface and application state |
| Build tool | Vite | Frontend development and production build |
| Styling | CSS | Responsive GEOCHAIN design system |
| Maps | Leaflet and React Leaflet | GeoJSON visualization and map fitting |
| Icons | Lucide React | UI icons such as the profile chevron |
| Wallet | ethers.js and MetaMask | Blockchain transactions |
| Backend | Node.js and Express | REST API and server logic |
| Authentication | JWT and bcryptjs | Sessions and password security |
| Database | MongoDB and Mongoose | Users, datasets, metadata, and provenance |
| Uploads | Multer | Multipart GeoJSON uploads |
| Security middleware | Helmet and CORS | HTTP security headers and cross-origin access |
| Smart contract | Solidity and OpenZeppelin | On-chain registry and access control |
| Contract tooling | Hardhat | Compilation, tests, and deployment |
| Blockchain network | Ethereum Sepolia | Testnet registration |
| Optional storage | IPFS adapter | Decentralized file pinning boundary |

## System architecture

```mermaid
flowchart LR
    U[User Browser]
    F[React + Vite Frontend]
    A[Express REST API]
    M[(MongoDB)]
    S[Managed GeoJSON Storage]
    H[SHA-256 Hashing]
    W[MetaMask]
    C[GeoDataRegistry Solidity Contract]
    R[Sepolia RPC]
    I[Optional IPFS]

    U --> F
    F --> A
    F --> W
    A --> M
    A --> S
    A --> H
    A --> I
    W --> C
    C --> R
    A --> R
    A --> M
```

### Separation of responsibilities

- The frontend handles interaction, routing, maps, forms, and wallet requests.
- The backend validates data, calculates hashes, enforces permissions, stores records, and confirms blockchain receipts.
- MongoDB stores mutable application data and searchable metadata.
- Managed storage stores the uploaded source file used for downloads and verification.
- The smart contract stores registration and provenance events that should remain independently verifiable.

## Project structure

```text
BLOCKCHAIN/
├── backend/
│   ├── src/
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── geojson.js
│   │   ├── ipfs.js
│   │   ├── server.js
│   │   └── store.js
│   ├── storage/
│   │   ├── data.json          # local-only fallback when MongoDB URI is blank
│   │   └── users.json         # local-only fallback when MongoDB URI is blank
│   ├── test/
│   │   └── geojson.test.js
│   └── package.json
├── contracts/
│   ├── contracts/
│   │   └── GeoDataRegistry.sol
│   ├── scripts/
│   │   ├── deploy.js
│   │   └── grant-provider.js
│   ├── test/
│   │   └── GeoDataRegistry.test.js
│   ├── hardhat.config.js
│   └── package.json
├── data/
│   ├── sample-landuse.geojson
│   ├── sample-boundaries.geojson
│   ├── sample-roads.geojson
│   ├── sample-rivers.geojson
│   ├── sample-city-parks.geojson
│   ├── sample-transit-stops.geojson
│   ├── sample-flood-zones.geojson
│   └── sample-bike-routes.geojson
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── styles.css
│   │   ├── modern-home.css
│   │   ├── provider-dashboard.css
│   │   ├── modern-about.css
│   │   ├── modern-dataset.css
│   │   ├── workspace.css
│   │   └── ...
│   ├── index.html
│   └── package.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Important files

| File | Responsibility |
|---|---|
| `frontend/src/main.jsx` | React routes, page components, API calls, and wallet actions |
| `frontend/src/modern-home.css` | Landing page and catalog visual system |
| `frontend/src/provider-dashboard.css` | Provider upload workspace |
| `frontend/src/modern-dataset.css` | Dataset detail page |
| `backend/src/server.js` | Express routes, upload handling, and API startup |
| `backend/src/auth.js` | Registration, login, JWT, roles, approval, account deletion |
| `backend/src/store.js` | MongoDB models, dataset persistence, file reconciliation |
| `backend/src/geojson.js` | GeoJSON validation and metadata extraction |
| `backend/src/ipfs.js` | Optional IPFS upload adapter |
| `contracts/contracts/GeoDataRegistry.sol` | Dataset registry smart contract |
| `contracts/scripts/deploy.js` | Contract deployment |
| `contracts/scripts/grant-provider.js` | Provider role grant |
| `data/*.geojson` | Sample files for testing |

## User roles

| Role | Description | Access |
|---|---|---|
| `USER` | Explorer who consumes data | Catalog, search, maps, downloads, verification |
| `PROVIDER` | Publisher of geospatial data | Upload, pending management, blockchain registration |
| `ADMIN` | Platform operator | Provider approval, statistics, administrative dashboard |

Provider accounts are created with `approved: false`. They cannot publish until an admin approves them.

## Application flow

```mermaid
flowchart TD
    Start[Open application]
    Session{JWT session exists?}
    Login[Redirect to /login]
    Auth[Sign in or register]
    Role{Account role}
    User[User dashboard]
    ProviderWait[Provider approval pending]
    Provider[Provider dashboard]
    Admin[Admin dashboard]
    Catalog[Search catalog]
    Detail[Open dataset detail]

    Start --> Session
    Session -- No --> Login
    Login --> Auth
    Auth --> Role
    Session -- Yes --> Role
    Role -- USER --> User
    Role -- PROVIDER --> Provider
    Role -- ADMIN --> Admin
    Auth --> ProviderWait
    User --> Catalog
    Provider --> Catalog
    Admin --> Catalog
    Catalog --> Detail
```

## Provider upload flow

```mermaid
sequenceDiagram
    actor Provider
    participant UI as React Provider Dashboard
    participant API as Express API
    participant DB as MongoDB
    participant FS as Managed Storage

    Provider->>UI: Enter title and description
    Provider->>UI: Select or drop GeoJSON file
    UI->>API: POST /api/datasets multipart form
    API->>API: Validate GeoJSON
    API->>API: Extract metadata
    API->>API: Calculate SHA-256
    API->>FS: Save uploaded file
    API->>DB: Save dataset with BLOCKCHAIN_PENDING
    DB-->>API: Dataset record
    API-->>UI: Return datasetId and metadata
    UI->>UI: Navigate to /datasets/:id
```

## Dataset lifecycle

```mermaid
stateDiagram-v2
    [*] --> BLOCKCHAIN_PENDING: Valid upload
    BLOCKCHAIN_PENDING --> BLOCKCHAIN_PENDING: MetaMask cancelled
    BLOCKCHAIN_PENDING --> VERIFIED: Successful Sepolia receipt
    BLOCKCHAIN_PENDING --> FAILED: Failed blockchain transaction
    BLOCKCHAIN_PENDING --> [*]: Provider deletes pending dataset
    VERIFIED --> VERIFIED: File hash matches
    VERIFIED --> FAILED: Uploaded file hash differs
    VERIFIED --> DEACTIVATED: Admin/provider deactivates
```

### Dataset states

- `BLOCKCHAIN_PENDING`: Valid file saved but not registered on-chain.
- `VERIFIED`: Successful blockchain receipt confirmed by the backend.
- `FAILED`: Blockchain transaction or verification failed.
- `DEACTIVATED`: Dataset has been intentionally disabled.

## Blockchain registration flow

```mermaid
sequenceDiagram
    actor Provider
    participant UI as React + ethers.js
    participant MM as MetaMask
    participant Chain as Sepolia Contract
    participant API as Express API
    participant RPC as Sepolia RPC
    participant DB as MongoDB

    Provider->>UI: Click Register with MetaMask
    UI->>MM: Request registerDataset(datasetId, hash, reference)
    alt Provider cancels
        MM-->>UI: ACTION_REJECTED
        UI-->>Provider: Registration cancelled; dataset remains pending
    else Provider confirms
        MM->>Chain: Submit transaction
        Chain-->>MM: Transaction hash
        UI->>Chain: Wait for confirmation
        UI->>API: POST blockchain-confirm with tx hash
        API->>RPC: eth_getTransactionReceipt
        RPC-->>API: Successful receipt
        API->>DB: Set status to VERIFIED
        API-->>UI: Verified dataset
    end
```

Cancelling MetaMask does not change the dataset state. The dataset stays `BLOCKCHAIN_PENDING` and displays a friendly cancellation message.

## Authentication flow

```mermaid
sequenceDiagram
    actor User
    participant UI as React frontend
    participant API as Express API
    participant DB as MongoDB

    User->>UI: Submit email and password
    UI->>API: POST /api/auth/login
    API->>DB: Find user by email
    API->>API: Compare bcrypt password hash
    API-->>UI: JWT with one-hour expiry
    UI->>UI: Store session token locally
    UI->>API: Send Authorization Bearer token
    API->>API: Verify JWT
    API->>DB: Refresh role and user state
    API-->>UI: Authorized response
    Note over UI: On expiry or 401, clear session and redirect to /login
```

The current implementation stores the JWT in `localStorage`; it is not an HTTP-only cookie. The token expires after one hour, and the frontend also schedules an automatic redirect when the JWT expiry time is reached.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Authenticated | Landing page and searchable catalog |
| `/login` | Public | Sign in |
| `/register` | Public | Create user or provider account |
| `/pending-approval` | Public after registration | Provider waiting state |
| `/dashboard` | Authenticated | Role-specific workspace |
| `/about` | Authenticated | Platform explanation |
| `/datasets/:id` | Authenticated | Dataset detail and provenance |

Unauthenticated users who open protected routes are redirected to `/login`.

## API reference

All API endpoints are prefixed with `/api`.

### Authentication endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/auth/register` | Register a user or provider |
| `POST` | `/auth/login` | Return a JWT |
| `POST` | `/auth/logout` | Logout API endpoint |
| `GET` | `/auth/me` | Return the current user from the database |
| `DELETE` | `/auth/me` | Delete the current account |

### Dataset endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/datasets` | List, paginate, and search datasets |
| `GET` | `/datasets/:id` | Get dataset details and provider name |
| `POST` | `/datasets` | Upload a GeoJSON dataset |
| `GET` | `/datasets/:id/download` | Download source file |
| `POST` | `/datasets/:id/verify` | Verify an uploaded file hash |
| `POST` | `/datasets/:id/versions` | Add a new dataset version |
| `POST` | `/datasets/:id/deactivate` | Deactivate a dataset |
| `DELETE` | `/datasets/:id` | Delete an owned pending dataset |
| `POST` | `/datasets/:id/blockchain-confirm` | Confirm a real blockchain receipt |

### Admin and system endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/admin/providers` | List pending providers |
| `POST` | `/admin/providers/:id/approve` | Approve provider |
| `GET` | `/admin/stats` | Dataset statistics |
| `GET` | `/health` | API health and storage backend |
| `GET` | `/blockchain/config` | Blockchain configuration status |

## Database design

### Users collection

```text
id
name
email
password       bcrypt hash
role           USER | PROVIDER | ADMIN
approved       boolean
```

### Datasets collection

```text
datasetId
title
description
providerId
fileName
storagePath
ipfsCid
sha256
metadata
status
versions[]
createdAt
updatedAt
```

### Metadata extracted from GeoJSON

```text
featureCount
geometryTypes
crs
boundingBox
fileSize
```

MongoDB is the source of truth when `MONGODB_URI` is configured. Local JSON is used only when the MongoDB URI is intentionally blank for an offline demo.

## Smart contract

The contract is `contracts/contracts/GeoDataRegistry.sol`.

It provides:

- Provider role access control.
- Dataset registration by dataset ID and content hash.
- Storage reference support.
- Dataset version events.
- Dataset deactivation.
- Provider grant functionality.
- Event history for provenance.

The frontend uses ethers.js to request a MetaMask transaction. The backend verifies the actual receipt through the configured RPC endpoint before changing the database status to `VERIFIED`.

## Environment configuration

Create a root `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Example structure:

```env
PORT=4000
JWT_SECRET=replace-with-a-long-random-secret
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/geochain

VITE_API_URL=http://localhost:4000/api

BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
BLOCKCHAIN_NETWORK=sepolia
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
PROVIDER_PRIVATE_KEY=0xYOUR_PROVIDER_PRIVATE_KEY

IPFS_API_URL=
IPFS_API_TOKEN=
```

Important rules:

- Use `.env` for real values and keep `.env.example` as a template.
- Never commit `.env`.
- Never commit wallet private keys, RPC keys, database passwords, or IPFS tokens.
- RPC URL means the complete Alchemy Sepolia endpoint.
- A private key must have exactly one `0x` prefix.
- Use a test wallet and Sepolia ETH for development.

## Installation and usage

### Requirements

- Node.js 18 or newer.
- npm.
- MongoDB or MongoDB Atlas.
- MetaMask for blockchain registration.
- Sepolia ETH for testnet transactions.

### Install dependencies

From the project root:

```powershell
npm install
```

### Start the application

Run frontend and backend together:

```powershell
npm run dev
```

Or run them separately:

```powershell
node backend/src/server.js
```

```powershell
npm run dev --workspace frontend
```

Open:

- Frontend: <http://localhost:5173>
- API health: <http://localhost:4000/api/health>

### Default development admin

```text
Email:    admin@geochain.local
Password: Admin@123
```

Change this before deploying or sharing the project.

## Complete demonstration procedure

1. Start MongoDB and confirm `/api/health` reports MongoDB.
2. Open the frontend. If not signed in, it redirects to `/login`.
3. Register a provider account.
4. Sign in as the development admin.
5. Open the dashboard and approve the provider.
6. Sign in as the provider.
7. Open the provider dashboard.
8. Upload one of the files in `data/`.
9. Inspect the metadata and map on `/datasets/:id`.
10. Confirm the dataset is `BLOCKCHAIN_PENDING`.
11. Switch MetaMask to Sepolia.
12. Click `Register with MetaMask`.
13. Confirm the transaction.
14. Wait for the receipt and confirm the state changes to `VERIFIED`.
15. Download the source file.
16. Verify the unchanged file.
17. Change one coordinate or property and verify again.
18. Confirm the modified file fails hash verification.

If MetaMask is cancelled, no blockchain state or database status is changed; the dataset remains pending.

## Sepolia deployment

1. Add `BLOCKCHAIN_RPC_URL` and `DEPLOYER_PRIVATE_KEY` to `.env`.
2. Compile the contract:

```powershell
npm run compile --workspace contracts
```

3. Deploy:

```powershell
npm run deploy:sepolia --workspace contracts
```

4. Copy the printed `CONTRACT_ADDRESS` into `.env`.
5. Set:

```env
BLOCKCHAIN_NETWORK=sepolia
```

6. Restart the backend and frontend.
7. Grant the provider role if the workflow requires it:

```powershell
npm run grant-provider --workspace contracts
```

The grant script requires a valid provider wallet address. Do not add a second `0x` prefix.

## Testing and build commands

Backend tests:

```powershell
npm test
```

Smart contract tests:

```powershell
npm run contract:test
```

Frontend production build:

```powershell
npm run build
```

The tests currently cover GeoJSON metadata extraction, invalid GeoJSON rejection, smart-contract registration, and access control.

## Sample data

The `data/` directory includes sample files with different locations and geometry types:

| File | Example content |
|---|---|
| `sample-landuse.geojson` | Kolkata polygon |
| `sample-boundaries.geojson` | Jaipur polygon |
| `sample-roads.geojson` | Mumbai line data |
| `sample-rivers.geojson` | Bengaluru line data |
| `sample-city-parks.geojson` | Hyderabad polygon data |
| `sample-transit-stops.geojson` | Chennai point data |
| `sample-flood-zones.geojson` | Ahmedabad polygon data |
| `sample-bike-routes.geojson` | Pune line data |

The detail map uses the uploaded geometry and automatically fits to its bounding box. It does not use a fixed Delhi geometry for dataset detail pages.

## Security model

- Passwords are bcrypt-hashed.
- JWTs expire after one hour.
- Protected routes redirect unauthenticated users to `/login`.
- API authorization checks the JWT and refreshes role data from MongoDB.
- Deleted users cannot continue using an old JWT.
- Provider mutation routes check dataset ownership.
- Uploads require GeoJSON-compatible file extensions.
- SHA-256 is calculated from uploaded bytes on the backend.
- MetaMask cancellation does not mark a dataset verified.
- MongoDB and blockchain secrets are loaded from environment variables.

For production, the session should be migrated from `localStorage` to secure HTTP-only cookies with CSRF protection, refresh-token rotation, rate limiting, HTTPS, malware scanning, and centralized secret management.

## Limitations and future work

- IPFS is optional and requires an external pinning service configuration.
- Blockchain registration is currently initiated by the provider through MetaMask.
- A background reconciliation worker would improve recovery if chain confirmation succeeds but the database update is interrupted.
- The catalog can be extended with spatial filtering and MongoDB geospatial indexes.
- Production deployment should add CI/CD, monitoring, backups, rate limiting, and error reporting.
- The frontend bundle can be split further for improved performance.

## Project summary

GEOCHAIN connects a GIS catalog, a secure application backend, and a blockchain registry.

```text
Discover data
    ↓
Validate GeoJSON
    ↓
Extract metadata + SHA-256 fingerprint
    ↓
Store file and record in MongoDB
    ↓
Register fingerprint on Sepolia
    ↓
Verify the file later by recalculating its hash
```

This gives providers a controlled publishing workflow, administrators an approval workflow, and users a practical way to inspect and verify geospatial data.
