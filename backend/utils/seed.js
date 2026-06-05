require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Task = require('../models/Task');
const Note = require('../models/Note');
const Schedule = require('../models/Schedule');
const FocusSession = require('../models/FocusSession');
const ChatMessage = require('../models/ChatMessage');

const days = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const seed = async () => {
  try {
    await connectDB();
    console.log('Wiping collections...');
    await Promise.all([
      User.deleteMany({}),
      Task.deleteMany({}),
      Note.deleteMany({}),
      Schedule.deleteMany({}),
      FocusSession.deleteMany({}),
      ChatMessage.deleteMany({}),
    ]);

    console.log('Creating demo user (demo@smartstudy.app / password123)...');
    const user = await User.create({
      name: 'Alex Morgan',
      email: 'demo@smartstudy.app',
      password: 'password123',
      bio: 'CS undergrad obsessed with clean notes and deep work.',
      preferences: { theme: 'dark', dailyGoalHours: 4 },
      streak: { current: 5, best: 12, lastActive: new Date() },
      isVerified: true,
    });

    console.log('Seeding tasks...');
    await Task.insertMany([
      { userId: user._id, title: 'Read Chapter 5 - Operating Systems', subject: 'CS', priority: 'high', status: 'in-progress', deadline: days(1) },
      { userId: user._id, title: 'Complete Calculus problem set 3', subject: 'Math', priority: 'high', status: 'pending', deadline: days(2) },
      { userId: user._id, title: 'Write essay on Renaissance art', subject: 'History', priority: 'medium', status: 'pending', deadline: days(5) },
      { userId: user._id, title: 'Review Spanish vocabulary deck', subject: 'Languages', priority: 'low', status: 'completed', deadline: days(-1), completedAt: days(-1) },
      { userId: user._id, title: 'Prepare presentation slides', subject: 'Business', priority: 'medium', status: 'in-progress', deadline: days(3) },
      { userId: user._id, title: 'Watch lecture: Neural Networks intro', subject: 'CS', priority: 'medium', status: 'pending', deadline: days(0) },
      { userId: user._id, title: 'Solve 10 LeetCode mediums', subject: 'CS', priority: 'high', status: 'completed', deadline: days(-2), completedAt: days(-2) },
      { userId: user._id, title: 'Outline thesis introduction', subject: 'Research', priority: 'high', status: 'pending', deadline: days(7) },
    ]);

    console.log('Seeding notes...');
    await Note.insertMany([
      {
        userId: user._id,
        title: 'Operating Systems - Process Scheduling',
        subject: 'CS',
        content:
          '## Scheduling algorithms\n\n- **FCFS** - simple, can cause convoy effect\n- **SJF** - optimal avg waiting, but starvation\n- **Round Robin** - fairness via time quantum\n- **Priority** - can starve low-priority tasks',
        tags: ['os', 'midterm'],
        color: 'indigo',
        pinned: true,
      },
      {
        userId: user._id,
        title: 'Calculus - Chain Rule cheat sheet',
        subject: 'Math',
        content:
          'If y = f(g(x)) then dy/dx = f\'(g(x)) * g\'(x).\n\nExamples:\n- d/dx sin(3x^2) = cos(3x^2) * 6x\n- d/dx (2x+1)^5 = 5(2x+1)^4 * 2',
        tags: ['derivatives'],
        color: 'emerald',
      },
      {
        userId: user._id,
        title: 'Renaissance art - key figures',
        subject: 'History',
        content:
          'Da Vinci, Michelangelo, Raphael, Donatello.\nKey ideas: humanism, perspective, classical revival.',
        tags: ['essay', 'art'],
        color: 'rose',
      },
      {
        userId: user._id,
        title: 'Neural Networks - layers',
        subject: 'CS',
        content:
          'Input layer -> hidden layers (weights + activation) -> output.\nCommon activations: ReLU, Sigmoid, Tanh, Softmax.',
        tags: ['ai', 'ml'],
        color: 'violet',
      },
    ]);

    console.log('Seeding schedule...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Schedule.insertMany([
      { userId: user._id, title: 'Morning deep work - OS', subject: 'CS', date: today, startTime: '08:00', endTime: '10:00', color: 'indigo' },
      { userId: user._id, title: 'Calculus practice', subject: 'Math', date: today, startTime: '11:00', endTime: '12:30', color: 'emerald' },
      { userId: user._id, title: 'History reading', subject: 'History', date: days(1), startTime: '15:00', endTime: '16:30', color: 'rose' },
      { userId: user._id, title: 'ML lecture review', subject: 'CS', date: days(2), startTime: '09:00', endTime: '10:30', color: 'violet' },
      { userId: user._id, title: 'Spanish flashcards', subject: 'Languages', date: days(3), startTime: '20:00', endTime: '20:30', color: 'amber' },
    ]);

    console.log('Seeding focus sessions for last 7 days...');
    const sessions = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const count = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < count; j++) {
        sessions.push({
          userId: user._id,
          subject: ['CS', 'Math', 'History', 'Languages'][Math.floor(Math.random() * 4)],
          durationMinutes: 25,
          type: 'focus',
          completedAt: new Date(d.getTime() + j * 30 * 60 * 1000),
        });
      }
    }
    await FocusSession.insertMany(sessions);

    console.log('\n✅ Seeded successfully!');
    console.log('Demo login: demo@smartstudy.app / password123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
