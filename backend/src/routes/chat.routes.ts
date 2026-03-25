import { Router } from 'express';
import { postChatHandler } from '../handlers/chat.handler.ts';

const router = Router();

router.post('/', postChatHandler);

export default router;
