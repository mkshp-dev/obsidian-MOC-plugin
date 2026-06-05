# Security Policy

## Reporting a Vulnerability

The MOC Plugin team takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### 🔴 For Critical Security Vulnerabilities

If you discover a **critical security vulnerability** that could:
- Expose user vault data
- Allow unauthorized file system access outside the vault
- Enable command injection or arbitrary code execution
- Compromise user systems

**DO NOT** create a public GitHub issue.

Instead, report it privately using:
- GitHub's [private security advisory feature](https://github.com/mkshp-dev/obsidian-moc-plugin/security/advisories/new)

### 🟡 For Non-Critical Security Concerns

For security improvements, best practice suggestions, or lower-severity concerns, you can:
- Open a regular GitHub issue with appropriate context

## What to Include in Your Report

Please provide as much information as possible:

- **Description** of the vulnerability
- **Steps to reproduce** the issue (without publicly sharing exploit code)
- **Potential impact** if exploited
- **Affected versions** (if known)
- **Suggested mitigation** (if you have ideas)

## Response Timeline

We aim to:
- Acknowledge receipt of your report within **48 hours**
- Provide an initial assessment within **7 days**
- Keep you informed of remediation progress
- Credit you in release notes (if desired) once the issue is resolved

## Scope

This security policy covers:
- The Obsidian MOC Plugin codebase
- Direct dependencies with known vulnerabilities

Out of scope:
- Vulnerabilities in Obsidian itself (report to Obsidian team)

## Security Best Practices for Users

To use this plugin securely:

1. **Updates**: Keep the plugin updated to receive security patches.
2. **Local Operation**: Rest assured that this plugin does not transmit data over the network (all operations are local).

## Supported Versions

We provide security updates for:
- Latest stable release

Older versions may not receive security updates. Please upgrade to the latest version.

## Security Considerations in Plugin Design

This plugin:
- Operates entirely locally.
- Reads files using Obsidian's cached read APIs.
- Does not make any external network requests.
- Minimizes scope by reading files only within your vault.

---

**Thank you for helping keep MOC Plugin and its users safe!**
