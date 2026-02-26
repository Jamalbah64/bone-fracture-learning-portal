//Model that tracks which chapter/page a user has completed

//Require mongoose to define the schema and model for progress
const mongoose = require('mongoose');

//Definition for the progress schema
const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    currentPage: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
}, { timestamps: true });

//Export the progress model for use in other parts of the application
module.exports = mongoose.model('Progress', progressSchema);
