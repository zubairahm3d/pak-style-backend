const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema],
  lastMessage: {
    type: Date,
    default: Date.now
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: () => new Map()
  }
}, {
  timestamps: true
});

// Method to calculate unread messages for a user
conversationSchema.methods.getUnreadCount = function(userId) {
  return this.messages.reduce((count, message) => {
    if (message.sender.toString() !== userId.toString() && !message.read) {
      return count + 1;
    }
    return count;
  }, 0);
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;