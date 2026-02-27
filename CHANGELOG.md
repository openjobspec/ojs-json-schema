# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc.1] - 2025-06-01

### Added
- JSON Schema (draft 2020-12) definitions for OJS v1.0.0-rc.1
- Core schemas: job, job-options, error, event, workflow, cron, manifest
- HTTP binding schemas: enqueue-request, fetch-request, ack-request, heartbeat-request, and corresponding responses
- Policy schemas: retry-policy, unique-policy
- Named exports in package.json for direct schema imports
- AJV-based validation test suite
- README with installation, usage, and schema reference

