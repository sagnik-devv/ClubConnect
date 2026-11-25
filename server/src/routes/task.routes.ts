import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  assignTaskSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../validators/domain.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', taskController.listTasks);
router.get('/:id', taskController.getTask);
router.post('/', validateRequest({ body: createTaskSchema }), taskController.createTask);
router.patch('/:id', validateRequest({ body: updateTaskSchema }), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

router.patch('/:id/status', validateRequest({ body: updateTaskStatusSchema }), taskController.updateTaskStatus);
router.patch('/:id/assign', validateRequest({ body: assignTaskSchema }), taskController.assignTask);
router.get('/:id/activity', taskController.getTaskActivity);

export default router;
