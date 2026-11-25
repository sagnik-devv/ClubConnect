import { NextFunction, Request, Response } from 'express';
import { TaskPriority, TaskStatus } from '@prisma/client';
import * as taskService from '../services/task.service.js';
import { getParam, sendSuccess } from '../utils/apiResponse.js';

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await taskService.listTasks(req.user!.id, req.user!.globalRole, {
      clubId: (getParam(req, 'clubId') || req.query.clubId) as string | undefined,
      status: req.query.status as TaskStatus | undefined,
      priority: req.query.priority as TaskPriority | undefined,
      assignedToId: req.query.assignedToId as string | undefined,
      dueBefore: req.query.dueBefore as string | undefined,
      sort: req.query.sort as 'dueDate' | 'createdAt' | undefined,
    });
    return sendSuccess(res, tasks, 'Tasks retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await taskService.getTaskById(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, task, 'Task retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await taskService.createTask(req.user!.id, req.user!.globalRole, req.body);
    return sendSuccess(res, task, 'Task created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await taskService.updateTask(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      req.body
    );
    return sendSuccess(res, task, 'Task updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await taskService.updateTaskStatus(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      req.body.status
    );
    return sendSuccess(res, task, 'Task status updated');
  } catch (err) {
    next(err);
  }
}

export async function assignTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await taskService.assignTask(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole,
      req.body.assignedToId
    );
    return sendSuccess(res, task, 'Task assigned');
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    await taskService.deleteTask(getParam(req, 'id'), req.user!.id, req.user!.globalRole);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getTaskActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const activity = await taskService.getTaskActivity(
      getParam(req, 'id'),
      req.user!.id,
      req.user!.globalRole
    );
    return sendSuccess(res, activity, 'Task activity retrieved');
  } catch (err) {
    next(err);
  }
}
