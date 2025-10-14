import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

 //JWTToken Interface - Defines the structure of a JWTToken document
export interface IJWTToken extends Document {
  tokenId: string;
  ownerUserId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  revoke(): Promise<IJWTToken>;
  isExpired(): boolean;
  isValid(): boolean;
}

 //JWTToken Schema - MongoDB schema definition
const JWTTokenSchema: Schema<IJWTToken> = new Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },
    ownerUserId: {
      type: String,
      required: [true, 'Owner user ID is required'],
      ref: 'User', // Reference to User model
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
    collection: 'jwttokens', // Explicit collection name
  }
);

 //Indexes for performance optimization
JWTTokenSchema.index({ tokenId: 1 }); // Single field index on tokenId
JWTTokenSchema.index({ ownerUserId: 1 }); // Single field index on ownerUserId
JWTTokenSchema.index({ token: 1 }); // Single field index on token
JWTTokenSchema.index({ expiresAt: 1 }); // Index for expiration queries
JWTTokenSchema.index({ isRevoked: 1 }); // Index for revoked status
JWTTokenSchema.index({ ownerUserId: 1, isRevoked: 1 }); // Compound index for user's active tokens

 //Instance Method: Revoke the token
JWTTokenSchema.methods.revoke = async function (): Promise<IJWTToken> {
  this.isRevoked = true;
  return await this.save();
};

 //Instance Method: Check if token is expired
JWTTokenSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};


 //Instance Method: Check if token is valid (not expired and not revoked)
JWTTokenSchema.methods.isValid = function (): boolean {
  return !this.isExpired() && !this.isRevoked;
};

 //Pre-save hook: Validate before saving
JWTTokenSchema.pre('save', function (next) {
  // Ensure tokenId is generated if not present
  if (!this.tokenId) {
    this.tokenId = uuidv4();
  }
  next();
});

 //Static method: Find token by token string
JWTTokenSchema.statics.findByToken = function (token: string) {
  return this.findOne({ token });
};

 //Static method: Find all tokens for a user
JWTTokenSchema.statics.findByUserId = function (userId: string) {
  return this.find({ ownerUserId: userId });
};

 //Static method: Find all active (valid) tokens for a user
JWTTokenSchema.statics.findActiveTokensByUserId = function (userId: string) {
  return this.find({
    ownerUserId: userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }, // Not expired
  });
};

 //Static method: Revoke all tokens for a user (logout from all devices)
JWTTokenSchema.statics.revokeAllUserTokens = function (userId: string) {
  return this.updateMany(
    { ownerUserId: userId, isRevoked: false },
    { $set: { isRevoked: true } }
  );
};

 //Static method: Clean up expired tokens (maintenance)
JWTTokenSchema.statics.cleanupExpiredTokens = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

 //JSON transformation: Format output when converting to JSON
JWTTokenSchema.set('toJSON', {
  transform: function (_doc, ret) {
    // Return formatted object without sensitive fields
    return {
      tokenId: ret.tokenId,
      ownerUserId: ret.ownerUserId,
      expiresAt: ret.expiresAt,
      isRevoked: ret.isRevoked,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
    };
  },
});

//Create and export the JWTToken model
const JWTToken: Model<IJWTToken> = mongoose.model<IJWTToken>('JWTToken', JWTTokenSchema);
export default JWTToken;
