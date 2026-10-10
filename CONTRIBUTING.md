---

```markdown
<!-- ═══════════════════════════════════════════════════════════ -->
<!--              APZ WALLET — CONTRIBUTING GUIDE                -->
<!-- ═══════════════════════════════════════════════════════════ -->

<div align="center">

# 🤝 Contributing to APZ Wallet

**Thank you for considering a contribution!**

Every pull request, issue report, and suggestion helps make APZ Wallet better.

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-00ffcc.svg?style=flat-square)](http://makeapullrequest.com)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-a855f7.svg?style=flat-square)](CODE_OF_CONDUCT.md)

</div>

---

## 📖 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Ways to Contribute](#-ways-to-contribute)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Branch Naming](#-branch-naming)
- [Commit Conventions](#-commit-conventions)
- [Code Style Guide](#-code-style-guide)
- [Testing Requirements](#-testing-requirements)
- [Pull Request Process](#-pull-request-process)
- [Review Guidelines](#-review-guidelines)
- [Reporting Bugs](#-reporting-bugs)
- [Suggesting Features](#-suggesting-features)
- [Security Vulnerabilities](#-security-vulnerabilities)
- [Documentation](#-documentation)
- [Translation](#-translation)
- [Recognition](#-recognition)
- [License](#-license)
- [Questions?](#-questions)

---

## 🌟 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to **conduct@apzchain.org**.

**In short:**

- ✅ Be respectful and inclusive
- ✅ Welcome newcomers and help them learn
- ✅ Focus on constructive feedback
- ✅ Respect differing viewpoints and experiences
- ❌ No harassment, discrimination, or personal attacks
- ❌ No trolling, spam, or off-topic discussions

---

## 🎯 Ways to Contribute

There are many ways to contribute — you don't need to be a developer!

### 🐛 Bug Reports
Found something broken? [Open an issue](https://github.com/apzchain/APZ_WALLET/issues/new?template=bug_report.md) with details.

### ✨ Feature Requests
Have an idea? [Submit a feature request](https://github.com/apzchain/APZ_WALLET/issues/new?template=feature_request.md).

### 📝 Documentation
Improve README, fix typos, add examples, or translate docs.

### 🎨 Design
Contribute UI/UX improvements, icons, or design assets.

### 🌍 Translation
Help translate APZ Wallet into new languages (currently FA/EN/DE).

### 💻 Code
Fix bugs, add features, optimize performance, or refactor code.

### 🧪 Testing
Write tests, report edge cases, or test on different devices.

### 💬 Community
Help others in [Discussions](https://github.com/apzchain/APZ_WALLET/discussions) or answer questions.

### ⭐ Star & Share
Give us a star and share the project with others!

---

## 🚀 Getting Started

### 📋 Prerequisites

Before contributing code, ensure you have these tools installed:

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| **Node.js** | 20+ | JS runtime | [nvm](https://github.com/nvm-sh/nvm) |
| **JDK** | 17 | Android builds | [Adoptium](https://adoptium.net/) |
| **Android Studio** | Latest | Android SDK | [Download](https://developer.android.com/studio) |
| **Rust** | 1.75+ | Crypto engine | [rustup.rs](https://rustup.rs/) |
| **Go** | 1.22+ | Network layer | [go.dev](https://go.dev/dl/) |
| **Ruby** | 3.2+ | Fastlane | [rbenv](https://github.com/rbenv/rbenv) |
| **Git** | 2.40+ | Version control | [git-scm.com](https://git-scm.com/) |

### 🔧 Initial Setup

```bash
# 1. Fork the repository on GitHub (click the "Fork" button)

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/APZ_WALLET.git
cd APZ_WALLET

# 3. Add upstream remote
git remote add upstream https://github.com/apzchain/APZ_WALLET.git

# 4. Install Node dependencies
npm install

# 5. Install Rust dependencies
cd crypto && cargo build --release && cd ..

# 6. Install Go dependencies
cd network && go mod download && cd ..

# 7. Install Ruby dependencies (for Fastlane)
cd android && bundle install && cd ..

# 8. Verify setup
npm run test  # or individual test commands per module
```

🌿 Keep Your Fork Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Switch to main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push to your fork
git push origin main
```

---

🔄 Development Workflow

Standard Flow

```
1. Sync fork          →   git fetch upstream && git merge upstream/main
2. Create branch      →   git checkout -b feature/my-feature
3. Make changes       →   Edit files, write tests
4. Run tests          →   npm test (or per-language)
5. Lint & format      →   npm run lint && npm run format
6. Commit             →   git commit -m "feat: add my feature"
7. Push               →   git push origin feature/my-feature
8. Open PR            →   GitHub Pull Request
9. Address feedback   →   Respond to review comments
10. Merge             →   Maintainer merges
```

🏗️ Module-Specific Commands

Module Path Build Test Lint
Android android/ ./gradlew assembleDebug ./gradlew test ./gradlew lint
Web/PWA web/, docs/ python3 -m http.server Manual + Lighthouse ESLint
Core (TS) core/ npm run build npm test npm run lint
Crypto (Rust) crypto/ cargo build --release cargo test cargo clippy
Network (Go) network/ go build ./... go test ./... golangci-lint run
Explorer (Next.js) explorer-react/ npm run build npm test npm run lint

---

🌿 Branch Naming

Use descriptive branch names with prefixes:

Prefix Purpose Example
feature/ New feature feature/hardware-wallet-support
fix/ Bug fix fix/rpc-timeout-handling
docs/ Documentation docs/api-reference-update
refactor/ Refactoring refactor/crypto-engine-cleanup
perf/ Performance perf/optimize-transaction-signing
test/ Tests test/add-wallet-unit-tests
chore/ Maintenance chore/update-dependencies
ci/ CI/CD ci/add-nightly-build
i18n/ Translation i18n/add-japanese-locale
hotfix/ Urgent fix hotfix/security-patch

Rules:

· ✅ Use lowercase and hyphens (no underscores, no spaces)
· ✅ Keep it short but descriptive (max 50 chars)
· ✅ Reference issue number when applicable: fix/123-rpc-timeout
· ❌ Avoid generic names like patch-1, update, test

---

📝 Commit Conventions

We follow Conventional Commits v1.0.0.

Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types

Type Purpose Example
feat New feature feat(wallet): add biometric auth
fix Bug fix fix(rpc): handle network timeout
docs Documentation docs(readme): update install steps
style Code style (no logic change) style(android): format Kotlin files
refactor Refactoring refactor(crypto): extract signing logic
perf Performance perf(network): cache RPC responses
test Tests test(core): add transaction tests
build Build system build(gradle): upgrade to AGP 8.5
ci CI/CD ci(github): add release workflow
chore Maintenance chore(deps): bump kotlin to 1.9
revert Revert previous commit revert: feat(wallet): biometric auth

Scopes (Optional)

wallet, crypto, network, rpc, explorer, pwa, ui, i18n, android, web, docs, ci, deps

Examples

Good:

```
feat(explorer): add smart contract ABI viewer

- Parse ABI from Sourcify
- Render read/write functions
- Support ERC-20/721/1155 detection

Closes #42
```

```
fix(rpc): prevent infinite retry loop on 502

The retry logic didn't count attempts correctly when the server
returned 502. Now limits to 3 retries with exponential backoff.

Fixes #128
```

Bad:

```
❌ updated stuff
❌ fix
❌ WIP
❌ asdfasdf
❌ Fixed the thing that was broken
```

Breaking Changes

For breaking changes, add ! after type or include BREAKING CHANGE: in footer:

```
feat(api)!: change wallet initialization signature

BREAKING CHANGE: `initWallet()` now requires a `network` parameter.
Old: `initWallet(seed)`
New: `initWallet(seed, network)`

Migration guide in docs/MIGRATION.md
```

Commit Message Rules

· ✅ Use imperative mood ("add", not "added" or "adds")
· ✅ Keep subject under 72 characters
· ✅ Capitalize the subject (after type)
· ✅ No period at the end of subject
· ✅ Use body to explain what and why, not how
· ✅ Reference issues in footer (Closes #123, Fixes #456)

---

🎨 Code Style Guide

General Principles

· Readability over cleverness — code is read more than written
· Consistency — follow existing patterns in the codebase
· Simplicity — prefer simple solutions over complex ones
· Comments — explain why, not what
· Naming — descriptive names beat short names

🟣 Kotlin (Android)

Style: Kotlin Coding Conventions

```kotlin
// ✅ Good
class WalletRepository(
    private val rpcClient: RpcClient,
    private val cryptoEngine: CryptoEngine,
) {
    suspend fun getBalance(address: String): Result<BigDecimal> {
        return try {
            val hex = rpcClient.call("eth_getBalance", listOf(address, "latest"))
            Result.success(hex.toBigDecimal())
        } catch (e: RpcException) {
            Result.failure(e)
        }
    }
}

// ❌ Bad
class WalletRepo(private val r:RpcClient){
    fun getBalance(a:String):BigDecimal{
        val h=r.call("eth_getBalance",listOf(a,"latest"))
        return h.toBigDecimal()
    }
}
```

Rules:

· ✅ 4 spaces indentation
· ✅ Max line length: 120 chars
· ✅ Trailing commas in multi-line
· ✅ Use val over var when possible
· ✅ Prefer Result<T> over exceptions for recoverable errors
· ✅ Use Jetpack Compose for UI (no XML layouts)

🔵 TypeScript (Core/Web)

Style: ESLint + Prettier (config in repo)

```typescript
// ✅ Good
export interface WalletConfig {
  readonly network: Network;
  readonly rpcUrl: string;
  readonly chainId: number;
}

export async function createWallet(config: WalletConfig): Promise<Wallet> {
  const seed = await generateSeed();
  return new Wallet(seed, config);
}

// ❌ Bad
export function createWallet(c:any){
  return new Wallet(generateSeed(), c)
}
```

Rules:

· ✅ 2 spaces indentation
· ✅ Semicolons required
· ✅ Single quotes
· ✅ Trailing commas
· ✅ readonly for immutable fields
· ✅ No any — use unknown and narrow
· ✅ Prefer interface over type for objects
· ✅ Async/await over raw promises

🦀 Rust (Crypto)

Style: rustfmt + clippy (enforced in CI)

```rust
// ✅ Good
pub fn sign_transaction(
    keypair: &Keypair,
    message: &[u8],
) -> Result<Signature, CryptoError> {
    if message.is_empty() {
        return Err(CryptoError::EmptyMessage);
    }

    Ok(keypair.sign(message))
}

// ❌ Bad
pub fn sign(k:&Keypair,m:&[u8])->Signature{
    k.sign(m)
}
```

Rules:

· ✅ 4 spaces indentation (rustfmt default)
· ✅ Max line length: 100 chars
· ✅ Use Result<T, E> for fallible operations
· ✅ Avoid unwrap() and expect() in library code
· ✅ Document public items with ///
· ✅ Use #![deny(warnings)] in CI
· ✅ No unsafe code without documented justification

🐹 Go (Network)

Style: gofmt + golangci-lint

```go
// ✅ Good
type RpcClient struct {
	url    string
	client *http.Client
}

func (c *RpcClient) Call(ctx context.Context, method string, params []any) (json.RawMessage, error) {
	body, err := json.Marshal(rpcRequest{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      1,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	// ... parse response
	return nil, nil
}
```

Rules:

· ✅ Use gofmt (tabs, not spaces)
· ✅ Wrap errors with fmt.Errorf("...: %w", err)
· ✅ Accept context.Context as first parameter
· ✅ Use any instead of interface{} (Go 1.18+)
· ✅ Prefer table-driven tests
· ✅ No naked returns in functions > 5 lines

🎨 CSS / SCSS

```css
/* ✅ Good */
.wallet-card {
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: var(--transition);
}

.wallet-card:hover {
  border-color: var(--border-hover);
}

/* ❌ Bad */
.walletCard{padding:16px;background:#fff;border:1px solid #ccc}
```

Rules:

· ✅ kebab-case for classes
· ✅ CSS custom properties for theming
· ✅ BEM-like naming for complex components
· ✅ Mobile-first media queries
· ✅ No !important unless absolutely necessary

📝 Markdown

· ✅ One sentence per line (for cleaner diffs)
· ✅ Use fenced code blocks with language tags
· ✅ Reference links at bottom for long URLs
· ✅ Keep lines under 120 chars (except tables)

---

🧪 Testing Requirements

Coverage Targets

Module Minimum Coverage
Crypto (Rust) 95%
Core (TypeScript) 90%
Network (Go) 85%
Android (Kotlin) 80%
Explorer (React) 75%

Test Types

Unit Tests — Fast, isolated, no external dependencies:

```kotlin
@Test
fun `should generate valid seed phrase`() {
    val seed = wallet.generateSeed()
    assertTrue(seed.split(" ").size == 12)
}
```

Integration Tests — Test module boundaries:

```rust
#[test]
fn test_sign_and_verify_roundtrip() {
    let keypair = Keypair::generate();
    let message = b"hello world";
    let sig = sign_transaction(&keypair, message).unwrap();
    assert!(verify(&keypair.public, message, &sig));
}
```

UI Tests — Android instrumented tests:

```kotlin
@Test
fun walletScreen_displaysBalance() {
    composeTestRule.setContent { WalletScreen() }
    composeTestRule.onNodeWithText("Balance").assertIsDisplayed()
}
```

Running Tests

```bash
# All tests
npm run test:all

# Per module
cd crypto && cargo test --release
cd core && npm test
cd network && go test -race ./...
cd android && ./gradlew testDebugUnitTest
cd explorer-react && npm test

# Watch mode (where available)
npm test -- --watch
```

Test Requirements for PRs

· ✅ New features must include tests
· ✅ Bug fixes must include regression tests
· ✅ Refactors must not decrease coverage
· ✅ All tests pass before merging

---

🔀 Pull Request Process

Before Opening a PR

Use this checklist:

☐ I've read the CONTRIBUTING.md guide
☐ My code follows the project's code style
☐ I've added tests for new functionality
☐ All tests pass locally (npm run test:all)
☐ I've run linters (npm run lint)
☐ I've updated documentation if needed
☐ I've updated CHANGELOG.md (if maintained)
☐ My commits follow Conventional Commits
☐ I've rebased on the latest main branch
☐ My branch name follows the naming convention

PR Title Format

Same as commit convention:

```
feat(explorer): add contract source viewer
fix(rpc): handle WebSocket reconnection
docs(readme): update installation steps
```

PR Description Template

When you open a PR, fill out this template:

```markdown
## 📝 Description

Brief description of what this PR does.

## 🎯 Motivation

Why is this change needed? What problem does it solve?

Closes #123

## 🔧 Changes

- Added X feature
- Fixed Y bug
- Refactored Z module

## 📸 Screenshots (if UI changes)

| Before | After |
|--------|-------|
| ![before](url) | ![after](url) |

## 🧪 Testing

How has this been tested?

- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing on Android 13
- [ ] Tested on iOS Safari

## ✅ Checklist

- [ ] Code follows style guide
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Commits follow conventions

## 📝 Additional Notes

Any additional context.
```

PR Size Guidelines

Size Lines Changed Review Time
🟢 Small < 200 Fast review
🟡 Medium 200–500 Standard review
🔴 Large 500 Split recommended

Prefer small, focused PRs. One feature per PR.

Review Timeline

· 📅 Initial response: within 3 business days
· 📅 Full review: within 7 business days
· 📅 Merge: after approval + CI passes

If you don't hear back, feel free to ping maintainers in the PR.

---

👀 Review Guidelines

For Reviewers

· ✅ Be kind and constructive — assume good intentions
· ✅ Explain the "why" when requesting changes
· ✅ Approve when ready — don't nitpick forever
· ✅ Test locally for complex changes
· ✅ Check for security implications
· ❌ Don't block on style preferences already covered by linters
· ❌ Don't request unrelated changes in the same PR

For Authors

· ✅ Respond to every comment — even if just "done"
· ✅ Ask for clarification if a comment is unclear
· ✅ Push fixes as new commits (don't force-push during review)
· ✅ Mark conversations as resolved after addressing
· ❌ Don't take feedback personally — it's about the code

Review Labels

Label Meaning
status: needs review Ready for reviewer
status: in review Being reviewed
status: changes requested Author needs to address feedback
status: approved Ready to merge
status: blocked Waiting on something else

---

🐛 Reporting Bugs

Before Reporting

1. Search existing issues — maybe it's already reported
2. Check the docs — maybe it's expected behavior
3. Try the latest version — maybe it's already fixed
4. Reproduce on a clean install — isolate the issue

Bug Report Template

```markdown
## 🐛 Bug Description

Clear and concise description of the bug.

## 🔄 Steps to Reproduce

1. Open APZ Wallet
2. Navigate to 'Explorer'
3. Search for '0x123...'
4. See error

## 🎯 Expected Behavior

What you expected to happen.

## 📸 Screenshots

If applicable, add screenshots.

## 🌐 Environment

- **Platform:** Android 13 / iOS 16 / Web (Chrome 120)
- **Device:** Samsung Galaxy S21
- **APZ Wallet Version:** 1.0.0
- **Network:** Mainnet / Testnet

## 📝 Additional Context

Any other context about the problem.

## 🔍 Possible Solution

If you have an idea how to fix it.

## 📋 Logs

```

Paste relevant logs here

```
```

---

✨ Suggesting Features

Feature Request Template

```markdown
## ✨ Feature Description

Clear and concise description of the feature.

## 🎯 Problem It Solves

What problem does this feature solve?

## 💡 Proposed Solution

How would you like it to work?

## 🔄 Alternatives Considered

Any alternative solutions?

## 📸 Mockups / Examples

If applicable, add mockups or examples from other apps.

## 🎁 Additional Context

Any other context or screenshots.
```

Feature Request Guidelines

· ✅ Explain the "why" — what problem does it solve?
· ✅ Provide use cases — who benefits and how?
· ✅ Suggest implementation if you have ideas
· ✅ Reference similar features in other wallets
· ❌ Don't demand immediate implementation
· ❌ Don't open multiple issues for the same feature

---

🔐 Security Vulnerabilities

⚠️ DO NOT create public issues for security vulnerabilities!

How to Report

Email: security@apzchain.org

PGP Key: Download

What to Include

· 🔍 Description of the vulnerability
· 🔄 Steps to reproduce
· 💥 Potential impact
· 🛠️ Suggested fix (if any)
· 📛 Your name/handle for credit (optional)

Our Commitment

· ⏱️ Response within 48 hours
· 🔧 Fix within 30 days (critical issues: 7 days)
· 📢 Coordinated disclosure after fix is released
· 🏆 Credit in SECURITY.md (if desired)

Scope

In scope:

· Cryptography implementation
· Key management
· Transaction signing
· RPC communication
· Authentication / authorization

Out of scope:

· Social engineering
· Physical device access
· Third-party dependencies (report to upstream)

---

📚 Documentation

What to Document

· ✅ Public APIs — every exported function/class
· ✅ Complex logic — non-obvious algorithms
· ✅ Configuration — env vars, build flags
· ✅ Architecture — design decisions in docs/
· ✅ User-facing — features, tutorials

Documentation Style

Code comments:

```typescript
/**
 * Signs a transaction with the given keypair.
 *
 * @param tx - The transaction to sign
 * @param keypair - The keypair to sign with
 * @returns The signed transaction
 * @throws {CryptoError} If signing fails
 *
 * @example
 * ```ts
 * const signed = await signTransaction(tx, keypair);
```

*/
export async function signTransaction(tx: Transaction, keypair: Keypair): Promise<SignedTransaction> {
// ...
}

```

**Markdown docs:**
- Use clear headings
- Include examples
- Link to related docs
- Update TOC when adding sections

---

## 🌍 Translation

We currently support **Persian (FA)**, **English (EN)**, and **German (DE)**.

### Adding a New Language

1. Copy the reference file:
   ```bash
   cp docs/assets/js/i18n.js docs/assets/js/i18n.new.js
```

2. Add a new locale block in i18n.js:
   ```javascript
   const I18N = {
     en: { /* ... */ },
     fa: { /* ... */ },
     de: { /* ... */ },
     ja: {  // ← New language
       dir: 'ltr',
       brand: { sub: 'リリースダッシュボード' },
       // ...
     }
   };
   ```
3. Update the language switcher in HTML:
   ```html
   <button class="lang-btn" data-lang="ja">日本語</button>
   ```
4. Update manifest.webmanifest if applicable.
5. Test RTL/LTR rendering.
6. Submit a PR with title: i18n: add Japanese locale

Translation Guidelines

· ✅ Native speakers preferred — nuance matters
· ✅ Keep technical terms in English (e.g., "RPC", "wallet")
· ✅ Match the tone of the original (friendly, clear)
· ✅ Test in context — not just translation files
· ❌ Don't use machine translation without review

---

🏆 Recognition

Contributors Wall

All contributors are listed on the Contributors page and in our README.

Special Recognition

· 🥇 Core contributors — Long-term impact
· 🐛 Bug hunters — Critical fixes
· 📚 Doc champions — Documentation improvements
· 🌍 Translators — Language expansion
· 🎨 Designers — UI/UX improvements
· 💰 Sponsors — Financial support

All Contributors Bot

We use all-contributors to recognize every type of contribution. Comment on any PR or issue:

```
@all-contributors please add @username for code, doc, translation
```

---

📄 License

By contributing to APZ Wallet, you agree that your contributions will be licensed under the MIT License.

See LICENSE for full details.

Developer Certificate of Origin (DCO)

By submitting a pull request, you certify that:

· ✅ The contribution was created by you, or
· ✅ You have the right to submit it under the project license, or
· ✅ The contribution was provided to you under an open-source license that permits submission

You don't need to sign anything — the act of submitting a PR constitutes your agreement.

---

❓ Questions?

If you have questions, here are your options:

Question Type Best Place
🐛 Bug report GitHub Issues
✨ Feature idea GitHub Discussions
💬 General chat Discord
📧 Private matter hello@apzchain.org
🔐 Security issue security@apzchain.org
📱 Social Twitter / Telegram

---

🙏 Thank You!

<div align="center">

Every contribution matters — no matter how small.

Whether you're fixing a typo, reporting a bug, or adding a major feature,
you make APZ Wallet better for everyone.

Happy contributing! 🚀

---

Built with ❤️ by Khalil Heyrani and contributors worldwide.

For APZ Chain — A transparent, secure, and independent ecosystem.

</div>
```

---

📥 نحوه استفاده

۱. ذخیره فایل

```bash
cd /path/to/APZ_WALLET
nano CONTRIBUTING.md
# محتوای بالا را کپی کنید و ذخیره کنید
```

۲. جایگزینی Placeholderها

این مقادیر را با اطلاعات واقعی جایگزین کنید:

Placeholder جایگزین با
apzchain نام کاربری/سازمان GitHub شما
APZ_WALLET نام واقعی مخزن
conduct@apzchain.org ایمیل Code of Conduct
security@apzchain.org ایمیل امنیتی
hello@apzchain.org ایمیل عمومی
https://discord.gg/apzchain لینک Discord
https://t.me/apzchain کانال Telegram
https://twitter.com/apzchain اکانت Twitter

۳. ساخت فایل‌های مرتبط

فایل CONTRIBUTING.md به این فایل‌ها ارجاع می‌دهد — آن‌ها را هم بسازید:

```bash
# Code of Conduct
touch CODE_OF_CONDUCT.md

# Issue templates
mkdir -p .github/ISSUE_TEMPLATE
touch .github/ISSUE_TEMPLATE/bug_report.md
touch .github/ISSUE_TEMPLATE/feature_request.md

# PR template
touch .github/PULL_REQUEST_TEMPLATE.md
```

۴. اتصال به README

در README.md، این خط را اضافه کنید:

```markdown
## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before opening a PR.
```

۵. فعال‌سازی در GitHub

GitHub به‌طور خودکار فایل CONTRIBUTING.md را در ریشه‌ی مخزن شناسایی می‌کند و:

· ✅ لینک "Contributing" را در کنار دکمه‌ی "New Issue" نمایش می‌دهد
· ✅ در هنگام باز کردن PR، لینک به آن را پیشنهاد می‌دهد
· ✅ در Community Profile مخزن امتیاز می‌گیرد

۶. کامیت و Push

```bash
git add CONTRIBUTING.md README.md
git commit -m "docs: add comprehensive contributing guide"
git push origin main
```

---

🎁 ویژگی‌های این CONTRIBUTING.md

ویژگی توضیح
✅ TOC خودکار فهرست مطالب با anchor links
✅ ۱۰ روش مشارکت برای غیر-توسعه‌دهندگان هم
✅ جدول Prerequisites با لینک دانلود
✅ دستورات per-module برای هر بخش پروژه
✅ Branch Naming ۱۰ prefix با مثال
✅ Conventional Commits با ۱۱ type و مثال‌های خوب/بد
✅ Code Style per Language Kotlin, TS, Rust, Go, CSS
✅ Coverage Targets اهداف پوشش تست
✅ PR Template کامل آماده استفاده
✅ Review Guidelines هم برای reviewer هم author
✅ Issue Templates Bug + Feature
✅ Security Section با PGP
✅ Translation Guide برای افزودن زبان جدید
✅ Recognition با all-contributors
✅ DCO رضایت ضمنی

---

🔧 سفارشی‌سازی پیشرفته (اختیاری)

افزودن فایل .github/PULL_REQUEST_TEMPLATE.md

```markdown
<!--
  Thanks for submitting a PR! Please fill out this template.
  See CONTRIBUTING.md for detailed guidelines.
-->

## 📝 Description

<!-- Brief description -->

## 🎯 Motivation

<!-- Why is this needed? -->

Closes #

## 🔧 Type of Change

- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📚 Documentation
- [ ] 🎨 Style / refactor
- [ ] ⚡ Performance
- [ ] 🧪 Tests

## ✅ Checklist

- [ ] Code follows style guide
- [ ] Tests added/passing
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Commits follow conventions
```

افزودن .github/ISSUE_TEMPLATE/bug_report.md

```markdown
---
name: 🐛 Bug Report
about: Report a bug to help us improve
title: '[BUG] '
labels: ['bug', 'needs triage']
assignees: ''
---

## 🐛 Bug Description
<!-- Clear description -->

## 🔄 Steps to Reproduce
1.
2.
3.

## 🎯 Expected Behavior
<!-- What should happen -->

## 📸 Screenshots
<!-- If applicable -->

## 🌐 Environment
- Platform:
- Device:
- Version:
- Network:

## 📋 Logs
```

```

### فعال‌سازی DCO Bot

برای اجبار امضای هر commit، [DCO GitHub App](https://github.com/apps/dco) را نصب کنید.

---
