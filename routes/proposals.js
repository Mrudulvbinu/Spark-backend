// routes/proposals.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const RegisteredHackathon = require('../modules/registeredhackathon');

// Get all proposals for an organizer
router.get('/', async (req, res) => {
  try {
    const { organizerId } = req.query;
    console.log(`Fetching proposals for organizer: ${organizerId}`);

    const proposals = await RegisteredHackathon.find({ organizerId })
      .populate('hackathonId', 'name')
      .sort({ registrationDate: -1 });
    
    console.log('Proposals found:', proposals.length);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(proposals);

    const count = await RegisteredHackathon.countDocuments({ organizerId });
    console.log(`Total proposals for ${organizerId}: ${count}`);
  } catch (err) {
    console.error('Error fetching proposals:', err);
    res.status(500).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Approve a proposal
router.put('/:id/approve', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid proposal ID' });
    }

    const updatedProposal = await RegisteredHackathon.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).populate('hackathonId', 'ename date venue isTeamHackathon');
    
    if (!updatedProposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    res.json(updatedProposal);
  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ 
      message: 'Server error during approval',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Reject a proposal
router.put('/:id/reject', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid proposal ID' });
    }

    const updatedProposal = await RegisteredHackathon.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('hackathonId', 'ename date venue isTeamHackathon');
    
    if (!updatedProposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    res.json(updatedProposal);
  } catch (err) {
    console.error('Rejection error:', err);
    res.status(500).json({ 
      message: 'Server error during rejection',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;