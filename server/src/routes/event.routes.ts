import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { createEventSchema, updateEventSchema } from '../validators/domain.validator.js';

const router = Router();

router.get('/', optionalAuth, eventController.listEvents);
router.get('/:id', optionalAuth, eventController.getEvent);
router.post('/', requireAuth, validateRequest({ body: createEventSchema }), eventController.createEvent);
router.patch('/:id', requireAuth, validateRequest({ body: updateEventSchema }), eventController.updateEvent);
router.delete('/:id', requireAuth, eventController.deleteEvent);

router.post('/:id/register', requireAuth, eventController.registerEvent);
router.delete('/:id/register', requireAuth, eventController.unregisterEvent);
router.get('/:id/attendees', requireAuth, eventController.getAttendees);

export default router;
