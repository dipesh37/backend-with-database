const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/backend");

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // this assumes you already have a "user" model elsewhere
  },
  date: {
    type: Date,
    default: Date.now,
  },
  content: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
});

module.exports = mongoose.model("Post", postSchema);
