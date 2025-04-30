const mongoose = require('mongoose');

const RegisteredHackathonSchema = new mongoose.Schema({
    hackathonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hackathon',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentUser',
        required: true
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizerUser',
        required: true
    },
    orgname: {
        type: String,
        required: true
    },

    // For team registrations
    leaderName: {
        type: String,
        required: function() { return this.isTeam; }
    },
    // For team registrations
    leaderEmail: {
        type: String,
        required: function() { return this.isTeam; }
    },
    // For solo registrations
    name: {
        type: String,
        required: function() { return !this.isTeam; }
    },
    // For solo registrations
    email: {
        type: String,
        required: function() { return !this.isTeam; }
    },
    datebirth: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    hasParticipated: {
        type: String,
        enum: ['yes', 'no'],
        required: true
    },
    teamName: {
        type: String,
        required: function() { return this.isTeam; }
    },
    isTeam: {
        type: Boolean,
        required: true
    },
    members: {
        type: [{ name: String, email: String, dob: String }],
        default: []
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    proposal: {
        url: String,
        publicId: String,   
        originalName: String,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }    
});

module.exports = mongoose.model('RegisteredHackathon', RegisteredHackathonSchema);