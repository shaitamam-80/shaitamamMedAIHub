# MedAI Hub - User Management & Subscription System Plan

**תאריך:** 2025-12-01
**סטטוס:** Draft - לבחינה
**גרסה:** 1.0

---

## 📋 תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [מודל המשתמשים](#מודל-המשתמשים)
3. [תכונות לפי Tier](#תכונות-לפי-tier)
4. [Admin Dashboard](#admin-dashboard)
5. [מבנה Database](#מבנה-database)
6. [אינטגרציית תשלומים](#אינטגרציית-תשלומים)
7. [שלבי פיתוח](#שלבי-פיתוח)
8. [אומדן זמנים](#אומדן-זמנים)
9. [החלטות נדרשות](#החלטות-נדרשות)

---

## 🎯 סקירה כללית

### המטרה
בניית מערכת ניהול משתמשים מלאה עם:
- רמות הרשאה שונות (Tiers)
- Trial period למשתמשים חדשים
- מנויים בתשלום
- Admin Dashboard לניהול ואנליטיקס

### עקרונות מנחים
1. **פשטות** - להתחיל מינימלי ולהרחיב
2. **אבטחה** - RLS policies בכל הטבלאות
3. **גמישות** - קל להוסיף tiers ותכונות
4. **שקיפות** - לוגים מלאים לכל פעולה

---

## 👥 מודל המשתמשים

### Tier Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER HIERARCHY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐                                               │
│   │ SUPER_ADMIN │  ← אתה (shaitamam)                            │
│   │   (1 user)  │    גישה מלאה + ניהול מערכת                    │
│   └──────┬──────┘                                               │
│          │                                                       │
│   ┌──────▼──────┐                                               │
│   │    ADMIN    │  ← מנהלים נוספים (אופציונלי)                  │
│   │  (Optional) │    ניהול משתמשים + צפייה בנתונים              │
│   └──────┬──────┘                                               │
│          │                                                       │
│   ┌──────▼──────┐                                               │
│   │     PRO     │  ← משתמשים משלמים                             │
│   │   (Paying)  │    כל הכלים + ללא הגבלות                      │
│   └──────┬──────┘                                               │
│          │                                                       │
│   ┌──────▼──────┐                                               │
│   │    FREE     │  ← משתמשים בתקופת ניסיון                      │
│   │   (Trial)   │    גישה מוגבלת + זמן קצוב                     │
│   └─────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Role Definitions

| Role | תיאור | מספר משתמשים |
|------|-------|--------------|
| `super_admin` | בעל המערכת, גישה מלאה לכל | 1 (אתה) |
| `admin` | מנהל, יכול לנהל משתמשים וצפייה בנתונים | 0-5 |
| `pro` | משתמש משלם, כל הכלים | ללא הגבלה |
| `free` | משתמש חינמי/Trial | ללא הגבלה |

### Subscription Status

| Status | משמעות |
|--------|--------|
| `trial` | בתקופת ניסיון (ספירה לאחור) |
| `active` | מנוי פעיל בתשלום |
| `expired` | Trial נגמר, לא שילם |
| `cancelled` | ביטל מנוי (גישה עד סוף התקופה) |
| `paused` | השהה מנוי זמנית |

---

## ⚡ תכונות לפי Tier

### Feature Matrix

| תכונה | FREE (Trial) | PRO | ADMIN | SUPER_ADMIN |
|-------|--------------|-----|-------|-------------|
| **Define Tool** | ✅ | ✅ | ✅ | ✅ |
| **Query Tool** | ✅ | ✅ | ✅ | ✅ |
| **Review Tool** | ✅ | ✅ | ✅ | ✅ |
| **מקסימום פרויקטים** | 2 | ללא הגבלה | ללא הגבלה | ללא הגבלה |
| **Abstracts לחודש** | 100 | ללא הגבלה | ללא הגבלה | ללא הגבלה |
| **Query generations לחודש** | 10 | ללא הגבלה | ללא הגבלה | ללא הגבלה |
| **Export to MEDLINE/CSV** | ❌ | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ✅ | ✅ | ✅ |
| **Priority Support** | ❌ | ✅ | ✅ | ✅ |
| **ניהול משתמשים** | ❌ | ❌ | ✅ | ✅ |
| **צפייה באנליטיקס** | ❌ | ❌ | ✅ | ✅ |
| **שינוי הגדרות מערכת** | ❌ | ❌ | ❌ | ✅ |
| **גישה ללוגים** | ❌ | ❌ | ❌ | ✅ |
| **מחיקת משתמשים** | ❌ | ❌ | ❌ | ✅ |

### Trial Period

- **משך:** 14 ימים (מומלץ - ניתן לשינוי)
- **התחלה:** מרגע הרישום הראשון
- **התראות:**
  - יום 7: "נשארו לך 7 ימים"
  - יום 12: "נשארו לך יומיים"
  - יום 14: "Trial הסתיים"
- **לאחר סיום:** גישה לצפייה בפרויקטים קיימים, ללא יצירה חדשה

---

## 🖥️ Admin Dashboard

### מבנה הדפים

```
/admin
├── /dashboard          ← סקירה כללית + מדדים
├── /users              ← רשימת משתמשים + חיפוש
│   └── /users/[id]     ← פרטי משתמש ספציפי
├── /analytics          ← גרפים ודוחות
├── /subscriptions      ← ניהול מנויים
├── /settings           ← הגדרות מערכת (SUPER_ADMIN)
└── /logs               ← לוגים (SUPER_ADMIN)
```

### Dashboard - מסך ראשי

```
┌─────────────────────────────────────────────────────────────────┐
│  MedAI Hub Admin Dashboard                         [שם המשתמש] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   127    │  │    45    │  │    82    │  │   $1,240 │        │
│  │  Users   │  │  Active  │  │   Trial  │  │   MRR    │        │
│  │  Total   │  │  Today   │  │  Users   │  │  Revenue │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              New Signups (Last 30 Days)                 │   │
│  │  ████████████████████████████████                       │   │
│  │  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Recent Activity                      Trial Expiring Soon       │
│  ┌─────────────────────────┐         ┌─────────────────────┐   │
│  │ • user@email - Login    │         │ • john@... - 2 days │   │
│  │ • user2 - New Project   │         │ • sara@... - 3 days │   │
│  │ • user3 - Query Gen     │         │ • mike@... - 5 days │   │
│  └─────────────────────────┘         └─────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Users - ניהול משתמשים

```
┌─────────────────────────────────────────────────────────────────┐
│  Users Management                    [Search...] [+ Add User]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filter: [All ▼] [Trial ▼] [Pro ▼] [Expired ▼]                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Email              │ Role │ Status  │ Joined    │ Actions│   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ john@example.com   │ pro  │ active  │ 2024-01-15│ [Edit] │   │
│  │ sara@test.com      │ free │ trial   │ 2024-11-28│ [Edit] │   │
│  │ mike@demo.com      │ free │ expired │ 2024-10-01│ [Edit] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Showing 1-10 of 127                    [< Prev] [Next >]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### פעולות Admin

| פעולה | ADMIN | SUPER_ADMIN |
|-------|-------|-------------|
| צפייה ברשימת משתמשים | ✅ | ✅ |
| צפייה בפרטי משתמש | ✅ | ✅ |
| שינוי Role של משתמש | ❌ | ✅ |
| הארכת Trial | ✅ | ✅ |
| ביטול מנוי | ❌ | ✅ |
| מחיקת משתמש | ❌ | ✅ |
| צפייה בלוגים | ❌ | ✅ |
| שינוי הגדרות מערכת | ❌ | ✅ |

---

## 🗄️ מבנה Database

### טבלאות חדשות

```sql
-- =============================================
-- 1. USER PROFILES - Extended user data
-- =============================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Role & Permissions
    role VARCHAR(20) NOT NULL DEFAULT 'free'
        CHECK (role IN ('super_admin', 'admin', 'pro', 'free')),

    -- Subscription
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial'
        CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled', 'paused')),
    trial_started_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_started_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,

    -- Stripe Integration
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),

    -- Profile
    display_name VARCHAR(100),
    avatar_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,

    -- Settings
    email_notifications BOOLEAN DEFAULT TRUE,
    language VARCHAR(5) DEFAULT 'he'
);

-- =============================================
-- 2. TIER FEATURES - Configurable limits per tier
-- =============================================
CREATE TABLE tier_features (
    tier VARCHAR(20) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,

    -- Limits (NULL = unlimited)
    max_projects INT,
    max_abstracts_per_month INT,
    max_queries_per_month INT,
    max_file_size_mb INT,

    -- Features
    can_export BOOLEAN DEFAULT FALSE,
    can_use_api BOOLEAN DEFAULT FALSE,
    can_access_history BOOLEAN DEFAULT TRUE,
    priority_support BOOLEAN DEFAULT FALSE,

    -- Pricing (for display)
    price_monthly_usd DECIMAL(10,2),
    price_yearly_usd DECIMAL(10,2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default tier configuration
INSERT INTO tier_features VALUES
('free', 'Free Trial', 2, 100, 10, 5, FALSE, FALSE, TRUE, FALSE, 0, 0, NOW()),
('pro', 'Professional', NULL, NULL, NULL, 50, TRUE, TRUE, TRUE, TRUE, 19.99, 199.99, NOW()),
('admin', 'Admin', NULL, NULL, NULL, 100, TRUE, TRUE, TRUE, TRUE, NULL, NULL, NOW()),
('super_admin', 'Super Admin', NULL, NULL, NULL, NULL, TRUE, TRUE, TRUE, TRUE, NULL, NULL, NOW());

-- =============================================
-- 3. USAGE TRACKING - Monitor user activity
-- =============================================
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Action details
    action VARCHAR(50) NOT NULL,  -- 'project_created', 'query_generated', 'abstract_screened', etc.
    resource_type VARCHAR(50),    -- 'project', 'query', 'abstract', etc.
    resource_id UUID,

    -- Metadata
    details JSONB,
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_usage_logs_user_date ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_logs_action ON usage_logs(action, created_at DESC);

-- =============================================
-- 4. ADMIN AUDIT LOG - Track admin actions
-- =============================================
CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),

    -- Action
    action VARCHAR(100) NOT NULL,  -- 'user_role_changed', 'user_deleted', 'trial_extended', etc.
    target_user_id UUID REFERENCES auth.users(id),

    -- Before/After for changes
    previous_value JSONB,
    new_value JSONB,

    -- Metadata
    reason TEXT,
    ip_address INET,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX idx_audit_log_target ON admin_audit_log(target_user_id, created_at DESC);

-- =============================================
-- 5. MONTHLY USAGE SUMMARY - For billing/limits
-- =============================================
CREATE TABLE monthly_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL,  -- First day of month (2024-01-01)

    -- Counters
    projects_created INT DEFAULT 0,
    queries_generated INT DEFAULT 0,
    abstracts_screened INT DEFAULT 0,
    exports_count INT DEFAULT 0,

    -- Storage
    storage_used_mb DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, month)
);

CREATE INDEX idx_monthly_usage_user ON monthly_usage(user_id, month DESC);
```

### RLS Policies

```sql
-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can read their own, admins can read all
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admin can update any profile" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Usage Logs: Users see own, admins see all
CREATE POLICY "Users can view own usage" ON usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage" ON usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Audit Log: Only super_admin
CREATE POLICY "Super admin can view audit log" ON admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );
```

### Triggers

```sql
-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create user_profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, role, subscription_status)
    VALUES (NEW.id, 'free', 'trial');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update last_login_at
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles
    SET last_login_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 💳 אינטגרציית תשלומים

### Stripe Integration (מומלץ)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User clicks "Upgrade"                                          │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │ Stripe Checkout │  ← Hosted payment page                     │
│  │    Session      │    (PCI compliant)                         │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Stripe Webhook  │  ← checkout.session.completed              │
│  │   to Backend    │    invoice.paid, subscription.updated      │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Update DB       │  ← subscription_status = 'active'          │
│  │ user_profiles   │    stripe_subscription_id = '...'          │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Webhook Events to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | User completed payment → activate subscription |
| `invoice.paid` | Recurring payment successful → extend subscription |
| `invoice.payment_failed` | Payment failed → send notification, grace period |
| `customer.subscription.updated` | Plan changed → update tier |
| `customer.subscription.deleted` | Cancelled → update status |

### Pricing Structure (הצעה)

| Plan | Monthly | Yearly | Savings |
|------|---------|--------|---------|
| Pro | $19.99 | $199.99 | ~17% |

*ניתן להתאים לשוק הישראלי (₪)*

---

## 📅 שלבי פיתוח

### Phase 1: Foundation (שבוע 1-2)
**מטרה:** תשתית בסיסית

- [ ] יצירת טבלאות Database
- [ ] RLS Policies
- [ ] Triggers לאוטומציה
- [ ] הגדרת Super Admin (אתה)
- [ ] Backend API ל-user profiles
- [ ] Middleware לבדיקת הרשאות

**Deliverables:**
- טבלאות פעילות ב-Supabase
- API endpoint: `GET /api/v1/me` (פרטי משתמש + tier)
- Middleware: `check_permission(required_role)`

---

### Phase 2: Usage Limits (שבוע 2-3)
**מטרה:** אכיפת הגבלות

- [ ] Usage tracking service
- [ ] בדיקת limits לפני כל פעולה
- [ ] Monthly usage reset (cron job)
- [ ] הודעות "הגעת למגבלה"

**Deliverables:**
- Usage logged לכל פעולה
- הגבלות עובדות ל-FREE tier
- UI הודעות על מגבלות

---

### Phase 3: Admin Dashboard (שבוע 3-4)
**מטרה:** ממשק ניהול בסיסי

- [ ] Route `/admin` (protected)
- [ ] Dashboard עם מדדים
- [ ] רשימת משתמשים + חיפוש
- [ ] צפייה בפרטי משתמש
- [ ] הארכת Trial ידנית

**Deliverables:**
- Admin Dashboard פעיל
- יכולת לראות את כל המשתמשים
- יכולת להאריך trial

---

### Phase 4: Stripe Integration (שבוע 4-5)
**מטרה:** תשלומים

- [ ] Stripe account setup
- [ ] Checkout Session API
- [ ] Webhook handler
- [ ] Customer Portal (ניהול מנוי)
- [ ] UI: Pricing page, Upgrade button

**Deliverables:**
- משתמשים יכולים לשלם
- Webhook מעדכן DB
- Customer portal לניהול

---

### Phase 5: Polish & Analytics (שבוע 5-6)
**מטרה:** שיפורים

- [ ] Analytics dashboard
- [ ] Email notifications (Trial ending, Payment failed)
- [ ] Audit log UI
- [ ] Export data (CSV)
- [ ] Testing & Bug fixes

**Deliverables:**
- מערכת מלאה ויציבה
- גרפים ודוחות
- התראות email

---

## ⏱️ אומדן זמנים

| Phase | משך | מאמץ |
|-------|-----|------|
| Phase 1: Foundation | 1-2 שבועות | Medium |
| Phase 2: Usage Limits | 1 שבוע | Medium |
| Phase 3: Admin Dashboard | 1-2 שבועות | High |
| Phase 4: Stripe | 1 שבוע | Medium |
| Phase 5: Polish | 1 שבוע | Low |

**סה"כ:** 5-7 שבועות

---

## ❓ החלטות נדרשות

### לפני תחילת פיתוח, צריך להחליט:

#### 1. Trial Period
- [ ] כמה ימים? **הצעה: 14 ימים**
- [ ] מה קורה אחרי? **הצעה: גישה לצפייה, לא יצירה**

#### 2. הגבלות FREE Tier
- [ ] מקסימום פרויקטים: **הצעה: 2**
- [ ] Abstracts לחודש: **הצעה: 100**
- [ ] Queries לחודש: **הצעה: 10**

#### 3. תמחור PRO
- [ ] מחיר חודשי: **הצעה: $19.99 / ₪75**
- [ ] מחיר שנתי: **הצעה: $199.99 / ₪750**
- [ ] מטבע: **דולר / שקל / שניהם?**

#### 4. שפה
- [ ] Admin Dashboard: **עברית / אנגלית / שניהם?**
- [ ] Emails: **עברית / אנגלית?**

#### 5. הרחבות עתידיות
- [ ] Team/Organization tier?
- [ ] API access נפרד?
- [ ] White-label option?

---

## 🚀 צעדים ראשונים

לאחר אישור התכנית:

1. **יצירת ה-Super Admin שלך:**
   ```sql
   -- After you login once, run this:
   UPDATE user_profiles
   SET role = 'super_admin'
   WHERE id = 'YOUR_USER_ID';
   ```

2. **הרצת ה-SQL migrations**

3. **עדכון Backend עם middleware**

4. **יצירת Admin routes**

---

## 📎 קבצים שייווצרו

```
Backend:
├── app/api/routes/admin.py          # Admin API endpoints
├── app/api/routes/billing.py        # Stripe webhooks
├── app/core/permissions.py          # Permission checking
├── app/services/usage_service.py    # Usage tracking
└── app/services/billing_service.py  # Stripe integration

Frontend:
├── app/admin/
│   ├── page.tsx                     # Dashboard
│   ├── users/page.tsx               # Users list
│   ├── users/[id]/page.tsx          # User details
│   └── analytics/page.tsx           # Analytics
├── app/pricing/page.tsx             # Pricing page
├── components/admin/                # Admin components
└── lib/permissions.ts               # Frontend permission checks

Database:
└── docs/migrations/
    ├── 001_user_profiles.sql
    ├── 002_tier_features.sql
    ├── 003_usage_logs.sql
    └── 004_rls_policies.sql
```

---

## ✅ Checklist לאישור

- [ ] מבנה ה-Tiers מתאים
- [ ] ההגבלות ל-FREE tier הגיוניות
- [ ] Admin Dashboard כולל את מה שצריך
- [ ] התמחור מתאים לשוק
- [ ] לוח הזמנים ריאלי
- [ ] יש החלטות על כל הסעיפים הפתוחים

---

**מחכה לפידבק שלך!** 🎯
