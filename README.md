# AI App Generator 🚀

## Overview
Convert JSON config into full-stack apps (UI + API + DB)

## Features
- Dynamic UI rendering
- Dynamic API generation
- PostgreSQL schema auto-creation
- Fault-tolerant config handling

## Tech Stack
- Next.js
- Node.js + TypeScript
- PostgreSQL

## Run

### Backend
cd apps/backend
npm install
npm run dev

### Frontend
cd apps/frontend
npm install
npm run dev


### Exmaple JSON Config
{
  "appName": "Task Manager",
  "pages": [
    {
      "name": "Home",
      "components": [
        { "type": "table", "entity": "tasks" },
        { "type": "form", "entity": "tasks" }
      ]
    }
  ],
  "database": {
    "tables": [
      {
        "name": "tasks",
        "fields": {
          "id": "uuid",
          "title": "string",
          "completed": "boolean"
        }
      }
    ]
  }
}

### Project-Structure
ai-app-generator/
├── apps/
│   ├── frontend   → Next.js UI generator
│   └── backend    → API + config engine
├── packages/      → Shared modules
├── configs/       → JSON app definitions
├── docker/        → Container setup (optional)
└── README.md

### Architecture
JSON Config
     ↓
Config Engine (Parser)
     ↓
Backend Generator (Node.js + TS)
     ↓
Database Layer (PostgreSQL Schema Builder)
     ↓
Frontend Renderer (Next.js UI Generator)
     ↓
Fully Working Full-Stack App