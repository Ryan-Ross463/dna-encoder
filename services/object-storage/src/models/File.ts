import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * File Interface - Defines the structure of a File document
 * Represents uploaded files and their metadata in the DNA Encoder system
 */
export interface IFile extends Document {
  fileId: string;
  ownerUserId: string;
  
  // File metadata
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  
  // Storage information
  storageLocation: string;
  storageType: 'local' | 'cloud';
  
  // DNA encoding information (populated after encoding)
  isEncoded: boolean;
  encodedSize?: number;
  encodingMethod?: 'fountain' | 'reed-solomon' | 'hedges';
  sequenceData?: string;
  
  // Status tracking
  status: 'uploaded' | 'encoding' | 'encoded' | 'decoding' | 'decoded' | 'error';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markAsEncoding(): Promise<IFile>;
  markAsEncoded(method: string, sequenceData: string, encodedSize: number): Promise<IFile>;
  markAsDecoding(): Promise<IFile>;
  markAsDecoded(): Promise<IFile>;
  markAsError(): Promise<IFile>;
}

export interface IFileModel extends Model<IFile> {
  findByOwner(ownerUserId: string): Promise<IFile[]>;
  findByFileId(fileId: string): Promise<IFile | null>;
  findEncodedByOwner(ownerUserId: string): Promise<IFile[]>;
}

 //File Schema - MongoDB schema definition for file documents
const FileSchema: Schema<IFile> = new Schema(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    ownerUserId: {
      type: String,
      required: [true, 'Owner user ID is required'],
      ref: 'User', 
    },
    
    // File metadata
    originalFileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    
    // Storage information
    storageLocation: {
      type: String,
      required: [true, 'Storage location is required'],
      trim: true,
    },
    storageType: {
      type: String,
      enum: ['local', 'cloud'],
      default: 'local',
      required: true,
    },
    
    // DNA encoding information
    isEncoded: {
      type: Boolean,
      default: false,
      // Index defined below in compound indexes
    },
    encodedSize: {
      type: Number,
      min: [0, 'Encoded size cannot be negative'],
    },
    encodingMethod: {
      type: String,
      enum: ['fountain', 'reed-solomon', 'hedges'],
    },
    sequenceData: {
      type: String,
      select: false, // Don't return sequence data by default (can be very large)
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ['uploaded', 'encoding', 'encoded', 'decoding', 'decoded', 'error'],
      default: 'uploaded',
      required: true,
      // Index defined below in compound indexes
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
    collection: 'files', // Explicit collection name
  }
);

 //Indexes for performance optimization
// Note: fileId has unique: true which automatically creates an index
FileSchema.index({ ownerUserId: 1 }); // Single field index on ownerUserId
FileSchema.index({ ownerUserId: 1, createdAt: -1 }); // Compound index for user's files sorted by date
FileSchema.index({ status: 1, createdAt: -1 }); // Index for filtering by status
FileSchema.index({ isEncoded: 1 }); // Index for encoded files

 //Instance Method: Mark file as being encoded
FileSchema.methods.markAsEncoding = async function (): Promise<IFile> {
  this.status = 'encoding';
  return await this.save();
};

 //Instance Method: Mark file as successfully encoded
FileSchema.methods.markAsEncoded = async function (
  method: string,
  sequenceData: string,
  encodedSize: number
): Promise<IFile> {
  this.status = 'encoded';
  this.isEncoded = true;
  this.encodingMethod = method as 'fountain' | 'reed-solomon' | 'hedges';
  this.sequenceData = sequenceData;
  this.encodedSize = encodedSize;
  return await this.save();
};

 //Instance Method: Mark file as being decoded
FileSchema.methods.markAsDecoding = async function (): Promise<IFile> {
  this.status = 'decoding';
  return await this.save();
};

 //Instance Method: Mark file as successfully decoded
FileSchema.methods.markAsDecoded = async function (): Promise<IFile> {
  this.status = 'decoded';
  return await this.save();
};

 //Instance Method: Mark file as having an error
FileSchema.methods.markAsError = async function (): Promise<IFile> {
  this.status = 'error';
  return await this.save();
};

 //Static method: Find all files by owner
FileSchema.statics.findByOwner = function (ownerUserId: string) {
  return this.find({ ownerUserId }).sort({ createdAt: -1 });
};

 //Static method: Find file by fileId
FileSchema.statics.findByFileId = function (fileId: string) {
  return this.findOne({ fileId });
};

  //Static method: Find encoded files by owner
FileSchema.statics.findEncodedByOwner = function (ownerUserId: string) {
  return this.find({ ownerUserId, isEncoded: true }).sort({ createdAt: -1 });
};

 //Pre-save hook: Validate before saving
FileSchema.pre('save', function (next) {
  // Ensure fileId is generated if not present
  if (!this.fileId) {
    this.fileId = uuidv4();
  }
  next();
});

 //JSON transformation: Control which fields are returned
FileSchema.set('toJSON', {
  transform: function (_doc, ret: any) {
    // Return all fields except internal MongoDB fields
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

 //Create and export the File model
const File = mongoose.model<IFile, IFileModel>('File', FileSchema);
export default File;
