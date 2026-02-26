//This is the model for the page collection in the database. It defines the schema for a page and exports the model for use in other parts of the application.

//Require mongoose to define the schema and model for pages
const mongoose = require('mongoose');

//Definition for the page schema
const pageSchema = new mongoose.Schema({
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    pageNumber: { type: Number, required: true },
    heading: { type: String, required: true },
    body: { type: String, required: true },
    imageUrl: { type: String }, //stores location of uploaded images
}, { timestamps: true });

//`Export the page model for use in other parts of the application
module.exports = mongoose.model('Page', pageSchema);
