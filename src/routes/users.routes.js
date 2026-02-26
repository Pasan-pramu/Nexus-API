import express from 'express';
import {
  fetchAllUsers,
  fetchUserById,
  updateUserById,
  deleteUserById,
} from '#controllers/users.controller.js';
import { authenticate } from '#middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, fetchAllUsers);

router.get('/:id', authenticate, fetchUserById);

router.put('/:id', authenticate, updateUserById);

router.delete('/:id', authenticate, deleteUserById);

export default router;
