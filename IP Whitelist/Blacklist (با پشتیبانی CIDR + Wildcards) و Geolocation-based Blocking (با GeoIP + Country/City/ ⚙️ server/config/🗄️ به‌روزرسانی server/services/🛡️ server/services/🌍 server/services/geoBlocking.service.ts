import crypto from 'crypto';
import geoip from 'geoip-lite';
import db from './db.service.js';
import { GEO_CONFIG } from '../config/geo.config.js';

export interface GeoRuleRow {
  id: string;
  rule_type: 'country' | 'city' | 'asn' | 'region';
  value: string;
  action: 'allow' | 'block' | 'challenge';
  reason: string | null;
  priority: number;
  enabled: number;
  created_by: string | null;
  created_at: number;
}

export interface GeoProfile {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  ll?: [number, number];
  asn?: string;
  isp?: string;
  isPrivate: boolean;
}

export class GeoBlockingService {
  private rulesCache: { data: GeoRuleRow[]; ts: number } | null = null;

  // ═══════════════════════════════════════════
  //  Lookup IP → Geo profile
  // ═══════════════════════════════════════════
  lookup(ip: string): GeoProfile {
    const normalized = ip.startsWith('::ffff:') ? ip.slice(7) : ip;

    // IP های private/local
    if (
      normalized === '127.0.0.1' ||
      normalized === '::1' ||
      normalized.startsWith('10.') ||
      normalized.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)
    ) {
      return { ip: normalized, isPrivate: true, country: 'LOCAL' };
    }

    try {
      const geo = geoip.lookup(normalized);
      if (!geo) return { ip: normalized, isPrivate: false };

      return {
        ip: normalized,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone,
        ll: geo.ll as [number, number],
        asn: undefined, // geoip-lite ASN نداره — از maxmind استفاده کن
        isp: undefined,
        isPrivate: false
      };
    } catch (err) {
      console.error('[GeoBlocking] lookup error:', err);
      return { ip: normalized, isPrivate: false };
    }
  }

  // ═══════════════════════════════════════════
  //  Main Check
  // ═══════════════════════════════════════════
  check(ip: string): {
    action: 'allow' | 'block' | 'challenge';
    reason: string;
    ruleId?: string;
    profile: GeoProfile;
  } {
    const profile = this.lookup(ip);

    // اگر geo-blocking غیرفعاله
    if (!GEO_CONFIG.enabled) {
      return { action: 'allow', reason: 'geo_blocking_disabled', profile };
    }

    // IP private → اجازه
    if (profile.isPrivate) {
      return { action: 'allow', reason: 'private_ip', profile };
    }

    // کشور نامشخص
    if (!profile.country) {
      return {
        action: GEO_CONFIG.failOpen ? 'allow' : 'block',
        reason: GEO_CONFIG.failOpen ? 'unknown_country_fail_open' : 'unknown_country_fail_closed',
        profile
      };
    }

    // 1. قوانین سفارشی DB (اولویت‌دار)
    const rules = this.getRules();
    for (const rule of rules) {
      if (this.ruleMatches(rule, profile)) {
        if (rule.action === 'block') {
          this.recordBlock(profile.country);
          this.logAccess(profile, 'blocked', rule.id);
        } else if (rule.action === 'allow') {
          this.logAccess(profile, 'allowed', rule.id);
        }
        return {
          action: rule.action,
          reason: rule.reason || `rule:${rule.rule_type}=${rule.value}`,
          ruleId: rule.id,
          profile
        };
      }
    }

    // 2. مود پیش‌فرض
    if (GEO_CONFIG.mode === 'allow_list') {
      const allowed = GEO_CONFIG.allowedCountries.includes(profile.country);
      if (!allowed) {
        this.recordBlock(profile.country);
        this.logAccess(profile, 'blocked');
        return {
          action: 'block',
          reason: `country_not_in_allowlist:${profile.country}`,
          profile
        };
      }
    } else if (GEO_CONFIG.mode === 'block_list') {
      const blocked = GEO_CONFIG.blockedCountries.includes(profile.country);
      if (blocked) {
        this.recordBlock(profile.country);
        this.logAccess(profile, 'blocked');
        return {
          action: 'block',
          reason: `country_blacklisted:${profile.country}`,
          profile
        };
      }
    }

    this.logAccess(profile, 'allowed');
    return { action: 'allow', reason: 'default_allow', profile };
  }

  private ruleMatches(rule: GeoRuleRow, profile: GeoProfile): boolean {
    if (rule.enabled !== 1) return false;

    switch (rule.rule_type) {
      case 'country':
        return profile.country?.toUpperCase() === rule.value.toUpperCase();
      case 'city':
        return profile.city?.toLowerCase() === rule.value.toLowerCase();
      case 'region':
        return profile.region?.toLowerCase() === rule.value.toLowerCase();
      case 'asn':
        return profile.asn === rule.value;
      default:
        return false;
    }
  }

  private getRules(): GeoRuleRow[] {
    const now = Date.now();
    if (this.rulesCache && now - this.rulesCache.ts < 60_000) {
      return this.rulesCache.data;
    }

    const rows = db.prepare(`
      SELECT * FROM geo_rules WHERE enabled = 1 ORDER BY priority ASC, created_at DESC
    `).all() as GeoRuleRow[];

    this.rulesCache = { data: rows, ts: now };
    return rows;
  }

  // ═══════════════════════════════════════════
  //  Logging & Stats
  // ═══════════════════════════════════════════
  private logAccess(profile: GeoProfile, action: string, ruleId?: string, path?: string, userId?: string, ua?: string) {
    try {
      db.prepare(`
        INSERT INTO geo_access_log 
          (id, ip_address, user_id, country, region, city, asn, isp, action, rule_id, path, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        profile.ip,
        userId || null,
        profile.country || null,
        profile.region || null,
        profile.city || null,
        profile.asn || null,
        profile.isp || null,
        action,
        ruleId || null,
        path || null,
        ua || null,
        Date.now()
      );
    } catch (err) {
      console.error('[GeoBlocking] logAccess error:', err);
    }
  }

  private recordBlock(country?: string) {
    if (!country) return;
    try {
      db.prepare(`
        INSERT INTO geo_block_stats (country, total_blocks, last_block_at)
        VALUES (?, 1, ?)
        ON CONFLICT(country) DO UPDATE SET
          total_blocks = geo_block_stats.total_blocks + 1,
          last_block_at = excluded.last_block_at
      `).run(country, Date.now());
    } catch {}
  }

  getStats() {
    return {
      enabled: GEO_CONFIG.enabled,
      mode: GEO_CONFIG.mode,
      blockedCountries: GEO_CONFIG.blockedCountries,
      allowedCountries: GEO_CONFIG.allowedCountries,
      rulesCount: this.getRules().length,
      blockStats: db.prepare(`
        SELECT * FROM geo_block_stats ORDER BY total_blocks DESC LIMIT 20
      `).all()
    };
  }

  getRecentLogs(limit = 100) {
    return db.prepare(`
      SELECT * FROM geo_access_log ORDER BY created_at DESC LIMIT ?
    `).all(limit);
  }

  // ═══════════════════════════════════════════
  //  Rule CRUD
  // ═══════════════════════════════════════════
  addRule(params: {
    ruleType: 'country' | 'city' | 'region' | 'asn';
    value: string;
    action: 'allow' | 'block' | 'challenge';
    reason?: string;
    priority?: number;
    createdBy?: string;
  }) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO geo_rules 
        (id, rule_type, value, action, reason, priority, enabled, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      params.ruleType,
      params.value.toUpperCase(),
      params.action,
      params.reason || null,
      params.priority ?? 100,
      params.createdBy || null,
      Date.now()
    );
    this.rulesCache = null;
    return db.prepare('SELECT * FROM geo_rules WHERE id = ?').get(id);
  }

  updateRule(id: string, patch: Partial<{ enabled: number; priority: number; reason: string; action: string }>) {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) {
        fields.push(`${k} = ?`);
        values.push(v);
      }
    }
    if (!fields.length) return;
    values.push(id);
    db.prepare(`UPDATE geo_rules SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    this.rulesCache = null;
  }

  removeRule(id: string) {
    db.prepare('DELETE FROM geo_rules WHERE id = ?').run(id);
    this.rulesCache = null;
  }

  listRules(): GeoRuleRow[] {
    return db.prepare('SELECT * FROM geo_rules ORDER BY priority ASC, created_at DESC').all() as GeoRuleRow[];
  }
}

export const geoBlockingService = new GeoBlockingService();
