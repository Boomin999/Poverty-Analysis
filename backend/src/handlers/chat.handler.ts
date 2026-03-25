import type { Request, Response } from 'express';
import { chatRequestSchema, chatResponseSchema } from '../schemas/chat.schema.ts';
import { answerQuestion } from '../services/chat.service.ts';
import { validateRequest, validateResponse } from '../utils/validation.utils.ts';

export function postChatHandler(req: Request, res: Response) {
  const request = validateRequest(chatRequestSchema, req.body, 'INVALID_CHAT_REQUEST');
  const response = answerQuestion(request);
  res.json(validateResponse(chatResponseSchema, response, 'INVALID_CHAT_RESPONSE'));
}
