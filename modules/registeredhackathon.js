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
    leaderName: {
        type: String,
        required: true
    },
    datebirth: {
        type: String,
        required: true
    },
    leaderEmail: {
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
        required: function() { return this.isTeam; } // Only required if isTeam is true
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
    }
});

module.exports = mongoose.model('RegisteredHackathon', RegisteredHackathonSchema);
