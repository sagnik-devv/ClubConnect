import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

// Force test database BEFORE importing app/prisma
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://sagnikchakraborty@localhost:5432/clubconnect_test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_key_for_vitest_12345';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_for_vitest_67890';
process.env.COOKIE_SECRET = 'test_cookie_secret_key_for_vitest_abcdef';
process.env.CLIENT_URL = 'http://localhost:5173';

const { createApp } = await import('../app.js');
const { prisma } = await import('../config/database.js');

const app = createApp();

async function cleanDatabase() {
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.task.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.recruitmentApplication.deleteMany();
  await prisma.clubMembership.deleteMany();
  await prisma.club.deleteMany();
  await prisma.user.deleteMany();
}

function getCsrf(agentCookies: string[]): string {
  const csrfCookie = agentCookies.find((c) => c.startsWith('clubconnect_csrf='));
  if (!csrfCookie) return '';
  return csrfCookie.split(';')[0].split('=')[1];
}

describe('ClubConnect Full-Stack API Integration Tests', () => {
  const presidentAgent = request.agent(app);
  const studentAgent = request.agent(app);
  const outsiderAgent = request.agent(app);

  let presidentCsrf = '';
  let studentCsrf = '';
  let outsiderCsrf = '';

  let presidentId = '';
  let studentId = '';
  let outsiderId = '';

  let clubId = '';
  let secondClubId = '';
  let taskId = '';
  let contributionId = '';
  let rejectedContributionId = '';
  let applicationId = '';
  let eventId = '';

  beforeAll(async () => {
    await prisma.$connect();
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('Authentication & Session Security', () => {
    it('registers a new user and rejects duplicate emails', async () => {
      const res = await presidentAgent.post('/api/auth/register').send({
        fullName: 'President User',
        email: 'president@campus.edu',
        password: 'Password123',
        confirmPassword: 'Password123',
        department: 'Computer Science',
        course: 'B.Tech',
        yearOfStudy: 'Senior',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      presidentId = res.body.data.user.id;
      presidentCsrf = res.body.data.csrfToken || getCsrf(res.headers['set-cookie'] || []);

      const dup = await request(app).post('/api/auth/register').send({
        fullName: 'Duplicate User',
        email: 'president@campus.edu',
        password: 'Password123',
        confirmPassword: 'Password123',
        department: 'Computer Science',
        course: 'B.Tech',
        yearOfStudy: 'Freshman',
      });
      expect(dup.status).toBe(409);
    });

    it('registers student and outsider accounts, rejects wrong password, and restores session', async () => {
      const sRes = await studentAgent.post('/api/auth/register').send({
        fullName: 'Student Member',
        email: 'student@campus.edu',
        password: 'Password123',
        confirmPassword: 'Password123',
        department: 'Design',
        course: 'B.Des',
        yearOfStudy: 'Sophomore',
      });
      expect(sRes.status).toBe(201);
      studentId = sRes.body.data.user.id;
      studentCsrf = sRes.body.data.csrfToken;

      const oRes = await outsiderAgent.post('/api/auth/register').send({
        fullName: 'Other President',
        email: 'outsider@campus.edu',
        password: 'Password123',
        confirmPassword: 'Password123',
        department: 'Mechanical',
        course: 'B.Tech',
        yearOfStudy: 'Junior',
      });
      expect(oRes.status).toBe(201);
      outsiderId = oRes.body.data.user.id;
      outsiderCsrf = oRes.body.data.csrfToken;

      const badLogin = await request(app).post('/api/auth/login').send({
        email: 'student@campus.edu',
        password: 'WrongPassword1',
      });
      expect(badLogin.status).toBe(401);

      const meRes = await studentAgent.get('/api/auth/me');
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe('student@campus.edu');

      const refreshRes = await studentAgent
        .post('/api/auth/refresh')
        .set('X-CSRF-Token', studentCsrf);
      expect(refreshRes.status).toBe(200);
      studentCsrf = refreshRes.body.data.csrfToken;
    });

    it('logs out, revokes refresh token, and logs back in', async () => {
      const logoutRes = await studentAgent
        .post('/api/auth/logout')
        .set('X-CSRF-Token', studentCsrf);
      expect(logoutRes.status).toBe(200);

      const afterLogoutMe = await studentAgent.get('/api/auth/me');
      expect(afterLogoutMe.status).toBe(401);

      const loginRes = await studentAgent.post('/api/auth/login').send({
        email: 'student@campus.edu',
        password: 'Password123',
      });
      expect(loginRes.status).toBe(200);
      studentCsrf = loginRes.body.data.csrfToken;
    });
  });

  describe('Club Management & Recruitment Workflow', () => {
    it('creates clubs, prevents cross-club unauthorized management, and handles recruitment acceptance once', async () => {
      const clubRes = await presidentAgent
        .post('/api/clubs')
        .set('X-CSRF-Token', presidentCsrf)
        .send({
          name: 'Coding Club',
          shortDescription: 'Build real campus software together.',
          description: 'Collaborative engineering club building open-source student utilities.',
          category: 'Technology',
          expectedTimeCommitment: '4 hrs/week',
          isRecruiting: true,
        });
      expect(clubRes.status).toBe(201);
      clubId = clubRes.body.data.id;

      const secondClubRes = await outsiderAgent
        .post('/api/clubs')
        .set('X-CSRF-Token', outsiderCsrf)
        .send({
          name: 'Robotics Society',
          shortDescription: 'Autonomous hardware engineering.',
          description: 'Design and wire competition-ready robotics systems.',
          category: 'Engineering',
          isRecruiting: true,
        });
      expect(secondClubRes.status).toBe(201);
      secondClubId = secondClubRes.body.data.id;

      // Outsider president cannot manage Coding Club
      const forbiddenUpdate = await outsiderAgent
        .patch(`/api/clubs/${clubId}`)
        .set('X-CSRF-Token', outsiderCsrf)
        .send({ shortDescription: 'Hijacked description' });
      expect(forbiddenUpdate.status).toBe(403);

      // Student submits recruitment application
      const appRes = await studentAgent
        .post(`/api/clubs/${clubId}/applications`)
        .set('X-CSRF-Token', studentCsrf)
        .send({
          motivation: 'Excited to contribute TypeScript frontend components.',
          skills: ['React', 'TypeScript'],
          preferredRole: 'Frontend Contributor',
        });
      expect(appRes.status).toBe(201);
      applicationId = appRes.body.data.id;

      // Duplicate pending application is rejected
      const dupAppRes = await studentAgent
        .post(`/api/clubs/${clubId}/applications`)
        .set('X-CSRF-Token', studentCsrf)
        .send({
          motivation: 'Applying twice should fail cleanly.',
          skills: ['React'],
          preferredRole: 'Frontend Contributor',
        });
      expect(dupAppRes.status).toBe(409);

      // Student cannot approve their own application
      const selfApprove = await studentAgent
        .patch(`/api/recruitment/${applicationId}/status`)
        .set('X-CSRF-Token', studentCsrf)
        .send({ status: 'ACCEPTED' });
      expect(selfApprove.status).toBe(403);

      // President accepts application -> creates single active membership
      const acceptRes = await presidentAgent
        .patch(`/api/recruitment/${applicationId}/status`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({ status: 'ACCEPTED' });
      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.data.status).toBe('ACCEPTED');

      const memberships = await prisma.clubMembership.findMany({
        where: { userId: studentId, clubId },
      });
      expect(memberships).toHaveLength(1);
      expect(memberships[0].status).toBe('ACTIVE');
    });

    it('handles direct join requests and allows leaving a club', async () => {
      const joinRes = await outsiderAgent
        .post(`/api/clubs/${clubId}/join`)
        .set('X-CSRF-Token', outsiderCsrf);
      expect(joinRes.status).toBe(201);
      const requestId = joinRes.body.data.id;

      const approveJoin = await presidentAgent
        .patch(`/api/clubs/${clubId}/membership-requests/${requestId}`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({ status: 'ACTIVE' });
      expect(approveJoin.status).toBe(200);

      const leaveRes = await outsiderAgent
        .post(`/api/clubs/${clubId}/leave`)
        .set('X-CSRF-Token', outsiderCsrf);
      expect(leaveRes.status).toBe(200);
      expect(leaveRes.body.data.status).toBe('LEFT');
    });
  });

  describe('Tasks & TaskActivity Authorization', () => {
    it('allows leaders to create/assign tasks, members to update own task status, and rejects unauthorized edits', async () => {
      // Student cannot create tasks
      const forbiddenTask = await studentAgent
        .post('/api/tasks')
        .set('X-CSRF-Token', studentCsrf)
        .send({
          title: 'Unauthorized Task',
          description: 'Students should not create club tasks.',
          clubId,
          priority: 'LOW',
          status: 'TODO',
        });
      expect(forbiddenTask.status).toBe(403);

      // President creates and assigns task to student
      const createRes = await presidentAgent
        .post('/api/tasks')
        .set('X-CSRF-Token', presidentCsrf)
        .send({
          title: 'Build event check-in scanner',
          description: 'Implement responsive check-in UI.',
          clubId,
          assignedToId: studentId,
          priority: 'HIGH',
          status: 'TODO',
        });
      expect(createRes.status).toBe(201);
      taskId = createRes.body.data.id;

      // Student moves assigned task status to COMPLETED
      const statusRes = await studentAgent
        .patch(`/api/tasks/${taskId}/status`)
        .set('X-CSRF-Token', studentCsrf)
        .send({ status: 'COMPLETED' });
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBe('COMPLETED');

      // Outsider cannot read or modify Coding Club task
      const outsiderTask = await outsiderAgent.get(`/api/tasks/${taskId}`);
      expect(outsiderTask.status).toBe(403);

      // TaskActivity recorded both creation and status change
      const actRes = await studentAgent.get(`/api/tasks/${taskId}/activity`);
      expect(actRes.status).toBe(200);
      expect(actRes.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Contributions & Verification Rules', () => {
    it('submits contributions, prevents self-verification, and updates verified points', async () => {
      const c1 = await studentAgent
        .post('/api/contributions')
        .set('X-CSRF-Token', studentCsrf)
        .send({
          clubId,
          taskId,
          title: 'Shipped check-in scanner',
          description: 'Delivered responsive check-in modal with error handling.',
          contributionType: 'TASK',
          hoursSpent: 3.5,
        });
      expect(c1.status).toBe(201);
      contributionId = c1.body.data.id;

      const c2 = await studentAgent
        .post('/api/contributions')
        .set('X-CSRF-Token', studentCsrf)
        .send({
          clubId,
          title: 'Draft unreviewed flyer',
          description: 'Needs rework before counting.',
          contributionType: 'OTHER',
          hoursSpent: 1,
        });
      expect(c2.status).toBe(201);
      rejectedContributionId = c2.body.data.id;

      // Student cannot verify own contribution
      const selfVerify = await studentAgent
        .patch(`/api/contributions/${contributionId}/verify`)
        .set('X-CSRF-Token', studentCsrf)
        .send({ status: 'VERIFIED', points: 50 });
      expect(selfVerify.status).toBe(403);

      // President verifies first and rejects second
      const verifyRes = await presidentAgent
        .patch(`/api/contributions/${contributionId}/verify`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({ status: 'VERIFIED', points: 25 });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.points).toBe(25);

      const rejectRes = await presidentAgent
        .patch(`/api/contributions/${rejectedContributionId}/verify`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({ status: 'REJECTED', reviewNote: 'Incomplete details' });
      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.points).toBe(0);

      // Student analytics reflect ONLY verified contributions
      const analyticsRes = await studentAgent.get('/api/analytics/student');
      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.data.summary.verifiedContributions).toBe(1);
      expect(analyticsRes.body.data.summary.totalVerifiedPoints).toBe(25);
    });
  });

  describe('Events & Capacity Enforcement', () => {
    it('creates an event, prevents duplicate registration, and enforces capacity', async () => {
      const evRes = await presidentAgent
        .post('/api/events')
        .set('X-CSRF-Token', presidentCsrf)
        .send({
          clubId,
          title: 'Winter Build Sprint',
          description: 'Hands-on sprint with peer code reviews.',
          location: 'Innovation Lab 204',
          category: 'Workshop',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          capacity: 1,
        });
      expect(evRes.status).toBe(201);
      eventId = evRes.body.data.id;

      // Student registers (fills capacity = 1)
      const regRes = await studentAgent
        .post(`/api/events/${eventId}/register`)
        .set('X-CSRF-Token', studentCsrf);
      expect(regRes.status).toBe(201);

      // Duplicate registration rejected
      const dupReg = await studentAgent
        .post(`/api/events/${eventId}/register`)
        .set('X-CSRF-Token', studentCsrf);
      expect(dupReg.status).toBe(409);

      // Outsider blocked by capacity limit
      const fullReg = await outsiderAgent
        .post(`/api/events/${eventId}/register`)
        .set('X-CSRF-Token', outsiderCsrf);
      expect(fullReg.status).toBe(409);

      // Cancel and re-check
      const cancelRes = await studentAgent
        .delete(`/api/events/${eventId}/register`)
        .set('X-CSRF-Token', studentCsrf);
      expect(cancelRes.status).toBe(200);
    });
  });

  describe('Notifications Privacy & Read State', () => {
    it('retrieves user notifications, marks read, and isolates access between users', async () => {
      const listRes = await studentAgent.get('/api/notifications');
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      const notifId = listRes.body.data[0].id;

      // Outsider cannot read/mark student's notification
      const outsiderMark = await outsiderAgent
        .patch(`/api/notifications/${notifId}/read`)
        .set('X-CSRF-Token', outsiderCsrf)
        .send({ isRead: true });
      expect(outsiderMark.status).toBe(403);

      const markRes = await studentAgent
        .patch(`/api/notifications/${notifId}/read`)
        .set('X-CSRF-Token', studentCsrf)
        .send({ isRead: true });
      expect(markRes.status).toBe(200);
      expect(markRes.body.data.isRead).toBe(true);

      // Outsider cannot read Coding Club private statistics
      const clubStatsForbidden = await outsiderAgent.get(`/api/clubs/${clubId}/statistics`);
      expect(clubStatsForbidden.status).toBe(403);

      // President can read Coding Club statistics
      const clubStatsOk = await presidentAgent.get(`/api/clubs/${clubId}/statistics`);
      expect(clubStatsOk.status).toBe(200);
      expect(clubStatsOk.body.data.summary.totalActiveMembers).toBe(2);
    });
  });

  describe('President Portal & Announcements RBAC', () => {
    let announcementId = '';

    it('rejects plain members and cross-club non-leaders from /api/president/* routes', async () => {
      const memberDash = await studentAgent.get('/api/president/dashboard');
      expect(memberDash.status).toBe(403);

      const outsiderCodingDash = await outsiderAgent.get(
        `/api/president/dashboard?clubId=${clubId}`
      );
      expect(outsiderCodingDash.status).toBe(403);

      const memberMembers = await studentAgent.get(`/api/president/clubs/${clubId}/members`);
      expect(memberMembers.status).toBe(403);
    });

    it('isolates clubs between different presidents (prevents cross-club access)', async () => {
      // Coding Club president cannot access Robotics Society president endpoints
      const crossClub = await presidentAgent.get(
        `/api/president/clubs/${secondClubId}/members`
      );
      expect(crossClub.status).toBe(403);
    });

    it('loads dashboard, manages member roles/settings, announcements, analytics, and presidency transfer', async () => {
      // President loads scoped dashboard
      const dashRes = await presidentAgent.get(`/api/president/dashboard?clubId=${clubId}`);
      expect(dashRes.status).toBe(200);
      expect(dashRes.body.data.club.id).toBe(clubId);
      expect(dashRes.body.data.overview.totalMembers).toBe(2);

      // Update club points settings and test custom config default when verifying contributions
      const settingsRes = await presidentAgent
        .patch(`/api/president/clubs/${clubId}/settings`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({
          requireVerification: true,
          contributionPointsConfig: {
            TASK: 10,
            EVENT: 30,
            PROJECT: 50,
            LEADERSHIP: 25,
            VOLUNTEERING: 20,
            OTHER: 12,
          },
        });
      expect(settingsRes.status).toBe(200);

      // Student submits EVENT contribution without points override -> verified uses configured 30 pts
      const cEvent = await studentAgent
        .post('/api/contributions')
        .set('X-CSRF-Token', studentCsrf)
        .send({
          clubId,
          title: 'Hosted check-in booth',
          description: 'Managed front desk during sprint event.',
          contributionType: 'EVENT',
          hoursSpent: 2,
        });
      expect(cEvent.status).toBe(201);

      const presidentVerify = await presidentAgent
        .patch(`/api/president/contributions/${cEvent.body.data.id}/verify`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({ status: 'VERIFIED', reviewNote: 'Great work' });
      expect(presidentVerify.status).toBe(200);
      expect(presidentVerify.body.data.points).toBe(30);

      // President publishes pinned announcement -> visible to student member + creates notification
      const annRes = await presidentAgent
        .post(`/api/president/clubs/${clubId}/announcements`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({
          title: 'Demo Night Schedule',
          content: 'Please arrive 30 minutes early for equipment checks.',
          isPinned: true,
        });
      expect(annRes.status).toBe(201);
      announcementId = annRes.body.data.id;

      const memberFeed = await studentAgent.get('/api/announcements');
      expect(memberFeed.status).toBe(200);
      expect(memberFeed.body.data.some((a: { id: string }) => a.id === announcementId)).toBe(true);

      const outsiderFeed = await outsiderAgent.get('/api/announcements');
      expect(outsiderFeed.status).toBe(200);
      expect(outsiderFeed.body.data.some((a: { id: string }) => a.id === announcementId)).toBe(
        false
      );

      // President analytics endpoint returns live database metrics
      const analyticsRes = await presidentAgent.get(
        `/api/president/clubs/${clubId}/analytics?range=30d`
      );
      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.data.engagement.totalMembers).toBe(2);
      expect(analyticsRes.body.data.contributions.verifiedCount).toBeGreaterThanOrEqual(2);

      // Membership request approve/reject via president portal
      const join2 = await outsiderAgent
        .post(`/api/clubs/${clubId}/join`)
        .set('X-CSRF-Token', outsiderCsrf);
      expect(join2.status).toBe(201);
      const reqId = join2.body.data.id;

      const rejectJoin = await presidentAgent
        .patch(`/api/clubs/${clubId}/membership-requests/${reqId}`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({ status: 'REJECTED', reason: 'Cohort full for this term' });
      expect(rejectJoin.status).toBe(200);

      // Member role promotion & task workload query
      const membersRes = await presidentAgent.get(`/api/president/clubs/${clubId}/members`);
      expect(membersRes.status).toBe(200);
      const studentMembership = membersRes.body.data.find(
        (m: { userId: string }) => m.userId === studentId
      );
      expect(studentMembership).toBeTruthy();

      const tasksWorkloadRes = await presidentAgent.get(`/api/president/clubs/${clubId}/tasks`);
      expect(tasksWorkloadRes.status).toBe(200);
      expect(Array.isArray(tasksWorkloadRes.body.data.membersWorkload)).toBe(true);

      // Update member role to COORDINATOR
      const promoteRes = await presidentAgent
        .patch(`/api/president/clubs/${clubId}/members/${studentMembership.id}`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({ role: 'COORDINATOR' });
      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.data.role).toBe('COORDINATOR');

      // President deletes announcement cleanly
      const delAnn = await presidentAgent
        .delete(`/api/president/announcements/${announcementId}`)
        .set('X-CSRF-Token', presidentCsrf);
      expect(delAnn.status).toBe(204);

      // Presidency transfer promotes student to PRESIDENT and demotes former president to VICE_PRESIDENT
      const transferRes = await presidentAgent
        .patch(`/api/president/clubs/${clubId}/settings`)
        .set('X-CSRF-Token', presidentCsrf)
        .send({ transferPresidentToUserId: studentId });
      expect(transferRes.status).toBe(200);

      // Former student (now PRESIDENT) sees Coding Club in /api/president/clubs
      const studentClubs = await studentAgent.get('/api/president/clubs');
      expect(studentClubs.status).toBe(200);
      expect(
        studentClubs.body.data.some(
          (c: { id: string; myRole: string }) => c.id === clubId && c.myRole === 'PRESIDENT'
        )
      ).toBe(true);
    });
  });
});
