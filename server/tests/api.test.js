import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { runMigrations } from '../src/db/migrate.js';

const app = createApp();

describe('Activity & Memory Tracker End-to-End API Suite', () => {
  let user1Token = '';
  let user1Id = '';
  let user2Token = '';
  let user2Id = '';
  let chocolateItemId = '';
  let walkItemId = '';
  let rideItemId = '';
  let callItemId = '';
  let perkVariantId = '';
  let activeSessionId = '';

  beforeAll(async () => {
    await runMigrations();
  });

  afterAll(async () => {
    // Clean up test data
    if (user1Id || user2Id) {
      await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [user1Id || '00000000-0000-0000-0000-000000000000', user2Id || '00000000-0000-0000-0000-000000000000']);
    }
  });

  describe('Authentication Module', () => {
    it('should register user 1 successfully', async () => {
      const email = `testuser1_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Alice Tracker',
          email,
          password: 'Password123!',
          timezone: 'Asia/Kolkata',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(email.toLowerCase());
      expect(res.body.data.sessionId).toBeDefined();

      user1Token = res.body.data.sessionId;
      user1Id = res.body.data.user.id;
    });

    it('should reject duplicate email registration', async () => {
      const email = `testuser1_dup_${Date.now()}@example.com`;
      await request(app).post('/api/auth/signup').send({
        name: 'First',
        email,
        password: 'Password123!',
      });

      const res = await request(app).post('/api/auth/signup').send({
        name: 'Second',
        email,
        password: 'Password123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with invalid password', async () => {
      const email = `login_fail_${Date.now()}@example.com`;
      await request(app).post('/api/auth/signup').send({
        name: 'Test',
        email,
        password: 'CorrectPassword123',
      });

      const res = await request(app).post('/api/auth/login').send({
        email,
        password: 'WrongPassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should register user 2 for cross-user isolation tests', async () => {
      const email = `testuser2_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Bob Competitor',
          email,
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      user2Token = res.body.data.sessionId;
      user2Id = res.body.data.user.id;
    });

    it('should fetch current user via /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(user1Id);
    });

    it('should reject unauthenticated request on protected route', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Items Library Module', () => {
    it('user 1 must start with zero items in library', async () => {
      const res = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should create reusable item Chocolate (general event/food tracking)', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Chocolate',
          description: 'Sweet snacks & treats',
          trackingType: 'general',
          icon: 'Candy',
          color: '#ec4899',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Chocolate');
      expect(res.body.duplicateWarning).toBe(false);
      chocolateItemId = res.body.data.id;
    });

    it('should create Walk item (timed tracking)', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Walk',
          description: 'Evening outdoor stroll',
          trackingType: 'timed',
          icon: 'Footprints',
          color: '#3b82f6',
        });

      expect(res.status).toBe(201);
      walkItemId = res.body.data.id;
    });

    it('should create Night Ride item (trip tracking)', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Night Ride',
          description: 'Bicycle or motor rides with stops',
          trackingType: 'trip',
          icon: 'Bike',
          color: '#8b5cf6',
        });

      expect(res.status).toBe(201);
      rideItemId = res.body.data.id;
    });

    it('should create Call item (communication tracking)', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Call',
          description: 'Phone and meeting calls',
          trackingType: 'call',
          icon: 'Phone',
          color: '#10b981',
        });

      expect(res.status).toBe(201);
      callItemId = res.body.data.id;
    });

    it('should warn about potential duplicate name when creating another Chocolate item', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Chocolate',
          trackingType: 'general',
        });

      expect(res.status).toBe(201);
      expect(res.body.duplicateWarning).toBe(true);
      // Clean up the duplicate test item
      await request(app)
        .delete(`/api/items/${res.body.data.id}`)
        .set('Authorization', `Bearer ${user1Token}`);
    });

    it('should prevent User 2 from accessing User 1 item', async () => {
      const res = await request(app)
        .get(`/api/items/${chocolateItemId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
    });

    it('item details should show "Never logged" when never logged', async () => {
      const res = await request(app)
        .get(`/api/items/${chocolateItemId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_occurrences).toBe(0);
      expect(res.body.data.last_occurrence.status).toBe('never');
      expect(res.body.data.last_occurrence.label).toBe('Never logged');
    });

    it('should pin Chocolate to Home and reflect on Favorites', async () => {
      const pinRes = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ itemId: chocolateItemId });

      expect(pinRes.status).toBe(200);
      expect(pinRes.body.data.pinned).toBe(true);

      const favRes = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(favRes.status).toBe(200);
      expect(favRes.body.data.some((f) => f.id === chocolateItemId)).toBe(true);
    });
  });

  describe('Variants & Sub-Items Module', () => {
    it('should create variants under Chocolate (Dairy Milk and Perk)', async () => {
      const resDairy = await request(app)
        .post(`/api/variants/item/${chocolateItemId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Dairy Milk', description: 'Cadbury Silk' });

      expect(resDairy.status).toBe(201);
      expect(resDairy.body.data.name).toBe('Dairy Milk');

      const resPerk = await request(app)
        .post(`/api/variants/item/${chocolateItemId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Perk', description: 'Wafer bar' });

      expect(resPerk.status).toBe(201);
      expect(resPerk.body.data.name).toBe('Perk');
      perkVariantId = resPerk.body.data.id;
    });

    it('should list all variants for Chocolate', async () => {
      const res = await request(app)
        .get(`/api/variants/item/${chocolateItemId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('Activity Logging & Last Occurrence Module', () => {
    it('should log Perk occurrence under Chocolate and verify last occurrence updates to Today', async () => {
      const res = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          itemId: chocolateItemId,
          variantId: perkVariantId,
          occurredAt: new Date().toISOString(),
          notes: 'Had one Perk in the afternoon',
          quantity: 1,
          price: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.item_name).toBe('Chocolate');
      expect(res.body.data.variant_name).toBe('Perk');

      // Check item details
      const itemRes = await request(app)
        .get(`/api/items/${chocolateItemId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(itemRes.body.data.total_occurrences).toBe(1);
      expect(itemRes.body.data.last_occurrence.label).toBe('Today');
    });

    it('should allow multiple occurrences of the same item on the same day', async () => {
      const res = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          itemId: chocolateItemId,
          occurredAt: new Date().toISOString(),
          notes: 'Had another piece in the evening',
          quantity: 2,
        });

      expect(res.status).toBe(201);

      const itemRes = await request(app)
        .get(`/api/items/${chocolateItemId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(itemRes.body.data.total_occurrences).toBe(2);
    });
  });

  describe('Timed Activity & Sessions Module', () => {
    it('should start a timed session for Walk', async () => {
      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          itemId: walkItemId,
          notes: 'Morning brisk walk',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('active');
      activeSessionId = res.body.data.id;
    });

    it('should prevent starting duplicate active session for the same item', async () => {
      const res = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          itemId: walkItemId,
        });

      expect(res.status).toBe(409);
    });

    it('should list active sessions in /api/sessions/active and dashboard', async () => {
      const res = await request(app)
        .get('/api/sessions/active')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some((s) => s.id === activeSessionId)).toBe(true);
    });

    it('should stop session, persist duration, and create completed activity log', async () => {
      // End 30 minutes after start
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 1800 * 1000); // 1800 seconds

      const res = await request(app)
        .post(`/api/sessions/${activeSessionId}/stop`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          endedAt: endTime.toISOString(),
          notes: 'Completed 3km brisk walk',
          createActivityLog: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.duration_seconds).toBeGreaterThanOrEqual(1800);
      expect(res.body.data.activity_id).toBeDefined();
    });
  });

  describe('Trip & Visited Places Module', () => {
    let tripSessionId = '';

    it('should start a Night Ride session and record multiple visited places', async () => {
      const sessionRes = await request(app)
        .post('/api/sessions/start')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          itemId: rideItemId,
          notes: 'Late night city ride',
        });

      expect(sessionRes.status).toBe(201);
      tripSessionId = sessionRes.body.data.id;

      // Add place 1
      const p1 = await request(app)
        .post(`/api/places/session/${tripSessionId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Marine Drive Promenade',
          address: 'South Bay',
          notes: 'Chilly breeze',
        });
      expect(p1.status).toBe(201);

      // Add place 2
      const p2 = await request(app)
        .post(`/api/places/session/${tripSessionId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Midnight Chai Point',
          address: 'Corner Stall',
          notes: 'Irani chai and bun maska',
        });
      expect(p2.status).toBe(201);

      // Get places for session
      const listRes = await request(app)
        .get(`/api/places/session/${tripSessionId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(2);

      // Stop trip
      await request(app)
        .post(`/api/sessions/${tripSessionId}/stop`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ notes: 'Epic night ride with 2 stops' });
    });
  });

  describe('Call / Communication Module', () => {
    it('should log a Call occurrence with caller name and duration', async () => {
      const res = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          itemId: callItemId,
          callParticipant: 'Dr. Sarah Connor',
          callContactLabel: 'Mentor',
          callType: 'incoming',
          callDurationSeconds: 940, // 15 mins 40 secs
          notes: 'Discussed project roadmap and database design',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.call_participant).toBe('Dr. Sarah Connor');
      expect(res.body.data.call_type).toBe('incoming');
      expect(res.body.data.call_duration_seconds).toBe(940);
    });
  });

  describe('Dashboard, History and Insights Analytics', () => {
    it('should return valid Dashboard summary with real database stats', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.totalItems).toBe(4); // Chocolate, Walk, Night Ride, Call
      expect(res.body.data.stats.pinnedCount).toBe(1); // Chocolate pinned
      expect(res.body.data.pinnedItems.length).toBe(1);
    });

    it('should filter History by trackingType and item', async () => {
      const res = await request(app)
        .get(`/api/history?itemId=${chocolateItemId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should return database-backed Insights analytics', async () => {
      const res = await request(app)
        .get('/api/insights')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.occurrencesByItem.length).toBeGreaterThan(0);
      expect(res.body.data.callStats.total_calls).toBeGreaterThanOrEqual(1);
      expect(res.body.data.frequentPlaces.length).toBeGreaterThanOrEqual(2);
    });
  });
});
