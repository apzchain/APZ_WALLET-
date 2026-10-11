```typescript
db.exec(`
  -- ───── IP Access List ─────
  CREATE TABLE IF NOT EXISTS ip_access_list (
    id TEXT PRIMARY KEY,
    entry TEXT NOT NULL,                  -- IP, CIDR, یا wildcard مثل 192.168.*
    entry_type TEXT NOT NULL,             -- 'ip' | 'cidr' | 'wildcard'
    list_type TEXT NOT NULL,              -- 'whitelist' | 'blacklist'
    reason TEXT,
    expires_at INTEGER,                   -- NULL = دائمی
    created_by TEXT,                      -- user_id ادمین
    created_at INTEGER NOT NULL,
    hits INTEGER NOT NULL DEFAULT 0,
    last_hit_at INTEGER,
    UNIQUE(entry, list_type)
  );
  CREATE INDEX IF NOT EXISTS idx_ip_access_type ON ip_access_list(list_type, expires_at);
  CREATE INDEX IF NOT EXISTS idx_ip_access_entry ON ip_access_list(entry);

  -- ───── Geo Rules ─────
  CREATE TABLE IF NOT EXISTS geo_rules (
    id TEXT PRIMARY KEY,
    rule_type TEXT NOT NULL,              -- 'country' | 'city' | 'asn' | 'region'
    value TEXT NOT NULL,                  -- 'IR' | 'Tehran' | 'AS12345'
    action TEXT NOT NULL,                 -- 'allow' | 'block' | 'challenge'
    reason TEXT,
    priority INTEGER NOT NULL DEFAULT 100, -- کوچیک‌تر = اولویت بالاتر
    enabled INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE(rule_type, value, action)
  );
  CREATE INDEX IF NOT EXISTS idx_geo_rules_active ON geo_rules(enabled, priority);

  -- ───── Geo Access Log ─────
  CREATE TABLE IF NOT EXISTS geo_access_log (
    id TEXT PRIMARY KEY,
    ip_address TEXT NOT NULL,
    user_id TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    asn TEXT,
    isp TEXT,
    action TEXT NOT NULL,                 -- 'allowed' | 'blocked' | 'challenged'
    rule_id TEXT,
    path TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_geo_log_ip ON geo_access_log(ip_address, created_at);
  CREATE INDEX IF NOT EXISTS idx_geo_log_country ON geo_access_log(country, created_at);

  -- ───── Geo Block Events (برای مانیتورینگ) ─────
  CREATE TABLE IF NOT EXISTS geo_block_stats (
    country TEXT PRIMARY KEY,
    total_blocks INTEGER NOT NULL DEFAULT 0,
    last_block_at INTEGER
  );
`);
```
