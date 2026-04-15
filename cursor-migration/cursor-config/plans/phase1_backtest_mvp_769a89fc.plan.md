---
name: Phase1 Backtest MVP
overview: Wrap up Phase 1 by hardening the backtest engine to a realistic, testable MVP for end-to-end strategy runs.
todos:
  - id: bt-mtm
    content: Add MTM P&L fields and equity snapshots in Portfolio/Engine
    status: completed
  - id: bt-liquidity
    content: Add liquidity model + partial fills in BacktestEngine
    status: completed
  - id: bt-tests
    content: Add deterministic tests for fills and equity curve
    status: completed
  - id: bt-docs
    content: Update README usage if assumptions changed
    status: completed
---

## Scope

- Focus on backtest engine realism for MVP end-to-end runs (per your selection).

## Files to Change

- Backtest core: [`/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/engine.py`](/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/engine.py)(/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/engine.py)(/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/engine.py)
- Portfolio accounting: [`/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/portfolio.py`](/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/portfolio.py)(/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/portfolio.py)(/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/portfolio.py)
- Costs/slippage: [`/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/costs_india.py`](/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/costs_india.py)(/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/costs_india.py)(/Users/siddansh/Also Code/trademaxxer/src/trademaxxer/backtesting/costs_india.py)
- Tests: [`/Users/siddansh/Also Code/trademaxxer/tests/unit/test_backtest_engine.py`](/Users/siddansh/Also Code/trademaxxer/tests/unit/test_backtest_engine.py)(/Users/siddansh/Also Code/trademaxxer/tests/unit/test_backtest_engine.py)(/Users/siddansh/Also Code/trademaxxer/tests/unit/test_backtest_engine.py)

## Implementation Plan

- Add MTM P&L tracking to `Portfolio` (cash, realized/unrealized, equity curve) and emit audit events for equity snapshots.
- Add a minimal liquidity model and partial fill handling in `BacktestEngine` (e.g., max % of bar volume, optional participation rate).
- Refine slippage/cost model integration to apply per fill and record in audit trail.
- Add deterministic tests to validate partial fill behavior, MTM updates, and equity curve correctness.
- Update README example if needed to show backtest run with the new assumptions.

## Test Plan

- Run `pytest` to ensure new backtest tests pass.
- Add at least one unit test covering partial fills and MTM equity changes.