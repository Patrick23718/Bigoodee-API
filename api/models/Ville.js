const mongoose = require("mongoose");

const VilleSchema = new mongoose.Schema({
  nom: {
    type: String,
    default: "user",
    required: true,
  },
});

module.exports = mongoose.model("ville", VilleSchema);
