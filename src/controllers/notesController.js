
import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

export const getAllNotes = async (req, res, next) => {
  try {
    const {
      page = 1,
      perPage = 10,
      tag,
      search,
    } = req.query;

    const { _id: userId } = req.user;
    const filter = { userId };

    if (tag) {
      filter.tag = tag;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(perPage);

    const [notes, totalItems] = await Promise.all([
      Note.find(filter).skip(skip).limit(Number(perPage)),
      Note.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 200,
      message: 'Successfully found notes!',
      data: {
        notes,
        totalItems,
        page: Number(page),
        perPage: Number(perPage),
        totalPages: Math.ceil(totalItems / Number(perPage)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { _id: userId } = req.user;

    const note = await Note.findOne({
      _id: noteId,
      userId,
    });

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully found the note!',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;

    const note = await Note.create({
      ...req.body,
      userId,
    });

    res.status(201).json({
      status: 201,
      message: 'Successfully created a note!',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { _id: userId } = req.user;

    const note = await Note.findOneAndUpdate(
      {
        _id: noteId,
        userId,
      },
      req.body,
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully patched a note!',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { _id: userId } = req.user;

    const note = await Note.findOneAndDelete({
      _id: noteId,
      userId,
    });

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully deleted the note!',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};
