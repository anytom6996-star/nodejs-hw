import { isValidObjectId } from 'mongoose';
import { Joi, Segments } from 'celebrate';
import { TAGS } from '../constants/tags.js';

const noteId = Joi.string().custom((value, helpers) => {
  if (!isValidObjectId(value)) {
    return helpers.error('any.invalid');
  }

  return value;
});

const title = Joi.string().min(1);
const content = Joi.string().allow('');
const tag = Joi.string().valid(...TAGS);

export const getAllNotesSchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(5).max(20).default(10),
    tag: tag.optional(),
    search: Joi.string().allow('').optional(),
  }),
};

export const noteIdSchema = {
  [Segments.PARAMS]: Joi.object({
    noteId: noteId.required(),
  }),
};

export const createNoteSchema = {
  [Segments.BODY]: Joi.object({
    title: title.required(),
    content: content.optional(),
    tag: tag.optional(),
  }),
};

export const updateNoteSchema = {
  [Segments.PARAMS]: Joi.object({
    noteId: noteId.required(),
  }),
  [Segments.BODY]: Joi.object({
    title: title.optional(),
    content: content.optional(),
    tag: tag.optional(),
  }).min(1),
};