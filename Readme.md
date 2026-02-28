# PeerFlow – Graph Optimized Peer-to-Peer Expense Splitter

A full-stack web application that simplifies shared expenses using graph-based optimization to minimize settlement transactions.

---

## 1. Problem Statement

### Problem Title
Peer-to-Peer Expense Splitter with Debt Simplification

### Problem Description
Shared expenses are common among flatmates, travel groups, colleagues, and families. While digital payments simplify money transfers, managing multi-party expense settlements remains inefficient.

Most existing tools calculate balances but do not minimize the number of transactions required to settle group debts. This results in redundant payment chains, complex debt loops, and increased coordination effort.

Without simplification:
- Groups perform more transactions than necessary
- Settlement confusion increases
- Time and coordination effort grow
- Financial transparency decreases
- Manual or naive settlement methods lead to inefficiency

There is no intelligent optimization layer using graph algorithms to simplify settlements.

### Target Users
- Flatmates sharing rent and utilities
- Travel groups managing trip expenses
- Friends splitting bills
- Families managing shared costs
- Startup teams or office colleagues

### Existing Gaps
- No transaction minimization logic
- Complex circular debt loops
- Redundant intermediate payment chains
- Poor visualization of “who owes whom”
- Weak handling of recurring expenses
- Limited support for partial payments
- Currency rounding edge cases
- Lack of financial clarity in multi-party groups

---

## 2. Problem Understanding & Approach

### Root Cause Analysis
The inefficiency in shared expense systems arises because:

- Debts are treated as isolated transactions instead of a connected financial graph.
- Net balances are calculated but not globally optimized.
- Debt cycles are not detected or eliminated.
- Settlement logic does not minimize transaction count.
- Floating-point arithmetic causes rounding inconsistencies.
- Partial and recurring payments complicate balance tracking.

The absence of a graph-based optimization layer results in redundant and inefficient settlements.

### Solution Strategy
We model the system as a directed weighted graph:

- Each participant → Node
- Each debt → Directed edge
- Edge weight → Amount owed

Our strategy:

1. Log shared expenses clearly.
2. Compute accurate net balances for each participant.
3. Separate users into creditors (positive balance) and debtors (negative balance).
4. Apply a Minimum Cash Flow algorithm.
5. Minimize the number of settlement transactions.
6. Visualize debt graphs before and after simplification.
7. Handle recurring and partial payments robustly.
8. Store monetary values in the smallest currency unit to avoid rounding errors.

This transforms expense settlement into a structured optimization problem.

---

## 3. Proposed Solution

### Solution Overview
PeerFlow is a production-ready full-stack web application that allows users to:

- Create and join groups via unique codes
- Log shared expenses
- Automatically calculate net balances
- Simplify debts using graph-based optimization
- Visualize debt networks
- Manage recurring and partial payments efficiently

### Core Idea
Instead of only calculating balances, the system intelligently reduces the number of required transactions using a Minimum Cash Flow algorithm.

By optimizing globally rather than pairwise, redundant chains and circular debts are eliminated, reducing coordination overhead.

### Key Features
- Secure user authentication
- Group creation with unique join codes
- Expense logging with equal or custom splits
- Recurring expense handling
- Partial payment tracking
- Net balance computation
- Minimum Cash Flow optimization
- Before-and-after debt graph visualization
- Rounding-safe currency handling
- Clean dashboard with balance summaries

---

## 4. System Architecture

### High-Level Flow
User → Frontend → Backend → Model → Database → Response

### Architecture Description

Frontend:
- React (JavaScript)
- Context API for global state management
- React Hook Form for form validation
- D3.js / vis-network for graph visualization

Backend:
- Node.js + Express
- MongoDB (Mongoose)
- JWT-based authentication
- Graph-based Minimum Cash Flow algorithm layer

Database:
- Stores users, groups, expenses, splits, settlements, and payments
- Monetary values stored in smallest currency units to avoid rounding errors

The backend computes net balances and applies the optimization algorithm before returning simplified settlements to the frontend.

### Architecture Diagram

```mermaid
graph TD

    User["User (Browser / Client)"] --> Frontend["React Frontend (Vite + Context API + Tailwind)"]

    Frontend -->|HTTP Requests (REST APIs)| Backend["Express Backend API (Node.js)"]

    Backend -->|Compute Net Balances| Algorithm["Optimization Layer<br/>Minimum Cash Flow Algorithm"]

    Algorithm -->|Optimized Settlements| Backend

    Backend -->|Read / Write| Database["MongoDB Atlas Database"]

    Database -->|Query Results| Backend

    Backend -->|JSON Response| Frontend

    Backend --> Auth["JWT Authentication"]
    Backend --> Socket["Socket.io (Real-time Chat)"]

    Socket --> Frontend
```