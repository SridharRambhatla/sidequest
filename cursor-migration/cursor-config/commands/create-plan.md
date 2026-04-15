# /create-plan
Generate a markdown execution plan with status tracking.

## Plan Creation Stage
Based on the full exchange, produce a markdown plan document.

## Requirements
- Clear, minimal, concise steps
- Track status using emojis: 🟩 Done, 🟨 In Progress, 🟥 To Do
- Include overall progress percentage at top
- Do NOT add scope beyond clarified details
- Steps are modular and integrate within existing codebase

## Template
# Feature Implementation Plan

**Overall Progress:** `0%`

## TLDR
Short summary of what we're building and why.

## Critical Decisions
- Decision 1: [choice] - [brief rationale]
- Decision 2: [choice] - [brief rationale]

## Tasks:

- [ ] 🟥 **Step 1: [Name]**
  - [ ] 🟥 Subtask 1
  - [ ] 🟥 Subtask 2

- [ ] 🟥 **Step 2: [Name]**
  - [ ] 🟥 Subtask 1
  - [ ] 🟥 Subtask 2

Only write the plan. Do not implement.
