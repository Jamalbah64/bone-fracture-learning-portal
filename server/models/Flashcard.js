// Model for the flashcard schema

//Require mongoose to define the schema and model for flashcards
const mongoose = require('mongoose');

//Definition for the flashcard schema
const flashcardSchema = new mongoose.Schema({
    title: { type: String, required: true},
    frontText: {type: String, required: true},
    backText: {type: String, required: true},
    imageURL: {type: String},
    category: {type: String},
    chapter: {type: mongoose.Schema.Types.ObjectId, ref: 'Chapter'},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
}, {timestamps: true});

//Export the model to be used in other parts of the application
module.exports = mongoose.model('Flashcard', flashcardSchema);
