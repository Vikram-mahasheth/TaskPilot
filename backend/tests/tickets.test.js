import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import app from '../server.js'; // Import the app definition, which is now safe
import mongoose from 'mongoose';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

// Mock the email utility to prevent actual emails from being sent during tests
jest.mock('../utils/email.js', () => ({
    sendEmail: jest.fn(),
}));

describe('Ticket API Routes', () => {
    let adminToken, userToken, user, adminUser, userTicketId;

    // Before each test, set up an admin user, a regular user, and a ticket
    beforeEach(async () => {
        // The first user registered is automatically an admin
        const adminRes = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Admin', email: 'admin@example.com', password: 'password123' });
        adminToken = adminRes.body.token;
        adminUser = adminRes.body.user;

        // The second user is a regular user
        const userRes = await request(app)
            .post('/api/auth/register')
            .send({ name: 'User', email: 'user@example.com', password: 'password123' });
        userToken = userRes.body.token;
        user = userRes.body.user;

        // Create one ticket as the regular user
        const ticketRes = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ title: 'User Test Ticket', description: 'A ticket by a regular user' });
        userTicketId = ticketRes.body.data._id;
    });

    describe('POST /api/tickets', () => {
        it('should create a new ticket when authenticated', async () => {
            const res = await request(app)
                .post('/api/tickets')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: 'New Ticket', description: 'Description here' });
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('New Ticket');
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .post('/api/tickets')
                .send({ title: 'Unauthorized Ticket', description: 'This should fail' });
            
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/tickets', () => {
        it('should return only the user\'s own tickets', async () => {
            const res = await request(app)
                .get('/api/tickets')
                .set('Authorization', `Bearer ${userToken}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].title).toBe('User Test Ticket');
        });

        it('should return all tickets for an admin user', async () => {
            // Create a second ticket as admin
             await request(app)
                .post('/api/tickets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Admin Ticket', description: 'A ticket by admin' });

            const res = await request(app)
                .get('/api/tickets')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBe(2);
        });
    });
    
    describe('GET /api/tickets/:id', () => {
        it('should return a single ticket if user is the owner', async () => {
            const res = await request(app)
                .get(`/api/tickets/${userTicketId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data._id).toBe(userTicketId);
        });
        
        it('should return a ticket if user is an admin, even if not owner', async () => {
            const res = await request(app)
                .get(`/api/tickets/${userTicketId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data._id).toBe(userTicketId);
        });

        it('should return 403 if user is not the owner and not an admin', async () => {
            // Create a second user and try to access the first user's ticket
            const otherUserRes = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Other User', email: 'other@example.com', password: 'password123' });
            const otherToken = otherUserRes.body.token;

            const res = await request(app)
                .get(`/api/tickets/${userTicketId}`)
                .set('Authorization', `Bearer ${otherToken}`);
            
            expect(res.statusCode).toEqual(403);
        });
    });

    describe('PUT /api/tickets/:id', () => {
        it('should allow a logged-in user to update a ticket status', async () => {
            const res = await request(app)
                .put(`/api/tickets/${userTicketId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'In Progress' });
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.status).toBe('In Progress');
        });
    });

    describe('DELETE /api/tickets/:id', () => {
        it('should NOT allow a regular user to delete a ticket', async () => {
            const res = await request(app)
                .delete(`/api/tickets/${userTicketId}`)
                .set('Authorization', `Bearer ${userToken}`);
            
            expect(res.statusCode).toEqual(403);
        });

        it('should allow an admin to delete a ticket', async () => {
            const res = await request(app)
                .delete(`/api/tickets/${userTicketId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Ticket deleted successfully');

            const findRes = await Ticket.findById(userTicketId);
            expect(findRes).toBeNull();
        });
    });
});
