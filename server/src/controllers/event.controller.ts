import { NextFunction, Request, Response } from 'express';
import { EventStatus } from '@prisma/client';
import * as eventService from '../services/event.service.js';
import { getParam, sendSuccess } from '../utils/apiResponse.js';

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await eventService.listEvents(
      {
        clubId: req.query.clubId as string | undefined,
        status: req.query.status as EventStatus | undefined,
        upcoming: req.query.upcoming as string | undefined,
      },
      req.user?.id
    );
    return sendSuccess(res, events, 'Events retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const ev = await eventService.getEventById(getParam(req, 'id'), req.user?.id);
    return sendSuccess(res, ev, 'Event retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const ev = await eventService.createEvent(req.user!.id, req.user!.globalRole, req.body);
    return sendSuccess(res, ev, 'Event created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const ev = await eventService.updateEvent(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, ev, 'Event updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    await eventService.deleteEvent(getParam(req, 'id'), req.user!.id, req.user!.globalRole);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function registerEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const reg = await eventService.registerForEvent(getParam(req, 'id'), req.user!.id);
    return sendSuccess(res, reg, 'Registered for event', 201);
  } catch (err) {
    next(err);
  }
}

export async function unregisterEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const reg = await eventService.cancelEventRegistration(getParam(req, 'id'), req.user!.id);
    return sendSuccess(res, reg, 'Event registration cancelled');
  } catch (err) {
    next(err);
  }
}

export async function getAttendees(req: Request, res: Response, next: NextFunction) {
  try {
    const attendees = await eventService.getEventAttendees(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, attendees, 'Event attendees retrieved');
  } catch (err) {
    next(err);
  }
}

export async function listMyEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await eventService.listMyEvents(req.user!.id);
    return sendSuccess(res, events, 'My registered events retrieved');
  } catch (err) {
    next(err);
  }
}
