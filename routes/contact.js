const express = require('express');
const {
  createContactSubmission,
  getContactStats,
  getContactSubmissions,
  getContactByTicketId,
  updateContactStatus,
  addContactResponse
} = require('../controllers/contactController');

const router = express.Router();

// Public routes
router.post('/', createContactSubmission);

// Admin routes (in a real app, these would be protected with authentication middleware)
router.get('/stats', getContactStats);
router.get('/submissions', getContactSubmissions);
router.get('/:ticketId', getContactByTicketId);
router.patch('/:ticketId/status', updateContactStatus);
router.post('/:ticketId/responses', addContactResponse);

module.exports = router;