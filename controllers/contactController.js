const EmailService = require('../services/EmailService');
const Contact = require('../models/Contact');

// Create contact submission
exports.createContactSubmission = async (req, res) => {
  try {
    const { name, email, phone, subject, category, message, priority } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !category || !message || !priority) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Create contact submission object
    const contactSubmission = {
      name,
      email,
      phone: phone || null,
      subject,
      category,
      message,
      priority,
      ticketId: generateTicketId()
    };

    // Save to database
    const contact = new Contact(contactSubmission);
    const savedContact = await contact.save();

    console.log('New contact submission saved:', savedContact.ticketId);

    // Send notification emails (if configured)
    try {
      const emailService = new EmailService();
      await emailService.sendContactConfirmationEmail(savedContact);
      await emailService.sendContactNotificationEmail(savedContact);
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
      data: {
        ticketId: savedContact.ticketId,
        status: savedContact.status,
        submissionId: savedContact._id
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing your request. Please try again.'
    });
  }
};

// Generate unique ticket ID
function generateTicketId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MS-${timestamp.slice(-6)}-${random}`;
}

// Get contact statistics (for admin dashboard)
exports.getContactStats = async (req, res) => {
  try {
    const stats = await Contact.getStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contact statistics'
    });
  }
};

// Get all contact submissions with filtering and pagination (for admin)
exports.getContactSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get contacts with pagination
    const contacts = await Contact.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email')
      .populate('responses.responder', 'name email');

    // Get total count for pagination
    const total = await Contact.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNext: skip + contacts.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get contact submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contact submissions'
    });
  }
};

// Get single contact submission by ticket ID
exports.getContactByTicketId = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const contact = await Contact.findOne({ ticketId })
      .populate('assignedTo', 'name email')
      .populate('responses.responder', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Get contact by ticket ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contact submission'
    });
  }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, assignedTo } = req.body;

    const updateData = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const contact = await Contact.findOneAndUpdate(
      { ticketId },
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
    });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating contact status'
    });
  }
};

// Add response to contact submission
exports.addContactResponse = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, isInternal = false } = req.body;
    const { user } = req; // Assuming user is set by auth middleware

    const contact = await Contact.findOne({ ticketId });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    const response = {
      message,
      responder: user._id,
      responderName: user.name,
      isInternal
    };

    contact.responses.push(response);
    await contact.save();

    // Populate the new response
    await contact.populate('responses.responder', 'name email');

    res.status(201).json({
      success: true,
      message: 'Response added successfully',
      data: contact.responses[contact.responses.length - 1]
    });
  } catch (error) {
    console.error('Add contact response error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding response'
    });
  }
};