import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

 //User Interface - Defines the structure of a User document
export interface IUser extends Document {
  userId: string;
  userName: string;
  email: string;
  passwordHash: string;
  apiKeys: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  generateApiKey(): string;
  hasApiKey(apiKey: string): boolean;
  revokeApiKey(apiKey: string): Promise<IUser>;
}

 //User Schema - MongoDB schema definition
const UserSchema: Schema<IUser> = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },
    userName: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (email: string) {
          // Email validation regex
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Don't return password hash in queries by default
    },
    apiKeys: {
      type: [String],
      default: [],
      select: false, // Don't return API keys in queries by default
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
    collection: 'users', // Explicit collection name
  }
);

 //Indexes for performance optimization
UserSchema.index({ email: 1 }); // Single field index on email
UserSchema.index({ userId: 1 }); // Single field index on userId
UserSchema.index({ createdAt: -1 }); // Index for sorting by creation date

 //Instance Method: Generate a new API key
UserSchema.methods.generateApiKey = function (): string {
  // Generate a random 32-byte hex string
  const apiKey = crypto.randomBytes(32).toString('hex');
  
  // Add to user's API keys array
  this.apiKeys.push(apiKey);
  return apiKey;
};

 //Instance Method: Check if user has a specific API key
UserSchema.methods.hasApiKey = function (apiKey: string): boolean {
  return this.apiKeys.includes(apiKey);
};

 //Instance Method: Revoke an API key
UserSchema.methods.revokeApiKey = async function (apiKey: string): Promise<IUser> {
  this.apiKeys = this.apiKeys.filter((key: string) => key !== apiKey);
  return await this.save();
};

 //Pre-save hook: Validate before saving
UserSchema.pre('save', function (next) {
  // Ensure userId is generated if not present
  if (!this.userId) {
    this.userId = uuidv4();
  }
  next();
});

 //Static method: Find user by email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

 //Static method: Find user by userId
UserSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId });
};

//JSON transformation: Remove sensitive fields when converting to JSON
UserSchema.set('toJSON', {
  transform: function (_doc, ret) {
    // Keep only necessary fields
    return {
      userId: ret.userId,
      userName: ret.userName,
      email: ret.email,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
    };
  },
});

 //Create and export the User model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
