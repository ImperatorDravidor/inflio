# Inflio Maintenance Guide

**Created**: December 3, 2024
**Last Updated**: December 3, 2024
**Status**: Post-Cleanup Baseline

---

## Purpose

This guide helps maintain the clean, professional codebase established during the December 2024 cleanup project. Follow these guidelines to prevent technical debt from accumulating again.

---

## 📁 Codebase Structure (Baseline)

### Source Code (`src/`)
```
src/
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # Protected dashboard routes
│   └── api/                # API endpoints (101 routes)
├── components/             # React components (153 files)
│   ├── onboarding/         # 4 essential files
│   ├── social/             # 11 files
│   ├── staging/            # 8 files
│   ├── ui/                 # 48 shared components
│   └── ...                 # 85 total components
├── lib/                    # Core business logic
│   ├── services/          # 11 service files
│   ├── social/            # 3 social services
│   ├── staging/           # 2 staging services
│   └── ...                # 19 total services
└── hooks/                 # React hooks

Total: 399 TypeScript files, 119,217 lines of code
```

### Scripts & Utilities
```
scripts/
├── deploy-*.sh|ps1        # Deployment scripts
├── setup-*.js             # Setup utilities
├── test-*.js              # Testing utilities
└── production-check.sh    # Validation script

Total: 10 operational scripts (all with clear purposes)
```

### Documentation
```
docs/
├── specs/                 # Technical specifications
├── setup/                 # Integration guides
├── features/              # Feature documentation
└── history/               # Implementation notes

Root:
├── README.md              # Main documentation
├── CLAUDE.md              # Claude Code instructions
├── START_HERE.md          # Quick start
├── CLEANUP_STATUS.md      # Cleanup progress
└── CLEANUP_COMPLETE.md    # Cleanup summary

Total: 45 markdown files (professionally organized)
```

---

## 🔍 Regular Maintenance Tasks

### Weekly

1. **Dead Code Check** (15 minutes)
   ```bash
   # Check for unused imports
   npm run lint

   # Look for TODO comments (should be minimal)
   grep -r "TODO\|FIXME" src --include="*.tsx" --include="*.ts" | wc -l
   ```

2. **Build Health** (5 minutes)
   ```bash
   # Verify clean build
   npm run build

   # Should compile without errors
   # Warnings should be documented
   ```

### Monthly

1. **Dependency Audit** (30 minutes)
   ```bash
   # Check for outdated packages
   npm outdated

   # Security audit
   npm audit

   # Update dependencies systematically
   npm update --save
   ```

2. **File Organization Review** (20 minutes)
   - Check for new "test" or "temp" files in root
   - Verify no archived directories created
   - Ensure new scripts have clear purposes

3. **Documentation Updates** (15 minutes)
   - Update CLAUDE.md if architecture changes
   - Review README for accuracy
   - Check setup guides are current

### Quarterly

1. **Comprehensive Cleanup Review** (2 hours)
   - Run through abbreviated cleanup checklist
   - Look for duplicate implementations
   - Check for unused API routes
   - Review service layer organization

2. **Performance Review**
   - Analyze build times (baseline: 27s)
   - Check bundle sizes
   - Review First Load JS metrics

---

## 🚨 Red Flags to Watch For

### Immediate Action Required

1. **Build Errors**
   - Never ignore TypeScript errors
   - Fix immediately before adding features
   - Don't use `@ts-ignore` without documentation

2. **Multiple Implementations**
   - If you see "Alternative", "V2", or "New" in filenames
   - Stop and consolidate before proceeding
   - One implementation per feature

3. **Archived Directories**
   - Don't create `archived/`, `old/`, or `backup/` directories
   - Use git for history
   - Delete or use alternatives immediately

### Elevated Concern

1. **Growing Root Directory**
   - Root should have ~7-10 files max
   - Move new docs to proper `docs/` subdirectories
   - No loose test files

2. **Utility Script Accumulation**
   - Scripts should serve ongoing purposes
   - One-off scripts in temp directory
   - Document script purposes in headers

3. **Dead API Routes**
   - Periodically grep for route usage
   - Remove unused routes promptly
   - Don't keep "just in case"

### Monitor Trends

1. **Component Count Growth**
   - Baseline: 153 components
   - If >200: Review for duplicates
   - If >250: Plan consolidation

2. **Service File Proliferation**
   - Baseline: 19 services
   - If >30: Look for duplicates
   - Consider consolidation patterns

3. **Lines of Code**
   - Baseline: 119,217 lines
   - 10%+ growth: Normal with features
   - 25%+ growth: Review for efficiency

---

## ✅ Best Practices

### Before Adding New Code

1. **Check for Existing**
   ```bash
   # Search for similar functionality
   grep -r "searchTerm" src --include="*.tsx" --include="*.ts"

   # Check if component exists
   find src/components -name "*keyword*"
   ```

2. **Follow Patterns**
   - Match existing naming conventions
   - Use established architectural patterns
   - Check CLAUDE.md for guidance

3. **Plan Organization**
   - Decide proper directory before creating
   - Use feature-based organization
   - Don't create temporary locations

### Before Deleting Code

1. **Verify Unused**
   ```bash
   # Check for imports
   grep -r "filename" src --include="*.tsx" --include="*.ts"

   # Check git history
   git log --all -- path/to/file

   # Verify not dynamically imported
   grep -r "import.*filename" src
   ```

2. **Document Reasoning**
   - Comment in commit why file was removed
   - Reference grep verification
   - Note what replaced it (if anything)

3. **Test After Deletion**
   ```bash
   # Always build after deleting
   npm run build

   # Run tests if available
   npm test
   ```

### When Adding Scripts

1. **Clear Purpose**
   - Add comment header explaining purpose
   - Is it one-off or ongoing?
   - Document in README if ongoing

2. **Proper Location**
   - Ongoing tools: `scripts/`
   - One-off utilities: `temp/` (then delete)
   - User-facing: Consider npm scripts

3. **Documentation**
   - Add to package.json if user-facing
   - Document in setup guides if needed
   - Include usage examples in header

---

## 🎯 Quality Gates

### Before Committing

- [ ] Build passes without errors
- [ ] No new TypeScript errors introduced
- [ ] Linting passes (or warnings documented)
- [ ] New files in proper directories
- [ ] Documentation updated if needed
- [ ] Commit message is descriptive

### Before Merging to Main

- [ ] All tests pass
- [ ] Build size acceptable
- [ ] No duplicate implementations
- [ ] Code reviewed (if team workflow)
- [ ] Documentation complete
- [ ] No temporary files included

### Before Deploying

- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] No debug routes exposed
- [ ] Error tracking configured
- [ ] Performance acceptable

---

## 📋 Cleanup Checklist (Quarterly)

Use this abbreviated checklist every quarter to maintain code quality:

### 1. Component Review (30 min)
- [ ] Check for duplicate components
- [ ] Verify all components are used
- [ ] Look for archived directories
- [ ] Review component organization

### 2. Service Layer (20 min)
- [ ] Check for duplicate services
- [ ] Verify service purposes are clear
- [ ] Review service organization
- [ ] Check for unused utilities

### 3. API Routes (20 min)
- [ ] Verify all routes are called
- [ ] Check debug route protection
- [ ] Review route organization
- [ ] Document any test-only routes

### 4. Documentation (15 min)
- [ ] Update README if needed
- [ ] Review CLAUDE.md accuracy
- [ ] Check setup guides
- [ ] Verify all docs are organized

### 5. Root Directory (10 min)
- [ ] Count files (should be ~7-10)
- [ ] Check for loose test files
- [ ] Verify no temp directories
- [ ] Review scripts directory

### 6. Dependencies (15 min)
- [ ] Run `npm outdated`
- [ ] Run `npm audit`
- [ ] Update dependencies
- [ ] Test after updates

---

## 🛠️ Useful Commands

### Code Analysis
```bash
# Count TypeScript files
find src -name "*.tsx" -o -name "*.ts" | wc -l

# Count lines of code
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1

# Find large files (>1000 lines)
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20

# Search for unused imports (requires eslint)
npm run lint | grep "is defined but never used"
```

### File Organization
```bash
# List root directory items
ls -la | wc -l

# Find temp/test files
find . -name "test-*" -o -name "temp-*" -o -name "*.temp.*"

# Check for archived directories
find src -type d -name "*archive*" -o -name "*old*" -o -name "*backup*"
```

### Cleanup Verification
```bash
# Check for TODO comments
grep -r "TODO\|FIXME\|HACK" src --include="*.tsx" --include="*.ts" | wc -l

# Find files not changed in 6 months
find src -name "*.tsx" -o -name "*.ts" | xargs ls -lt | tail -20

# Check for duplicate file names
find src -name "*.tsx" -o -name "*.ts" | sed 's/.*\///' | sort | uniq -d
```

---

## 📞 When to Do a Cleanup

### Immediate Cleanup Needed
- Multiple implementations of same feature
- Build breaking from dead code
- Root directory >15 files
- Can't find "real" implementation

### Plan Cleanup Soon
- Components >200 files
- Services >30 files
- Build time >60 seconds
- Confusion about file purposes

### Schedule Quarterly Review
- Normal operations
- Gradual growth
- Maintain current quality
- Preventive maintenance

---

## 🎓 Learning from the 2024 Cleanup

### What Led to Problems

1. **Experimentation Without Cleanup**
   - Multiple alternative implementations created
   - Old versions not deleted after migration
   - "Just in case" keeping unused code

2. **Temporary Files Becoming Permanent**
   - Test scripts left in root
   - Triage directory never removed
   - Archived code never deleted

3. **Documentation Drift**
   - Files created without documentation
   - Purposes not clear from names
   - No organization strategy

### How to Prevent Recurrence

1. **Delete Old When Creating New**
   - When migrating: delete old version
   - When testing: use temp directory, then delete
   - When refactoring: remove old implementation

2. **Document As You Go**
   - Add purpose to file headers
   - Update CLAUDE.md for architecture changes
   - Keep README current

3. **Regular Reviews**
   - Weekly: Quick health check
   - Monthly: Organization review
   - Quarterly: Comprehensive cleanup

---

## 📚 Reference Documents

- **CLEANUP_COMPLETE.md** - What was done in 2024 cleanup
- **CLAUDE.md** - Current architecture and patterns
- **README.md** - Project overview
- **START_HERE.md** - Quick start guide

---

## 🤝 Contributing

When contributing code:

1. **Follow established patterns** (see CLAUDE.md)
2. **Organize properly** (see this guide)
3. **Document your changes** (update docs/)
4. **Clean up after yourself** (delete temp files)
5. **Test your changes** (`npm run build`)

---

**Remember**: "Leave the codebase better than you found it."

*This is a living document. Update it as patterns evolve.*
